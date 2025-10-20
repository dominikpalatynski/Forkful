import type { APIRoute } from "astro";
import { z } from "zod";
import { CreateRecipeSchema, GetRecipesSchema } from "../../../lib/schemas/recipe.schema";
import { RecipeService } from "../../../lib/services/recipe.service";
import { getAuthenticatedUserId } from "../../../lib/utils";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * GET /api/recipes
 * Retrieves a paginated, sortable, and filterable list of recipes for the authenticated user.
 *
 * Query parameters:
 * - page (optional, default: 1): Page number for pagination
 * - pageSize (optional, default: 10, max: 100): Number of items per page
 * - sortBy (optional, default: "created_at"): Field to sort by ("name" or "created_at")
 * - order (optional, default: "desc"): Sort order ("asc" or "desc")
 * - tag (optional): Filter recipes by tag name
 *
 * Returns 200 OK with PaginatedRecipesDto or appropriate error codes.
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const userId = getAuthenticatedUserId(locals);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    let validatedParams;
    try {
      validatedParams = GetRecipesSchema.parse(queryParams);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            details: validationError.errors,
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      throw validationError;
    }

    // Initialize recipe service
    const recipeService = new RecipeService(locals.supabase);

    // Get recipes for user
    let recipes;
    try {
      recipes = await recipeService.getRecipesForUser(userId, validatedParams);
    } catch (serviceError) {
      return new Response(
        JSON.stringify({
          error: "Failed to get recipes",
          message: serviceError instanceof Error ? serviceError.message : "An unexpected error occurred",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return success response
    return new Response(JSON.stringify(recipes), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred while processing your request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

/**
 * POST /api/recipes
 * Creates a new recipe with ingredients, steps, and tags.
 *
 * Request body should match CreateRecipeCommand schema.
 * Returns 201 Created with the created recipe or appropriate error codes.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const userId = getAuthenticatedUserId(locals);

    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          message: parseError instanceof Error ? parseError.message : "Unknown error",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate request body against schema
    let validatedData;
    try {
      validatedData = CreateRecipeSchema.parse(requestBody);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            details: validationError.errors,
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      throw validationError;
    }

    // Initialize recipe service
    const recipeService = new RecipeService(locals.supabase);

    // Create the recipe
    let createdRecipe;
    try {
      createdRecipe = await recipeService.createRecipe(validatedData, userId);
    } catch (serviceError) {
      return new Response(
        JSON.stringify({
          error: "Failed to create recipe",
          message: serviceError instanceof Error ? serviceError.message : "An unexpected error occurred",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return success response
    return new Response(JSON.stringify(createdRecipe), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred while processing your request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
