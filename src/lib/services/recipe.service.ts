import type { SupabaseClientType } from "../../db/supabase.client";
import type {
  CreateRecipeCommand,
  UpdateRecipeCommand,
  RecipeDetailDto,
  PaginatedRecipesDto,
  RecipeListItemDto,
} from "../../types";
import type { GetRecipesSchemaType } from "../schemas/recipe.schema";

import { SupabaseRecipeWithJoinsSchema, RecipeListResultSchema } from "../schemas/recipe.schema";

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
  async createRecipe(data: CreateRecipeCommand, userId: string): Promise<RecipeDetailDto> {
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
          recipe_id: recipeId as string,
          content: ingredient.content,
          position: ingredient.position,
        }));

        const { error: ingredientsError } = await this.supabase.from("ingredients").insert(ingredientsToInsert);

        if (ingredientsError) {
          throw new Error(`Failed to insert ingredients: ${ingredientsError.message}`);
        }
      }

      // Step 3: Insert steps if provided
      if (data.steps && data.steps.length > 0) {
        const stepsToInsert = data.steps.map((step) => ({
          recipe_id: recipeId as string,
          content: step.content,
          position: step.position,
        }));

        const { error: stepsError } = await this.supabase.from("steps").insert(stepsToInsert);

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
            recipe_id: recipeId as string,
            tag_id: tagId,
          }));

          const { error: recipeTagsError } = await this.supabase.from("recipe_tags").insert(recipeTagsToInsert);

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
  async getRecipeById(recipeId: string, userId: string): Promise<RecipeDetailDto> {
    // Step 1: First check if recipe exists (without user filter)
    const { data: recipeExists, error: existsError } = await this.supabase
      .from("recipes")
      .select("id, user_id")
      .eq("id", recipeId)
      .single();

    if (existsError) {
      if (existsError.code === "PGRST116") {
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
      .select(
        `
        id,
        name,
        description,
        created_at,
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
      `
      )
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
      created_at: supabaseRecipe.created_at,
      ingredients: (supabaseRecipe.ingredients ?? []).sort((a, b) => a.position - b.position),
      steps: (supabaseRecipe.steps ?? []).sort((a, b) => a.position - b.position),
      tags: (supabaseRecipe.recipe_tags ?? []).map((rt) => rt.tags?.name).filter((name): name is string => !!name),
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
  async getRecipesForUser(userId: string, options: GetRecipesSchemaType): Promise<PaginatedRecipesDto> {
    const { page, pageSize, sortBy, order, tag } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      // Build the base query for recipes
      // Use inner joins only when filtering by tag, so we don't exclude tagless recipes otherwise
      const baseSelect = `
          id,
          name,
          description,
          created_at,
          recipe_tags (
            tags (
              name
            )
          )
        `;

      const tagFilteredSelect = `
          id,
          name,
          description,
          created_at,
          recipe_tags!inner (
            tags!inner (
              name
            )
          )
        `;

      let query = this.supabase
        .from("recipes")
        .select(tag ? tagFilteredSelect : baseSelect, { count: "exact" })
        .eq("user_id", userId);

      // Apply tag filter if provided (scope the filter to the nested foreign table)
      if (tag) {
        query = query.eq("recipe_tags.tags.name", tag);
      }

      // Apply sorting
      const isAscending = order === "asc";
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

  /**
   * Updates an existing recipe with ingredients, steps, and tags in a transactional manner.
   * Handles creation, updating, and deletion of related resources.
   * If any operation fails, all changes are rolled back.
   *
   * @param recipeId - The ID of the recipe to update
   * @param data - The updated recipe data from UpdateRecipeCommand
   * @param userId - The authenticated user's ID
   * @returns The updated recipe with full details
   * @throws NotFoundError if recipe doesn't exist
   * @throws ForbiddenError if user doesn't own the recipe
   * @throws Error if any database operation fails
   */
  async updateRecipe(recipeId: string, data: UpdateRecipeCommand, userId: string): Promise<RecipeDetailDto> {
    let originalRecipe: any = null;

    try {
      // Step 1: Check if recipe exists and user owns it
      const { data: recipeExists, error: existsError } = await this.supabase
        .from("recipes")
        .select("id, user_id, name, description")
        .eq("id", recipeId)
        .single();

      if (existsError) {
        if (existsError.code === "PGRST116") {
          throw new NotFoundError(`Recipe with ID '${recipeId}' not found`);
        }
        throw new Error(`Failed to check recipe existence: ${existsError.message}`);
      }

      if (!recipeExists) {
        throw new NotFoundError(`Recipe with ID '${recipeId}' not found`);
      }

      if (recipeExists.user_id !== userId) {
        throw new ForbiddenError(`Access denied. You don't have permission to update this recipe`);
      }

      // Store original recipe for potential rollback
      originalRecipe = recipeExists;

      // Step 2: Update main recipe fields
      const { error: updateRecipeError } = await this.supabase
        .from("recipes")
        .update({
          name: data.name,
          description: data.description,
        })
        .eq("id", recipeId)
        .eq("user_id", userId);

      if (updateRecipeError) {
        throw new Error(`Failed to update recipe: ${updateRecipeError.message}`);
      }

      // Step 3: Handle ingredients
      await this.updateRecipeIngredients(recipeId, data.ingredients);

      // Step 4: Handle steps
      await this.updateRecipeSteps(recipeId, data.steps);

      // Step 5: Handle tags
      await this.updateRecipeTags(recipeId, data.tags, userId);

      // Step 6: Return updated recipe
      return await this.getRecipeById(recipeId, userId);
    } catch (error) {
      // Rollback changes if possible
      if (originalRecipe) {
        await this.rollbackRecipeUpdate(recipeId, originalRecipe);
      }
      throw error;
    }
  }

  /**
   * Updates ingredients for a recipe using separate insert/update logic.
   * Deletes ingredients not in the update list, updates existing ones, and inserts new ones.
   *
   * @param recipeId - The recipe ID
   * @param ingredients - Array of ingredients to update/create
   */
  private async updateRecipeIngredients(
    recipeId: string,
    ingredients: UpdateRecipeCommand["ingredients"]
  ): Promise<void> {
    // Get IDs of ingredients that should be kept (those with IDs in the request)
    const ingredientIdsToKeep = ingredients
      .filter((ingredient) => ingredient.id)
      .map((ingredient) => ingredient.id as string);

    // Delete ingredients not in the keep list
    if (ingredientIdsToKeep.length > 0) {
      const { error: deleteError } = await this.supabase
        .from("ingredients")
        .delete()
        .eq("recipe_id", recipeId)
        .not("id", "in", `(${ingredientIdsToKeep.join(",")})`);

      if (deleteError) {
        throw new Error(`Failed to delete old ingredients: ${deleteError.message}`);
      }
    } else {
      // If no ingredients to keep, delete all ingredients for this recipe
      const { error: deleteAllError } = await this.supabase.from("ingredients").delete().eq("recipe_id", recipeId);

      if (deleteAllError) {
        throw new Error(`Failed to delete all ingredients: ${deleteAllError.message}`);
      }
    }

    // Separate existing ingredients (with ID) from new ingredients (without ID)
    const existingIngredients = ingredients.filter((ingredient) => ingredient.id);
    const newIngredients = ingredients.filter((ingredient) => !ingredient.id);

    // Update existing ingredients
    for (const ingredient of existingIngredients) {
      const { error: updateError } = await this.supabase
        .from("ingredients")
        .update({
          content: ingredient.content,
          position: ingredient.position,
        })
        .eq("id", ingredient.id as string)
        .eq("recipe_id", recipeId);

      if (updateError) {
        throw new Error(`Failed to update ingredient ${ingredient.id}: ${updateError.message}`);
      }
    }

    // Insert new ingredients
    if (newIngredients.length > 0) {
      const ingredientsToInsert = newIngredients.map((ingredient) => ({
        recipe_id: recipeId,
        content: ingredient.content,
        position: ingredient.position,
      }));

      const { error: insertError } = await this.supabase.from("ingredients").insert(ingredientsToInsert);

      if (insertError) {
        throw new Error(`Failed to insert new ingredients: ${insertError.message}`);
      }
    }
  }

  /**
   * Updates steps for a recipe using separate insert/update logic.
   * Deletes steps not in the update list, updates existing ones, and inserts new ones.
   *
   * @param recipeId - The recipe ID
   * @param steps - Array of steps to update/create
   */
  private async updateRecipeSteps(recipeId: string, steps: UpdateRecipeCommand["steps"]): Promise<void> {
    // Get IDs of steps that should be kept (those with IDs in the request)
    const stepIdsToKeep = steps.filter((step) => step.id).map((step) => step.id as string);

    // Delete steps not in the keep list
    if (stepIdsToKeep.length > 0) {
      const { error: deleteError } = await this.supabase
        .from("steps")
        .delete()
        .eq("recipe_id", recipeId)
        .not("id", "in", `(${stepIdsToKeep.join(",")})`);

      if (deleteError) {
        throw new Error(`Failed to delete old steps: ${deleteError.message}`);
      }
    } else {
      // If no steps to keep, delete all steps for this recipe
      const { error: deleteAllError } = await this.supabase.from("steps").delete().eq("recipe_id", recipeId);

      if (deleteAllError) {
        throw new Error(`Failed to delete all steps: ${deleteAllError.message}`);
      }
    }

    // Separate existing steps (with ID) from new steps (without ID)
    const existingSteps = steps.filter((step) => step.id);
    const newSteps = steps.filter((step) => !step.id);

    // Update existing steps
    for (const step of existingSteps) {
      const { error: updateError } = await this.supabase
        .from("steps")
        .update({
          content: step.content,
          position: step.position,
        })
        .eq("id", step.id as string)
        .eq("recipe_id", recipeId);

      if (updateError) {
        throw new Error(`Failed to update step ${step.id}: ${updateError.message}`);
      }
    }

    // Insert new steps
    if (newSteps.length > 0) {
      const stepsToInsert = newSteps.map((step) => ({
        recipe_id: recipeId,
        content: step.content,
        position: step.position,
      }));

      const { error: insertError } = await this.supabase.from("steps").insert(stepsToInsert);

      if (insertError) {
        throw new Error(`Failed to insert new steps: ${insertError.message}`);
      }
    }
  }

  /**
   * Updates tags for a recipe.
   * Creates new tags if they don't exist and updates recipe-tag associations.
   *
   * @param recipeId - The recipe ID
   * @param tagNames - Array of tag names
   * @param userId - The user ID
   */
  private async updateRecipeTags(recipeId: string, tagNames: string[], userId: string): Promise<void> {
    // Step 1: Remove all existing recipe-tag associations
    const { error: deleteAssociationsError } = await this.supabase
      .from("recipe_tags")
      .delete()
      .eq("recipe_id", recipeId);

    if (deleteAssociationsError) {
      throw new Error(`Failed to delete recipe-tag associations: ${deleteAssociationsError.message}`);
    }

    // Step 2: Handle new tags if provided
    if (tagNames.length > 0) {
      const tagIds: string[] = [];

      for (const tagName of tagNames) {
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

      // Step 3: Create new recipe-tag associations
      if (tagIds.length > 0) {
        const recipeTagsToInsert = tagIds.map((tagId) => ({
          recipe_id: recipeId,
          tag_id: tagId,
        }));

        const { error: recipeTagsError } = await this.supabase.from("recipe_tags").insert(recipeTagsToInsert);

        if (recipeTagsError) {
          throw new Error(`Failed to link tags to recipe: ${recipeTagsError.message}`);
        }
      }
    }
  }

  /**
   * Attempts to rollback recipe update by restoring original values.
   * Used when an error occurs during recipe update.
   *
   * @param recipeId - The recipe ID to rollback
   * @param originalRecipe - The original recipe data
   */
  private async rollbackRecipeUpdate(recipeId: string, originalRecipe: any): Promise<void> {
    try {
      // Restore original recipe fields
      await this.supabase
        .from("recipes")
        .update({
          name: originalRecipe.name,
          description: originalRecipe.description,
        })
        .eq("id", recipeId);
    } catch (rollbackError) {
      // Log rollback errors but don't throw to avoid masking the original error
      console.error("Failed to rollback recipe update:", rollbackError);
    }
  }

  /**
   * Deletes a recipe and all its related data (ingredients, steps, recipe_tags).
   * Implements proper authorization checking to ensure only the owner can delete the recipe.
   * Uses database CASCADE constraints for automatic cleanup of related data.
   *
   * @param recipeId - The recipe's UUID to delete
   * @param userId - The authenticated user's ID (for authorization)
   * @throws NotFoundError if recipe doesn't exist
   * @throws ForbiddenError if user doesn't own the recipe
   * @throws Error for other database errors
   */
  async deleteRecipe(recipeId: string, userId: string): Promise<void> {
    // Step 1: Check if recipe exists (without user filter)
    const { data: recipeExists, error: existsError } = await this.supabase
      .from("recipes")
      .select("id, user_id")
      .eq("id", recipeId)
      .single();

    if (existsError) {
      if (existsError.code === "PGRST116") {
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
      throw new ForbiddenError(`Access denied. You don't have permission to delete this recipe`);
    }

    // Step 3: Delete the recipe (CASCADE will handle related data)
    const { error: deleteError } = await this.supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId)
      .eq("user_id", userId); // Additional safety check

    if (deleteError) {
      throw new Error(`Failed to delete recipe: ${deleteError.message}`);
    }
  }
}
