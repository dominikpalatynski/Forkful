import type { APIRoute } from "astro";
import { z } from "zod";
import { GetRecipeByIdParamsSchema } from "../../../lib/schemas/recipe.schema";
import { RecipeService, NotFoundError, ForbiddenError } from "../../../lib/services/recipe.service";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * GET /api/recipes/{id}
 * Retrieves a single recipe by its ID for the authenticated user.
 * 
 * Path parameters:
 * - id: UUID of the recipe to retrieve
 * 
 * Returns 200 OK with RecipeDetailDto or appropriate error codes:
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User doesn't own the recipe
 * - 404 Not Found: Recipe not found
 * - 500 Internal Server Error: Database or unexpected error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // TODO: In production, get userId from authenticated session
    // For development, use a default user ID
    const DEFAULT_DEV_USER_ID = "ba120fed-a207-4eb6-85ec-934467468eaf";
    const userId = DEFAULT_DEV_USER_ID;

    // Validate the recipe ID parameter
    let validatedParams;
    try {
      validatedParams = GetRecipeByIdParamsSchema.parse(params);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Invalid recipe ID",
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

    // Get the recipe by ID
    let recipe;
    try {
      recipe = await recipeService.getRecipeById(validatedParams.id, userId);
    } catch (serviceError) {
      console.error("Failed to get recipe by ID:", serviceError);
      
      // Handle specific custom error types
      if (serviceError instanceof NotFoundError) {
        return new Response(
          JSON.stringify({
            error: "Recipe not found",
            message: "The recipe with the specified ID does not exist.",
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      
      if (serviceError instanceof ForbiddenError) {
        return new Response(
          JSON.stringify({
            error: "Access forbidden",
            message: "You don't have permission to access this recipe.",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      
      // Generic server error for other errors
      return new Response(
        JSON.stringify({
          error: "Failed to get recipe",
          message:
            serviceError instanceof Error
              ? serviceError.message
              : "An unexpected error occurred",
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
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in GET /api/recipes/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred while processing your request",
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
