import type { APIRoute } from "astro";
import { GenerationRecipeService } from "../../../lib/services/generation-recipe.service";
import { GenerateRecipeSchema } from "../../../lib/schemas/recipe.schema";
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
    const DEFAULT_DEV_USER_ID = "ba120fed-a207-4eb6-85ec-934467468eaf";
    const defaultUserId = DEFAULT_DEV_USER_ID;

    // Step 2: Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
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
    const generationService = new GenerationRecipeService(locals.supabase);
    
    try {
      const generatedRecipe = await generationService.generateRecipeFromText(
        inputText,
        defaultUserId
      );

      // Step 5: Return successful response
      return new Response(
        JSON.stringify(generatedRecipe),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (serviceError) {
      // Step 6: Handle service-specific errors
      if (serviceError instanceof Error) {
        // Check if it's a "not a recipe" error (would be implemented in real AI integration)
        if (serviceError.message.includes("not a recipe") || serviceError.message.includes("unprocessable")) {
          return new Response(
            JSON.stringify({
              error: "Unprocessable Entity",
              message: "The provided text could not be processed as a recipe. Please provide text that describes a recipe with ingredients and cooking steps."
            }),
            {
              status: 422,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }

      // Generic server error
      console.error("Recipe generation failed:", serviceError);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Failed to generate recipe. Please try again later."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    // Step 7: Handle unexpected errors
    console.error("Unexpected error in recipe generation endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred. Please try again later."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
