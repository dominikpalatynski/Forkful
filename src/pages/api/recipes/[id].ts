import type { APIRoute } from "astro";
import { z } from "zod";
import { RecipeIdParamsSchema, UpdateRecipeSchema } from "../../../lib/schemas/recipe.schema";
import { RecipeService, NotFoundError, ForbiddenError } from "../../../lib/services/recipe.service";
import { getAuthenticatedUserId } from "../../../lib/utils";

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
    const userId = getAuthenticatedUserId(locals);

    // Validate the recipe ID parameter
    let validatedParams;
    try {
      validatedParams = RecipeIdParamsSchema.parse(params);
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
      // Handle specific custom error types
      if (serviceError instanceof NotFoundError) {
        return new Response(
          JSON.stringify({
            error: "Recipe not found",
            message: "The recipe with the specified ID does not exist.",
            details: serviceError instanceof Error ? serviceError.message : "Unknown error",
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
    return new Response(JSON.stringify(recipe), {
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
 * PUT /api/recipes/{id}
 * Updates an existing recipe for the authenticated user.
 *
 * Path parameters:
 * - id: UUID of the recipe to update
 *
 * Request body: UpdateRecipeCommand with name, description, ingredients, steps, and tags
 *
 * Returns 200 OK with updated RecipeDetailDto or appropriate error codes:
 * - 400 Bad Request: Invalid UUID format or validation errors
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User doesn't own the recipe
 * - 404 Not Found: Recipe not found
 * - 500 Internal Server Error: Database or unexpected error
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const userId = getAuthenticatedUserId(locals);

    // Step 1: Validate the recipe ID parameter
    let validatedParams;
    try {
      validatedParams = RecipeIdParamsSchema.parse(params);
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

    // Step 2: Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    let validatedData;
    try {
      validatedData = UpdateRecipeSchema.parse(requestBody);
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

    // Step 3: Initialize recipe service and update recipe
    const recipeService = new RecipeService(locals.supabase);

    let updatedRecipe;
    try {
      updatedRecipe = await recipeService.updateRecipe(validatedParams.id, validatedData, userId);
    } catch (serviceError) {
      // Handle specific custom error types
      if (serviceError instanceof NotFoundError) {
        return new Response(
          JSON.stringify({
            error: "Recipe not found",
            message: "The recipe with the specified ID does not exist.",
            details: serviceError instanceof Error ? serviceError.message : "Unknown error",
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
            message: "You don't have permission to update this recipe.",
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
          error: "Failed to update recipe",
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

    // Step 4: Return success response
    return new Response(JSON.stringify(updatedRecipe), {
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
 * DELETE /api/recipes/{id}
 * Deletes a recipe and all its related data for the authenticated user.
 *
 * Path parameters:
 * - id: UUID of the recipe to delete
 *
 * Returns 204 No Content on success or appropriate error codes:
 * - 400 Bad Request: Invalid UUID format
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User doesn't own the recipe
 * - 404 Not Found: Recipe not found
 * - 500 Internal Server Error: Database or unexpected error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const userId = getAuthenticatedUserId(locals);

    // Step 1: Validate the recipe ID parameter
    let validatedParams;
    try {
      validatedParams = RecipeIdParamsSchema.parse(params);
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

    // Step 2: Initialize recipe service and delete recipe
    const recipeService = new RecipeService(locals.supabase);

    try {
      await recipeService.deleteRecipe(validatedParams.id, userId);
    } catch (serviceError) {
      // Handle specific custom error types
      if (serviceError instanceof NotFoundError) {
        return new Response(
          JSON.stringify({
            error: "Recipe not found",
            message: "The recipe with the specified ID does not exist.",
            details: serviceError instanceof Error ? serviceError.message : "Unknown error",
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
            message: "You don't have permission to delete this recipe.",
            details: serviceError instanceof Error ? serviceError.message : "Unknown error",
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
          error: "Failed to delete recipe",
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

    // Step 3: Return success response (204 No Content)
    return new Response(null, {
      status: 204,
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
