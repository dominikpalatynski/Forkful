import type { SupabaseClientType } from "../../db/supabase.client";
import type { GeneratedRecipeDto } from "../../types";
import { z } from "zod";
import { OpenRouterService } from "./openrouter.service";

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

type GeneratedRecipe = z.infer<typeof GeneratedRecipeSchema>;

/**
 * Service for handling AI-powered recipe generation from text input.
 * Manages the generation process, database logging, and error handling.
 */
export class GenerationRecipeService {
  constructor(private supabase: SupabaseClientType) {}

  /**
   * Generates a recipe from input text using AI (currently mocked).
   * Creates a generation record in the database for tracking purposes.
   *
   * @param inputText - The raw text input to process
   * @param userId - The authenticated user's ID
   * @returns Generated recipe data with generation ID
   * @throws Error if generation fails or input is invalid
   */
  async generateRecipeFromText(inputText: string, userId: string): Promise<GeneratedRecipeDto> {
    try {
      // Step 1: Generate recipe using AI
      const generatedRecipe = await this.generateRecipeWithAI(inputText);

      // Step 2: Create generation record in database
      const { data: generationData, error: generationError } = await this.supabase
        .from("generation")
        .insert({
          user_id: userId,
          input_text: inputText,
          generated_output: generatedRecipe,
          is_accepted: false,
        })
        .select("id")
        .single();

      if (generationError || !generationData) {
        throw new Error(`Failed to create generation record: ${generationError?.message ?? "Unknown error"}`);
      }

      // Step 3: Return the generated recipe with generation ID
      const result: GeneratedRecipeDto = {
        generationId: generationData.id,
        name: generatedRecipe.name,
        description: generatedRecipe.description,
        ingredients: generatedRecipe.ingredients,
        steps: generatedRecipe.steps,
      };

      return result;
    } catch (error) {
      // Step 4: Log error to generation_errors table
      await this.logGenerationError(userId, inputText, error);

      // Re-throw the error for the caller to handle
      throw error;
    }
  }

  /**
   * Generates a recipe using OpenRouter AI service.
   * Uses structured prompting to extract recipe components from text.
   *
   * @param inputText - The input text to process
   * @returns AI-generated recipe data validated with Zod schema
   */
  private async generateRecipeWithAI(inputText: string): Promise<GeneratedRecipe> {
    const openRouterService = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY,
    });

    const systemPrompt = `Jesteś ekspertem kucharzem i analitykiem przepisów. Twoim zadaniem jest wyciągnięcie i utworzenie ustrukturyzowanego przepisu z podanego tekstu wejściowego.

Przeanalizuj podany tekst i wyciągnij następujące składniki przepisu:
- Nazwa przepisu: Utwórz chwytliwą, opisową nazwę dla dania
- Opis: Napisz krótki, apetyczny opis dania
- Składniki: Wyciągnij wszystkie wymienione składniki z ich ilościami, wymienione w kolejności pojawiania się lub logicznego przygotowania
- Kroki: Utwórz jasne, numerowane instrukcje gotowania na podstawie opisanego sposobu

Wytyczne:
- Skup się tylko na treściach związanych z jedzeniem i ignoruj elementy niebędące przepisami
- Jeśli tekst nie jest przepisem, utwórz rozsądny przepis na podstawie wymienionych produktów spożywczych
- Zapewnij składnikom realistyczne ilości i miary
- Kroki powinny być jasne, wykonalne i w logicznej kolejności gotowania
- Zachowaj przepis praktyczny i osiągalny dla domowych kucharzy
- Używaj właściwej terminologii kulinarnej, ale zachowaj dostępność

WAŻNE: Zwróć WYŁĄCZNIE prawidłowy obiekt JSON o dokładnie określonej strukturze. Nie dołączaj żadnego innego tekstu, wyjaśnień ani formatowania.

PRZYKŁAD struktury JSON:
{
  "name": "Spaghetti Bolognese",
  "description": "Klasyczne włoskie danie z mięsem i sosem pomidorowym",
  "ingredients": [
    {"content": "500g mielonego mięsa wołowego", "position": 1},
    {"content": "1 cebula, posiekana", "position": 2}
  ],
  "steps": [
    {"content": "Podsmaż mięso na patelni", "position": 1},
    {"content": "Dodaj cebulę i smaż przez 5 minut", "position": 2}
  ]
}

Zwróć tylko sam obiekt JSON, bez żadnego dodatkowego tekstu.`;

    const userPrompt = `Wyciągnij przepis z tego tekstu:

${inputText}

Utwórz kompletny, ustrukturyzowany przepis z nazwą, opisem, składnikami i krokami.`;

    try {
      const result = await openRouterService.generate({
        systemPrompt,
        userPrompt,
        jsonSchema: GeneratedRecipeSchema,
        model: "anthropic/claude-3-haiku",
        params: {
          temperature: 0.3, // Lower temperature for more consistent recipe extraction
          max_tokens: 2048,
        },
      });

      console.log("AI Response:", JSON.stringify(result, null, 2)); // Debug log

      // Result is already validated by Zod schema in OpenRouterService
      return result as GeneratedRecipe;
    } catch (error) {
      // If AI generation fails, provide a fallback recipe
      console.error("AI recipe generation failed:", error);
      throw error;
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
