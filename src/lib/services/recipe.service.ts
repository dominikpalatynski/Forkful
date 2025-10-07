import type { SupabaseClientType } from "../../db/supabase.client";
import type {
  CreateRecipeCommand,
  RecipeDetailDto,
  PaginatedRecipesDto,
  RecipeListItemDto
} from "../../types";
import type { GetRecipesSchemaType } from "../schemas/recipe.schema";


import { 
  SupabaseRecipeWithJoinsSchema, 
  RecipeListResultSchema,
} from "../schemas/recipe.schema";

/**
 * Custom error classes for recipe service operations
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Service for handling recipe-related business logic and database operations.
 */
export class RecipeService {
  constructor(private supabase: SupabaseClientType) {}

  /**
   * Creates a new recipe with ingredients, steps, and tags in a transactional manner.
   * If any operation fails, all changes are rolled back.
   * 
   * @param data - The recipe data from CreateRecipeCommand
   * @param userId - The authenticated user's ID
   * @returns The newly created recipe with full details
   * @throws Error if any database operation fails
   */
  async createRecipe(
    data: CreateRecipeCommand,
    userId: string
  ): Promise<RecipeDetailDto> {
    let recipeId: string | null = null;

    try {
      // Step 1: Insert the recipe
      const { data: recipeData, error: recipeError } = await this.supabase
        .from("recipes")
        .insert({
          name: data.name,
          description: data.description ?? null,
          generation_id: data.generationId ?? null,
          user_id: userId,
        })
        .select("id")
        .single();

      if (recipeError || !recipeData) {
        throw new Error(`Failed to create recipe: ${recipeError?.message ?? "Unknown error"}`);
      }

      recipeId = recipeData.id;

      // Step 2: Insert ingredients if provided
      if (data.ingredients && data.ingredients.length > 0) {
        const ingredientsToInsert = data.ingredients.map((ingredient) => ({
          recipe_id: recipeId!,
          content: ingredient.content,
          position: ingredient.position,
        }));

        const { error: ingredientsError } = await this.supabase
          .from("ingredients")
          .insert(ingredientsToInsert);

        if (ingredientsError) {
          throw new Error(`Failed to insert ingredients: ${ingredientsError.message}`);
        }
      }

      // Step 3: Insert steps if provided
      if (data.steps && data.steps.length > 0) {
        const stepsToInsert = data.steps.map((step) => ({
          recipe_id: recipeId!,
          content: step.content,
          position: step.position,
        }));

        const { error: stepsError } = await this.supabase
          .from("steps")
          .insert(stepsToInsert);

        if (stepsError) {
          throw new Error(`Failed to insert steps: ${stepsError.message}`);
        }
      }

      // Step 4: Handle tags - create or link existing ones
      if (data.tags && data.tags.length > 0) {
        const tagIds: string[] = [];

        for (const tagName of data.tags) {
          // Check if tag already exists for this user
          const { data: existingTag } = await this.supabase
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .eq("user_id", userId)
            .single();

          let tagId: string;

          if (existingTag) {
            // Tag exists, use its ID
            tagId = existingTag.id;
          } else {
            // Tag doesn't exist, create it
            const { data: newTag, error: tagError } = await this.supabase
              .from("tags")
              .insert({
                name: tagName,
                user_id: userId,
              })
              .select("id")
              .single();

            if (tagError || !newTag) {
              throw new Error(`Failed to create tag '${tagName}': ${tagError?.message ?? "Unknown error"}`);
            }

            tagId = newTag.id;
          }

          tagIds.push(tagId);
        }

        // Create recipe-tag associations
        if (tagIds.length > 0) {
          const recipeTagsToInsert = tagIds.map((tagId) => ({
            recipe_id: recipeId!,
            tag_id: tagId,
          }));

          const { error: recipeTagsError } = await this.supabase
            .from("recipe_tags")
            .insert(recipeTagsToInsert);

          if (recipeTagsError) {
            throw new Error(`Failed to link tags to recipe: ${recipeTagsError.message}`);
          }
        }
      }

      // Step 5: Update generation record if generationId is provided
      if (data.generationId) {
        const { error: generationError } = await this.supabase
          .from("generation")
          .update({ is_accepted: true })
          .eq("id", data.generationId)
          .eq("user_id", userId);

        if (generationError) {
          throw new Error(`Failed to update generation record: ${generationError.message}`);
        }
      }

      // Step 6: Fetch and return the complete recipe with all related data
      return await this.getRecipeById(recipeId, userId);
    } catch (error) {
      // Rollback: delete all created data if recipe was created
      if (recipeId) {
        await this.rollbackRecipe(recipeId);
      }

      // Re-throw the error for the caller to handle
      throw error;
    }
  }

