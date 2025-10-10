import type { SupabaseClientType } from "../../db/supabase.client";
import type { GeneratedRecipeDto } from "../../types";

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
      // Step 1: Mock AI response (replace with real AI call in the future)
      const mockGeneratedRecipe = await this.mockAIGeneration(inputText);

      // Step 2: Create generation record in database
      const { data: generationData, error: generationError } = await this.supabase
        .from("generation")
        .insert({
          user_id: userId,
          input_text: inputText,
          generated_output: mockGeneratedRecipe,
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
        name: mockGeneratedRecipe.name,
        description: mockGeneratedRecipe.description,
        ingredients: mockGeneratedRecipe.ingredients,
        steps: mockGeneratedRecipe.steps,
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
   * Mock AI generation method that simulates AI processing.
   * This will be replaced with real AI integration in the future.
   *
   * @param inputText - The input text to process
   * @returns Mock generated recipe data
   */
  private async mockAIGeneration(inputText: string) {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simple logic to vary the response based on input
    const isSimpleRecipe = inputText.toLowerCase().includes("pancake") || inputText.toLowerCase().includes("naleśnik");

    if (isSimpleRecipe) {
      return {
        name: "Delicious Pancakes",
        description: "Fluffy and delicious pancakes perfect for breakfast",
        ingredients: [
          { content: "1 cup all-purpose flour", position: 1 },
          { content: "2 tablespoons sugar", position: 2 },
          { content: "2 teaspoons baking powder", position: 3 },
          { content: "1/2 teaspoon salt", position: 4 },
          { content: "1 cup milk", position: 5 },
          { content: "2 large eggs", position: 6 },
          { content: "2 tablespoons melted butter", position: 7 },
        ],
        steps: [
          { content: "In a large bowl, whisk together flour, sugar, baking powder, and salt.", position: 1 },
          { content: "In another bowl, whisk together milk, eggs, and melted butter.", position: 2 },
          { content: "Pour the wet ingredients into the dry ingredients and stir until just combined.", position: 3 },
          { content: "Heat a non-stick pan over medium heat.", position: 4 },
          { content: "Pour 1/4 cup of batter for each pancake and cook until bubbles form on surface.", position: 5 },
          { content: "Flip and cook until golden brown on the other side.", position: 6 },
        ],
      };
    }

    // Default generic recipe for other inputs
    return {
      name: "Generated Recipe",
      description: "A recipe generated from your input text",
      ingredients: [
        { content: "Main ingredient from your text", position: 1 },
        { content: "Supporting ingredient", position: 2 },
        { content: "Seasoning or spice", position: 3 },
      ],
      steps: [
        { content: "Prepare all ingredients as described in your text.", position: 1 },
        { content: "Follow the cooking method mentioned in your input.", position: 2 },
        { content: "Serve and enjoy your dish.", position: 3 },
      ],
    };
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

  /**
   * Future method for real AI integration with OpenRouter.
   * This will replace the mock generation when ready.
   *
   * @param inputText - The input text to process
   * @returns Promise with AI-generated recipe data
   */
  private async callOpenRouterAI(inputText: string): Promise<any> {
    // TODO: Implement real AI integration
    // const apiKey = import.meta.env.OPENROUTER_API_KEY;
    // const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'anthropic/claude-3-haiku',
    //     messages: [
    //       {
    //         role: 'system',
    //         content: 'You are a recipe extraction AI. Parse the given text and return a structured recipe with name, description, ingredients, and steps.'
    //       },
    //       {
    //         role: 'user',
    //         content: inputText
    //       }
    //     ]
    //   })
    // });
    //
    // if (!response.ok) {
    //   throw new Error(`AI API error: ${response.statusText}`);
    // }
    //
    // const data = await response.json();
    // return this.parseAIResponse(data);

    throw new Error("Real AI integration not implemented yet");
  }
}
