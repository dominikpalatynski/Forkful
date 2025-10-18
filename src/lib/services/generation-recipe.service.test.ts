import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerationRecipeService } from './generation-recipe.service';
import type { SupabaseClientType } from '../../db/supabase.client';
import type { OpenRouterService } from './openrouter.service';
import { getUserPrompt } from './prompt';

describe('GenerationRecipeService', () => {
  let mockSupabase: SupabaseClientType;
  let mockOpenRouterService: OpenRouterService;
  let service: GenerationRecipeService;

  // Mock setup following the vitest-supabase-mock pattern
  const createBaseMocks = () => {
    const mockSingle = vi.fn();
    const mockInsert = vi.fn();
    const mockSelect = vi.fn();
    const mockFrom = vi.fn();

    return { from: mockFrom, select: mockSelect, insert: mockInsert, single: mockSingle };
  };

  let baseMocks: ReturnType<typeof createBaseMocks>;

  beforeEach(() => {
    vi.resetAllMocks();

    baseMocks = createBaseMocks();

    // Default fallback for all tables
    baseMocks.from.mockImplementation((tableName: string) => ({
      insert: baseMocks.insert,
      select: baseMocks.select,
      update: vi.fn(),
      delete: vi.fn()
    }));

    // Create mock Supabase client
    mockSupabase = { from: baseMocks.from } as unknown as SupabaseClientType;

    // Mock just the generate method following open-router-service-mock pattern
    mockOpenRouterService = {
      generate: vi.fn(),
    } as unknown as OpenRouterService;

    service = new GenerationRecipeService(mockSupabase, mockOpenRouterService);
  });

  describe('generateRecipeFromText', () => {
    it('should successfully generate recipe from text with all required fields', async () => {
      // Arrange
      const inputText = 'Make pasta carbonara with bacon and eggs';
      const userId = 'user-123';
      const expectedGenerationId = 'gen-123';

      const mockRecipe = {
        name: 'Pasta Carbonara',
        description: 'Classic Italian pasta dish with bacon and eggs',
        ingredients: [
          { content: '400g pasta', position: 1 },
          { content: '200g bacon', position: 2 },
          { content: '4 eggs', position: 3 },
        ],
        steps: [
          { content: 'Boil pasta in salted water', position: 1 },
          { content: 'Fry bacon until crispy', position: 2 },
          { content: 'Mix eggs and cheese', position: 3 },
        ],
      };

      // Mock OpenRouterService.generate() to return valid recipe JSON
      vi.mocked(mockOpenRouterService.generate).mockResolvedValueOnce({
        raw: {},
        json: mockRecipe,
      });

      // Mock Supabase insert for generation record
      const mockGenerationInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: baseMocks.single.mockResolvedValue({
            data: { id: expectedGenerationId },
            error: null,
          }),
        }),
      });

      baseMocks.from.mockImplementation((tableName: string) => {
        if (tableName === 'generation') {
          return {
            insert: mockGenerationInsert,
          };
        }
        return {
          insert: baseMocks.insert,
          select: baseMocks.select,
          update: vi.fn(),
          delete: vi.fn()
        };
      });

      // Act
      const result = await service.generateRecipeFromText(inputText, userId);

      // Assert
      expect(result).toEqual({
        generationId: expectedGenerationId,
        name: mockRecipe.name,
        description: mockRecipe.description,
        ingredients: mockRecipe.ingredients,
        steps: mockRecipe.steps,
      });

      // Verify database insertion called exactly once with correct parameters
      expect(mockGenerationInsert).toHaveBeenCalledTimes(1);
      expect(mockGenerationInsert).toHaveBeenCalledWith({
        user_id: userId,
        input_text: inputText,
        generated_output: mockRecipe,
        is_accepted: false,
      });
       expect(mockOpenRouterService.generate).toHaveBeenCalledTimes(1);
       expect(mockOpenRouterService.generate).toHaveBeenCalledWith({
        userMessage: getUserPrompt(inputText),
       });
      // Verify no errors thrown (implicitly tested by reaching this point)
    });
  });
});