  /**
   * Rolls back a recipe creation by deleting all related data.
   * Used when an error occurs during recipe creation.
   * 
   * @param recipeId - The recipe ID to rollback
   */
  private async rollbackRecipe(recipeId: string): Promise<void> {
    try {
      // Delete in reverse order due to foreign key constraints
      await this.supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);
      await this.supabase.from("steps").delete().eq("recipe_id", recipeId);
      await this.supabase.from("ingredients").delete().eq("recipe_id", recipeId);
      await this.supabase.from("recipes").delete().eq("id", recipeId);
    } catch (rollbackError) {
      // Log rollback errors but don't throw to avoid masking the original error
      console.error("Failed to rollback recipe creation:", rollbackError);
    }
  }

  /**
   * Retrieves a complete recipe by ID, including ingredients, steps, and tags using JOIN.
   * Implements proper authorization checking to differentiate between NotFound and Forbidden errors.
   * 
   * @param recipeId - The recipe's UUID
   * @param userId - The authenticated user's ID (for authorization)
   * @returns The recipe details
   * @throws NotFoundError if recipe doesn't exist
   * @throws ForbiddenError if user doesn't own the recipe
   * @throws Error for other database errors
   */
  async getRecipeById(
    recipeId: string,
    userId: string
  ): Promise<RecipeDetailDto> {
    // Step 1: First check if recipe exists (without user filter)
    const { data: recipeExists, error: existsError } = await this.supabase
      .from("recipes")
      .select("id, user_id")
      .eq("id", recipeId)
      .single();

    if (existsError) {
      if (existsError.code === 'PGRST116') {
        // No rows returned - recipe doesn't exist
        throw new NotFoundError(`Recipe with ID '${recipeId}' not found`);
      }
      // Other database error
      throw new Error(`Failed to check recipe existence: ${existsError.message}`);
    }

    if (!recipeExists) {
      throw new NotFoundError(`Recipe with ID '${recipeId}' not found`);
    }

    // Step 2: Check if user owns the recipe
    if (recipeExists.user_id !== userId) {
      throw new ForbiddenError(`Access denied. You don't have permission to view this recipe`);
    }

    // Step 3: Fetch recipe with all related data using JOIN
    const { data: recipe, error: recipeError } = await this.supabase
      .from("recipes")
      .select(`
        id,
        name,
        description,
        ingredients (
          id,
          content,
          position
        ),
        steps (
          id,
          content,
          position
        ),
        recipe_tags (
          tags (
            name
          )
        )
      `)
      .eq("id", recipeId)
      .eq("user_id", userId)
      .single();

    if (recipeError || !recipe) {
      throw new Error(`Failed to fetch recipe details: ${recipeError?.message ?? "Unknown error"}`);
    }

    // Step 4: Validate and parse Supabase query result with runtime type checking
    const parseResult = SupabaseRecipeWithJoinsSchema.safeParse(recipe);
    
    if (!parseResult.success) {
      throw new Error(`Invalid recipe data structure: ${parseResult.error.message}`);
    }

    const supabaseRecipe = parseResult.data;

    // Step 5: Transform Supabase structure to clean DTO structure
    const recipeDetailDto: RecipeDetailDto = {
      id: supabaseRecipe.id,
      name: supabaseRecipe.name,
      description: supabaseRecipe.description,
      ingredients: (supabaseRecipe.ingredients ?? [])
        .sort((a, b) => a.position - b.position),
      steps: (supabaseRecipe.steps ?? [])
        .sort((a, b) => a.position - b.position),
      tags: (supabaseRecipe.recipe_tags ?? [])
        .map((rt) => rt.tags?.name)
        .filter((name): name is string => !!name),
    };

    return recipeDetailDto;
  }

  /**
   * Retrieves a paginated, sortable, and filterable list of recipes for a user.
   * Supports filtering by tag, sorting by name or created_at, and pagination.
   *
   * @param userId - The authenticated user's ID
   * @param options - Query options including pagination, sorting, and filtering
   * @returns Paginated list of recipes with metadata
   * @throws Error if database operations fail
   */
  async getRecipesForUser(
    userId: string,
    options: GetRecipesSchemaType
  ): Promise<PaginatedRecipesDto> {
    const { page, pageSize, sortBy, order, tag } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      // Build the base query for recipes
      let query = this.supabase
        .from("recipes")
        .select(`
          id,
          name,
          description,
          created_at,
          recipe_tags (
            tags (
              name
            )
          )
        `, { count: 'exact' })
        .eq("user_id", userId);

      // Apply tag filter if provided
      if (tag) {
        query = query
          .eq("recipe_tags.tags.name", tag);
      }

      // Apply sorting
      const isAscending = order === 'asc';
      query = query.order(sortBy, { ascending: isAscending });

      // Apply pagination
      query = query.range(from, to);

      // Execute the query
      const { data: recipes, error: recipesError, count } = await query;

      if (recipesError) {
        throw new Error(`Failed to fetch recipes: ${recipesError.message}`);
      }

      const parseResult = RecipeListResultSchema.safeParse(recipes);

      if (!parseResult.success) {
        throw new Error(`Invalid recipe data structure: ${parseResult.error.message}`);
      }

      const recipesWithTags = parseResult.data;
            
      const recipeListItems: RecipeListItemDto[] = (recipesWithTags ?? []).map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        tags: (recipe.recipe_tags ?? [])
          .map((rt) => rt.tags?.name ?? "")
          .filter((name: string | undefined): name is string => !!name),
      }));

      // Calculate pagination metadata
      const totalItems = count ?? 0;
      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        data: recipeListItems,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Failed to get recipes for user: ${error.message}`
          : "Failed to get recipes for user: Unknown error"
      );
    }
  }
}

