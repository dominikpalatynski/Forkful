import type { SupabaseClientType } from "../../db/supabase.client";
import type { GeneratedRecipeDto } from "../../types";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { OpenRouterService } from "./openrouter.service";
import { systemPrompt, getUserPrompt } from "./prompt";
// Schema for AI-generated recipe
const GeneratedRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().min(1, "Recipe description is required"),
  ingredients: z.array(
    z.object({
      content: z.string().min(1, "Ingredient content cannot be empty"),
      position: z.number().int().positive("Position must be a positive integer"),
    })
  ).min(1, "Recipe must have at least one ingredient"),
  steps: z.array(
    z.object({
      content: z.string().min(1, "Step content cannot be empty"),
      position: z.number().int().positive("Position must be a positive integer"),
    })
  ).min(1, "Recipe must have at least one step"),
});

// Convert Zod schema to JSON Schema for OpenRouter
const GeneratedRecipeJsonSchemaFull = zodToJsonSchema(GeneratedRecipeSchema, {
  name: "RecipeResponse",
});

// Extract the actual schema from definitions (OpenAI requires type: "object" at root level)
const GeneratedRecipeJsonSchema = GeneratedRecipeJsonSchemaFull.definitions?.RecipeResponse as Record<string, unknown>;

if (!GeneratedRecipeJsonSchema || typeof GeneratedRecipeJsonSchema !== "object") {
  throw new Error("Failed to generate JSON schema for recipe generation");
}

/**
 * Service for handling AI-powered recipe generation from text input.
 * Manages the generation process, database logging, and error handling.
 */
export class GenerationRecipeService {
  private openRouterService: OpenRouterService;

  constructor(private supabase: SupabaseClientType) {
    this.openRouterService = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY!,
      model: "anthropic/claude-3-haiku",
      systemPrompt: systemPrompt,
      jsonSchema: {
        name: "RecipeResponse",
        schema: GeneratedRecipeJsonSchema,
        strict: true,
      },
      modelParameters: { temperature: 0.3,
        max_tokens: 10000, },
    });
  }

  /**
   * Generates a recipe from input text using AI.
   * Creates a generation record in the database for tracking purposes.
   *
   * @param inputText - The raw text input to process
   * @param userId - The authenticated user's ID
   * @returns Generated recipe data with generation ID
   * @throws Error if generation fails or input is invalid
   */
  async generateRecipeFromText(inputText: string, userId: string): Promise<GeneratedRecipeDto> {
    try {
      // Step 1: Generate recipe using OpenRouter AI
      const result = await this.openRouterService.generate({
        userMessage: getUserPrompt(inputText),
      });

      // Step 2: Validate the returned JSON against the Zod schema
      const parsedRecipe = await this.validateRecipe(result.json);

      // Step 3: Create generation record in database
      const { data: generationData, error: generationError } = await this.supabase
        .from("generation")
        .insert({
          user_id: userId,
          input_text: inputText,
          generated_output: parsedRecipe,
          is_accepted: false,
        })
        .select("id")
        .single();

      if (generationError || !generationData) {
        throw new Error(`Failed to create generation record: ${generationError?.message ?? "Unknown error"}`);
      }

      // Step 4: Return the generated recipe with generation ID
      const resultDto: GeneratedRecipeDto = {
        generationId: generationData.id,
        name: parsedRecipe.name,
        description: parsedRecipe.description,
        ingredients: parsedRecipe.ingredients,
        steps: parsedRecipe.steps,
      };

      return resultDto;
    } catch (error) {
      // Step 5: Log error to generation_errors table
      await this.logGenerationError(userId, inputText, error);

      // Re-throw the error for the caller to handle
      throw error;
    }
  }


  private async validateRecipe(json: unknown): Promise<z.infer<typeof GeneratedRecipeSchema>> {
    try {
      const parsedRecipe = GeneratedRecipeSchema.parse(json);
      return parsedRecipe;
    } catch (error) {
      throw new Error(`Failed to validate recipe: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Logs generation errors to the generation_errors table for debugging and monitoring.
   *
   * @param userId - The user ID
   * @param inputText - The input text that caused the error
   * @param error - The error that occurred
   */
  private async logGenerationError(userId: string, inputText: string, error: unknown): Promise<void> {
    try {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      const errorCode = error instanceof Error ? error.name : "UnknownError";

      await this.supabase.from("generation_errors").insert({
        user_id: userId,
        input_text: inputText,
        error_message: errorMessage,
        error_code: errorCode,
      });
    } catch (logError) {
      // Don't throw logging errors to avoid masking the original error
      console.error("Failed to log generation error:", logError);
    }
  }

}
