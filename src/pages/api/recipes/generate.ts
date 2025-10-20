import type { APIRoute } from "astro";
import { GenerationRecipeService } from "../../../lib/services/generation-recipe.service";
import { OpenRouterService } from "../../../lib/services/openrouter.service";
import { systemPrompt } from "../../../lib/services/prompt";
import { GeneratedRecipeJsonSchemaFull } from "../../../lib/services/generation-recipe.service";
import { GenerateRecipeSchema } from "../../../lib/schemas/recipe.schema";
import { getAuthenticatedUserId } from "../../../lib/utils";
import z from "zod";

export const prerender = false;

/**
 * POST /api/recipes/generate
 *
 * Generates a recipe from input text using AI (currently mocked).
 * Creates a generation record in the database for tracking purposes.
 *
 * Request Body:
 * - inputText: string (20-10,000 characters) - Text to process
 *
 * Responses:
 * - 200: Generated recipe data with generationId
 * - 400: Invalid input data
 * - 401: User not authenticated
 * - 422: Input text could not be processed as a recipe
 * - 500: Server error during generation
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const userId = getAuthenticatedUserId(locals);

    // Step 2: Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let validatedData;
    try {
      validatedData = GenerateRecipeSchema.parse(requestBody);
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

    const { inputText } = validatedData;

    // Step 4: Initialize generation service and generate recipe
    const openRouterService = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY as string,
      model: "anthropic/claude-3-haiku",
      systemPrompt: systemPrompt,
      jsonSchema: {
        name: "RecipeResponse",
        schema: GeneratedRecipeJsonSchemaFull,
        strict: true,
      },
      modelParameters: { temperature: 0.3, max_tokens: 10000 },
    });

    const generationService = new GenerationRecipeService(locals.supabase, openRouterService);

    try {
      const generatedRecipe = await generationService.generateRecipeFromText(inputText, userId);

      // Step 5: Return successful response
      return new Response(JSON.stringify(generatedRecipe), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      // Step 6: Handle service-specific errors
      if (serviceError instanceof Error) {
        // Check if it's a "not a recipe" error (would be implemented in real AI integration)
        if (serviceError.message.includes("not a recipe") || serviceError.message.includes("unprocessable")) {
          return new Response(
            JSON.stringify({
              error: "Unprocessable Entity",
              message:
                "The provided text could not be processed as a recipe. Please provide text that describes a recipe with ingredients and cooking steps.",
            }),
            {
              status: 422,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // Generic server error
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to generate recipe. Please try again later.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    // Step 7: Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
