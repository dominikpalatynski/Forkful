import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerationRecipeService } from "./generation-recipe.service";
import type { OpenRouterService } from "./openrouter.service";
import type { SupabaseClientType } from "../../db/supabase.client";

// Mock the prompt module
vi.mock("./prompt", () => ({
  getUserPrompt: vi.fn((text: string) => `Generate recipe for: ${text}`),
}));

// Helper to create Supabase base mocks
const createSupabaseMocks = () => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockFrom = vi.fn();

  return { from: mockFrom, select: mockSelect, insert: mockInsert, single: mockSingle };
};

// Helper to create valid recipe data
const createValidRecipe = () => ({
  name: "Test Recipe",
  description: "A test recipe description",
  ingredients: [
    { content: "Ingredient 1", position: 1 },
    { content: "Ingredient 2", position: 2 },
  ],
  steps: [
    { content: "Step 1", position: 1 },
    { content: "Step 2", position: 2 },
  ],
});

// Custom error class for OpenRouter
class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

describe("GenerationRecipeService", () => {
  let service: GenerationRecipeService;
  let mockOpenRouterService: OpenRouterService;
  let supabaseMocks: ReturnType<typeof createSupabaseMocks>;
  let mockSupabase: SupabaseClientType;

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup OpenRouter mock
    mockOpenRouterService = {
      generate: vi.fn(),
    } as unknown as OpenRouterService;

    // Setup Supabase mocks
    supabaseMocks = createSupabaseMocks();
    mockSupabase = { from: supabaseMocks.from } as unknown as SupabaseClientType;

    // Default implementation for Supabase from()
    supabaseMocks.from.mockImplementation((tableName: string) => {
      if (tableName === "generation") {
        return {
          insert: supabaseMocks.insert.mockReturnValue({
            select: supabaseMocks.select.mockReturnValue({
              single: supabaseMocks.single,
            }),
          }),
        };
      }
      if (tableName === "generation_errors") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    service = new GenerationRecipeService(mockSupabase, mockOpenRouterService);
  });

  describe("generateRecipeFromText", () => {
    it("should successfully generate recipe from text with all required fields", async () => {
      const mockRecipe = createValidRecipe();
      const inputText = "Make pasta carbonara";
      const userId = "user-123";

      // Mock OpenRouter success
      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: mockRecipe,
      });

      // Mock Supabase generation insert success
      supabaseMocks.single.mockResolvedValueOnce({
        data: { id: "gen-123" },
        error: null,
      });

      const result = await service.generateRecipeFromText(inputText, userId);

      // Verify result structure
      expect(result).toEqual({
        generationId: "gen-123",
        name: mockRecipe.name,
        description: mockRecipe.description,
        ingredients: mockRecipe.ingredients,
        steps: mockRecipe.steps,
      });

      // Verify database insertion called with correct parameters
      expect(supabaseMocks.insert).toHaveBeenCalledWith({
        user_id: userId,
        input_text: inputText,
        generated_output: mockRecipe,
        is_accepted: false,
      });
      expect(supabaseMocks.insert).toHaveBeenCalledTimes(1);
    });

    it("should handle OpenRouter service network errors", async () => {
      const inputText = "Make pasta";
      const userId = "user-123";
      const error = new OpenRouterError("OpenRouterService: HTTP 500 Server Error");

      // Mock OpenRouter failure
      vi.mocked(mockOpenRouterService.generate).mockRejectedValueOnce(error);

      // Mock error logging
      const mockErrorInsert = vi.fn().mockResolvedValue({ error: null });
      supabaseMocks.from.mockImplementation((tableName: string) => {
        if (tableName === "generation_errors") {
          return { insert: mockErrorInsert };
        }
        return {
          insert: supabaseMocks.insert.mockReturnValue({
            select: supabaseMocks.select.mockReturnValue({
              single: supabaseMocks.single,
            }),
          }),
        };
      });

      await expect(service.generateRecipeFromText(inputText, userId)).rejects.toThrow(
        "OpenRouterService: HTTP 500 Server Error"
      );

      // Verify error logging
      expect(mockErrorInsert).toHaveBeenCalledWith({
        user_id: userId,
        input_text: inputText,
        error_message: "OpenRouterService: HTTP 500 Server Error",
        error_code: "OpenRouterError",
      });

      // Verify generation record was NOT created
      expect(supabaseMocks.insert).not.toHaveBeenCalled();
    });

    it("should handle OpenRouter service timeout", async () => {
      const inputText = "Make pasta";
      const userId = "user-123";
      const error = new OpenRouterError("OpenRouterService: request timed out");

      vi.mocked(mockOpenRouterService.generate).mockRejectedValueOnce(error);

      const mockErrorInsert = vi.fn().mockResolvedValue({ error: null });
      supabaseMocks.from.mockImplementation((tableName: string) => {
        if (tableName === "generation_errors") {
          return { insert: mockErrorInsert };
        }
        return {
          insert: supabaseMocks.insert.mockReturnValue({
            select: supabaseMocks.select.mockReturnValue({
              single: supabaseMocks.single,
            }),
          }),
        };
      });

      await expect(service.generateRecipeFromText(inputText, userId)).rejects.toThrow(
        "OpenRouterService: request timed out"
      );

      expect(mockErrorInsert).toHaveBeenCalledWith({
        user_id: userId,
        input_text: inputText,
        error_message: "OpenRouterService: request timed out",
        error_code: "OpenRouterError",
      });
    });

    it("should validate returned recipe against Zod schema and reject invalid data", async () => {
      const inputText = "Make pasta";
      const userId = "user-123";
      const invalidRecipe = {
        name: "Test Recipe",
        // Missing description
        ingredients: [{ content: "Ingredient 1", position: 1 }],
        steps: [{ content: "Step 1", position: 1 }],
      };

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: invalidRecipe,
      });

      const mockErrorInsert = vi.fn().mockResolvedValue({ error: null });
      supabaseMocks.from.mockImplementation((tableName: string) => {
        if (tableName === "generation_errors") {
          return { insert: mockErrorInsert };
        }
        return {
          insert: supabaseMocks.insert.mockReturnValue({
            select: supabaseMocks.select.mockReturnValue({
              single: supabaseMocks.single,
            }),
          }),
        };
      });

      await expect(service.generateRecipeFromText(inputText, userId)).rejects.toThrow(/Failed to validate recipe/);

      expect(mockErrorInsert).toHaveBeenCalled();
      expect(supabaseMocks.insert).not.toHaveBeenCalled();
    });

    it("should reject recipe with no ingredients", async () => {
      const inputText = "Make pasta";
      const userId = "user-123";
      const invalidRecipe = {
        name: "Test Recipe",
        description: "Test description",
        ingredients: [],
        steps: [{ content: "Step 1", position: 1 }],
      };

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: invalidRecipe,
      });

      const mockErrorInsert = vi.fn().mockResolvedValue({ error: null });
      supabaseMocks.from.mockImplementation((tableName: string) => {
        if (tableName === "generation_errors") {
          return { insert: mockErrorInsert };
        }
        return {
          insert: supabaseMocks.insert.mockReturnValue({
            select: supabaseMocks.select.mockReturnValue({
              single: supabaseMocks.single,
            }),
          }),
        };
      });

      await expect(service.generateRecipeFromText(inputText, userId)).rejects.toThrow(/Failed to validate recipe/);

      expect(mockErrorInsert).toHaveBeenCalled();
      const errorCall = mockErrorInsert.mock.calls[0][0];
      expect(errorCall.error_message).toContain("Recipe must have at least one ingredient");
    });

    it("should reject recipe with no steps", async () => {
      const inputText = "Make pasta";
      const userId = "user-123";
      const invalidRecipe = {
        name: "Test Recipe",
        description: "Test description",
        ingredients: [{ content: "Ingredient 1", position: 1 }],
        steps: [],
      };

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: invalidRecipe,
      });

      const mockErrorInsert = vi.fn().mockResolvedValue({ error: null });
      supabaseMocks.from.mockImplementation((tableName: string) => {
        if (tableName === "generation_errors") {
          return { insert: mockErrorInsert };
        }
        return {
          insert: supabaseMocks.insert.mockReturnValue({
            select: supabaseMocks.select.mockReturnValue({
              single: supabaseMocks.single,
            }),
          }),
        };
      });

      await expect(service.generateRecipeFromText(inputText, userId)).rejects.toThrow(/Failed to validate recipe/);

      expect(mockErrorInsert).toHaveBeenCalled();
      const errorCall = mockErrorInsert.mock.calls[0][0];
      expect(errorCall.error_message).toContain("Recipe must have at least one step");
    });

    it("should reject ingredient without valid position field", async () => {
      const inputText = "Make pasta";
      const userId = "user-123";
      const invalidRecipe = {
        name: "Test Recipe",
        description: "Test description",
        ingredients: [{ content: "Ingredient 1" }], // Missing position
        steps: [{ content: "Step 1", position: 1 }],
      };

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: invalidRecipe,
      });

      const mockErrorInsert = vi.fn().mockResolvedValue({ error: null });
      supabaseMocks.from.mockImplementation((tableName: string) => {
        if (tableName === "generation_errors") {
          return { insert: mockErrorInsert };
        }
        return {
          insert: supabaseMocks.insert.mockReturnValue({
            select: supabaseMocks.select.mockReturnValue({
              single: supabaseMocks.single,
            }),
          }),
        };
      });

      await expect(service.generateRecipeFromText(inputText, userId)).rejects.toThrow(/Failed to validate recipe/);

      expect(mockErrorInsert).toHaveBeenCalled();
    });

    it("should reject step without valid position field", async () => {
      const inputText = "Make pasta";
      const userId = "user-123";
      const invalidRecipe = {
        name: "Test Recipe",
        description: "Test description",
        ingredients: [{ content: "Ingredient 1", position: 1 }],
        steps: [{ content: "Step 1" }], // Missing position
      };

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: invalidRecipe,
      });

      const mockErrorInsert = vi.fn().mockResolvedValue({ error: null });
      supabaseMocks.from.mockImplementation((tableName: string) => {
        if (tableName === "generation_errors") {
          return { insert: mockErrorInsert };
        }
        return {
          insert: supabaseMocks.insert.mockReturnValue({
            select: supabaseMocks.select.mockReturnValue({
              single: supabaseMocks.single,
            }),
          }),
        };
      });

      await expect(service.generateRecipeFromText(inputText, userId)).rejects.toThrow(/Failed to validate recipe/);

      expect(mockErrorInsert).toHaveBeenCalled();
    });

    it("should handle database failure when inserting generation record", async () => {
      const mockRecipe = createValidRecipe();
      const inputText = "Make pasta";
      const userId = "user-123";

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: mockRecipe,
      });

      // Mock generation insert to fail
      supabaseMocks.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Unique violation on user_id" },
      });

      const mockErrorInsert = vi.fn().mockResolvedValue({ error: null });
      supabaseMocks.from.mockImplementation((tableName: string) => {
        if (tableName === "generation_errors") {
          return { insert: mockErrorInsert };
        }
        if (tableName === "generation") {
          return {
            insert: supabaseMocks.insert.mockReturnValue({
              select: supabaseMocks.select.mockReturnValue({
                single: supabaseMocks.single,
              }),
            }),
          };
        }
        return {};
      });

      await expect(service.generateRecipeFromText(inputText, userId)).rejects.toThrow(
        "Failed to create generation record: Unique violation on user_id"
      );

      expect(mockErrorInsert).toHaveBeenCalled();
      const errorCall = mockErrorInsert.mock.calls[0][0];
      expect(errorCall.user_id).toBe(userId);
      expect(errorCall.input_text).toBe(inputText);
    });

    it("should gracefully handle error logging failure without masking original error", async () => {
      const inputText = "Make pasta";
      const userId = "user-123";
      const originalError = new OpenRouterError("Original error");
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
        // Intentionally empty - suppressing console output during test
      });

      vi.mocked(mockOpenRouterService.generate).mockRejectedValueOnce(originalError);

      // Mock error logging to throw an exception
      const mockErrorInsert = vi.fn().mockRejectedValue(new Error("Database error"));
      supabaseMocks.from.mockImplementation((tableName: string) => {
        if (tableName === "generation_errors") {
          return { insert: mockErrorInsert };
        }
        return {
          insert: supabaseMocks.insert.mockReturnValue({
            select: supabaseMocks.select.mockReturnValue({
              single: supabaseMocks.single,
            }),
          }),
        };
      });

      await expect(service.generateRecipeFromText(inputText, userId)).rejects.toThrow("Original error");

      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to log generation error:", expect.anything());

      consoleErrorSpy.mockRestore();
    });

    it("should handle database insert returning null data despite no error", async () => {
      const mockRecipe = createValidRecipe();
      const inputText = "Make pasta";
      const userId = "user-123";

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: mockRecipe,
      });

      supabaseMocks.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const mockErrorInsert = vi.fn().mockResolvedValue({ error: null });
      supabaseMocks.from.mockImplementation((tableName: string) => {
        if (tableName === "generation_errors") {
          return { insert: mockErrorInsert };
        }
        if (tableName === "generation") {
          return {
            insert: supabaseMocks.insert.mockReturnValue({
              select: supabaseMocks.select.mockReturnValue({
                single: supabaseMocks.single,
              }),
            }),
          };
        }
        return {};
      });

      await expect(service.generateRecipeFromText(inputText, userId)).rejects.toThrow(
        "Failed to create generation record: Unknown error"
      );

      expect(mockErrorInsert).toHaveBeenCalled();
    });

    it("should successfully validate and process multiple ingredients with varying positions", async () => {
      const mockRecipe = {
        name: "Multi-Ingredient Recipe",
        description: "Recipe with many ingredients",
        ingredients: [
          { content: "Ingredient 1", position: 1 },
          { content: "Ingredient 2", position: 2 },
          { content: "Ingredient 3", position: 3 },
          { content: "Ingredient 4", position: 4 },
          { content: "Ingredient 5", position: 5 },
        ],
        steps: [{ content: "Step 1", position: 1 }],
      };
      const inputText = "Make complex recipe";
      const userId = "user-123";

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: mockRecipe,
      });

      supabaseMocks.single.mockResolvedValueOnce({
        data: { id: "gen-123" },
        error: null,
      });

      const result = await service.generateRecipeFromText(inputText, userId);

      expect(result.ingredients).toHaveLength(5);
      expect(result.ingredients).toEqual(mockRecipe.ingredients);
      expect(result.ingredients[0].position).toBe(1);
      expect(result.ingredients[4].position).toBe(5);
    });

    it("should successfully validate and process multiple steps with varying positions", async () => {
      const mockRecipe = {
        name: "Multi-Step Recipe",
        description: "Recipe with many steps",
        ingredients: [{ content: "Ingredient 1", position: 1 }],
        steps: [
          { content: "Step 1", position: 1 },
          { content: "Step 2", position: 2 },
          { content: "Step 3", position: 3 },
          { content: "Step 4", position: 4 },
          { content: "Step 5", position: 5 },
          { content: "Step 6", position: 6 },
          { content: "Step 7", position: 7 },
          { content: "Step 8", position: 8 },
        ],
      };
      const inputText = "Make complex recipe";
      const userId = "user-123";

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: mockRecipe,
      });

      supabaseMocks.single.mockResolvedValueOnce({
        data: { id: "gen-123" },
        error: null,
      });

      const result = await service.generateRecipeFromText(inputText, userId);

      expect(result.steps).toHaveLength(8);
      expect(result.steps).toEqual(mockRecipe.steps);
      expect(result.steps[0].position).toBe(1);
      expect(result.steps[7].position).toBe(8);
    });

    it("should handle very large input text (edge case for payload size)", async () => {
      const mockRecipe = createValidRecipe();
      const largeInputText = "a".repeat(50 * 1024); // 50KB of text
      const userId = "user-123";

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: mockRecipe,
      });

      supabaseMocks.single.mockResolvedValueOnce({
        data: { id: "gen-123" },
        error: null,
      });

      const result = await service.generateRecipeFromText(largeInputText, userId);

      expect(result.generationId).toBe("gen-123");
      expect(supabaseMocks.insert).toHaveBeenCalledWith({
        user_id: userId,
        input_text: largeInputText,
        generated_output: mockRecipe,
        is_accepted: false,
      });
    });

    it("should validate recipe name with special characters, accents, and unicode", async () => {
      const mockRecipe = {
        name: "Żurek żytni - Tradycyjny",
        description: "Traditional Polish soup",
        ingredients: [{ content: "Ingredient 1", position: 1 }],
        steps: [{ content: "Step 1", position: 1 }],
      };
      const inputText = "Make Polish soup";
      const userId = "user-123";

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: mockRecipe,
      });

      supabaseMocks.single.mockResolvedValueOnce({
        data: { id: "gen-123" },
        error: null,
      });

      const result = await service.generateRecipeFromText(inputText, userId);

      expect(result.name).toBe("Żurek żytni - Tradycyjny");
      expect(supabaseMocks.insert).toHaveBeenCalledWith({
        user_id: userId,
        input_text: inputText,
        generated_output: mockRecipe,
        is_accepted: false,
      });
    });

    it("should validate ingredient and step content with special characters and unicode", async () => {
      const mockRecipe = {
        name: "Polish Recipe",
        description: "Test description",
        ingredients: [
          { content: "1 łyżka oliwy z oliwek", position: 1 },
          { content: "2 чашки муки", position: 2 },
        ],
        steps: [
          { content: "Добавить масло", position: 1 },
          { content: "Wymieszać składniki", position: 2 },
        ],
      };
      const inputText = "Make recipe";
      const userId = "user-123";

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: mockRecipe,
      });

      supabaseMocks.single.mockResolvedValueOnce({
        data: { id: "gen-123" },
        error: null,
      });

      const result = await service.generateRecipeFromText(inputText, userId);

      expect(result.ingredients[0].content).toBe("1 łyżka oliwy z oliwek");
      expect(result.ingredients[1].content).toBe("2 чашки муки");
      expect(result.steps[0].content).toBe("Добавить масло");
      expect(result.steps[1].content).toBe("Wymieszać składniki");
    });

    it("should validate handling of invalid userId (though typically controlled by auth layer)", async () => {
      const mockRecipe = createValidRecipe();
      const inputText = "Make pasta";
      const invalidUserId = "";

      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: mockRecipe,
      });

      supabaseMocks.single.mockResolvedValueOnce({
        data: { id: "gen-123" },
        error: null,
      });

      const result = await service.generateRecipeFromText(inputText, invalidUserId);

      expect(result.generationId).toBe("gen-123");
      expect(supabaseMocks.insert).toHaveBeenCalledWith({
        user_id: invalidUserId,
        input_text: inputText,
        generated_output: mockRecipe,
        is_accepted: false,
      });
    });

    it("should verify service can handle multiple concurrent generation requests", async () => {
      const mockRecipe1 = {
        name: "Recipe 1",
        description: "Description 1",
        ingredients: [{ content: "Ingredient 1", position: 1 }],
        steps: [{ content: "Step 1", position: 1 }],
      };
      const mockRecipe2 = {
        name: "Recipe 2",
        description: "Description 2",
        ingredients: [{ content: "Ingredient 2", position: 1 }],
        steps: [{ content: "Step 2", position: 1 }],
      };
      const mockRecipe3 = {
        name: "Recipe 3",
        description: "Description 3",
        ingredients: [{ content: "Ingredient 3", position: 1 }],
        steps: [{ content: "Step 3", position: 1 }],
      };

      vi.mocked(mockOpenRouterService.generate)
        .mockResolvedValueOnce({ raw: {}, json: mockRecipe1 })
        .mockResolvedValueOnce({ raw: {}, json: mockRecipe2 })
        .mockResolvedValueOnce({ raw: {}, json: mockRecipe3 });

      supabaseMocks.single
        .mockResolvedValueOnce({ data: { id: "gen-1" }, error: null })
        .mockResolvedValueOnce({ data: { id: "gen-2" }, error: null })
        .mockResolvedValueOnce({ data: { id: "gen-3" }, error: null });

      const results = await Promise.all([
        service.generateRecipeFromText("Make recipe 1", "user-1"),
        service.generateRecipeFromText("Make recipe 2", "user-2"),
        service.generateRecipeFromText("Make recipe 3", "user-3"),
      ]);

      expect(results[0].generationId).toBe("gen-1");
      expect(results[0].name).toBe("Recipe 1");
      expect(results[1].generationId).toBe("gen-2");
      expect(results[1].name).toBe("Recipe 2");
      expect(results[2].generationId).toBe("gen-3");
      expect(results[2].name).toBe("Recipe 3");
    });
  });
});
