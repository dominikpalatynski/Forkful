import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecipeService, NotFoundError, ForbiddenError } from './recipe.service';
import type { SupabaseClientType } from '../../db/supabase.client';

// Create a comprehensive mock of the Supabase client's fluent API
// This demonstrates how to properly mock the complex chaining pattern
const createMockSupabaseClient = () => {
  // Create individual mock functions for each method in the chain
  const mockSingle = vi.fn();

  // The key insight: each method in the chain must return an object that
  // still has the remaining methods available for chaining
  const mockEq = vi.fn(() => ({
    eq: mockEq,      // Allow chaining multiple .eq() calls
    single: mockSingle
  }));

  const mockSelect = vi.fn(() => ({
    eq: mockEq,
    single: mockSingle
  }));

  const mockFrom = vi.fn(() => ({
    select: mockSelect
  }));

  // The main supabase mock object
  const mockSupabase = {
    from: mockFrom,
  } as unknown as SupabaseClientType;

  // Return both the client and the individual mocks for easy configuration in tests
  return {
    client: mockSupabase,
    mocks: {
      from: mockFrom,
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    },
  };
};

describe('RecipeService - Supabase Mocking Example', () => {
  let recipeService: RecipeService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  // Before each test, create a fresh mock client
  beforeEach(() => {
    vi.resetAllMocks(); // Clear all mock call history and implementations
    mockSupabase = createMockSupabaseClient();
    recipeService = new RecipeService(mockSupabase.client);
  });

  describe('getRecipeById - Comprehensive Mocking Scenario', () => {
    const testRecipeId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
    const testUserId = '550e8400-e29b-41d4-a716-446655440005'; // Valid UUID

    it('should successfully retrieve a recipe when user owns it', async () => {
      // ===== ARRANGE: Set up the mock behavior =====

      // Step 1: Mock the existence check query
      // This simulates: supabase.from('recipes').select('id, user_id').eq('id', recipeId).single()
      const existenceCheckResult = {
        data: {
          id: testRecipeId,
          user_id: testUserId, // User owns this recipe
        },
        error: null,
      };

      // Step 2: Mock the full recipe fetch query
      // This simulates the complex JOIN query that fetches ingredients, steps, and tags
      // Note: Using valid UUIDs to satisfy Zod schema validation
      const fullRecipeFetchResult = {
        data: {
          id: testRecipeId,
          name: 'Chocolate Chip Cookies',
          description: 'Delicious homemade cookies',
          created_at: '2024-01-15T10:30:00Z',
          ingredients: [
            { id: '550e8400-e29b-41d4-a716-446655440001', content: '2 cups flour', position: 1 },
            { id: '550e8400-e29b-41d4-a716-446655440002', content: '1 cup butter', position: 2 },
          ],
          steps: [
            { id: '550e8400-e29b-41d4-a716-446655440003', content: 'Mix dry ingredients', position: 1 },
            { id: '550e8400-e29b-41d4-a716-446655440004', content: 'Bake at 350°F for 12 minutes', position: 2 },
          ],
          recipe_tags: [
            { tags: { name: 'Dessert' } },
            { tags: { name: 'Cookies' } },
          ],
        },
        error: null,
      };

      // Configure the mocks for the sequence of calls in getRecipeById

      // First call: existence check
      mockSupabase.mocks.single.mockResolvedValueOnce(existenceCheckResult);

      // Second call: full recipe fetch
      mockSupabase.mocks.single.mockResolvedValueOnce(fullRecipeFetchResult);

      // ===== ACT: Call the method under test =====
      const result = await recipeService.getRecipeById(testRecipeId, testUserId);

      // ===== ASSERT: Verify the behavior =====

      // Verify the final result structure
      expect(result).toEqual({
        id: testRecipeId,
        name: 'Chocolate Chip Cookies',
        description: 'Delicious homemade cookies',
        created_at: '2024-01-15T10:30:00Z',
        ingredients: [
          { id: '550e8400-e29b-41d4-a716-446655440001', content: '2 cups flour', position: 1 },
          { id: '550e8400-e29b-41d4-a716-446655440002', content: '1 cup butter', position: 2 },
        ],
        steps: [
          { id: '550e8400-e29b-41d4-a716-446655440003', content: 'Mix dry ingredients', position: 1 },
          { id: '550e8400-e29b-41d4-a716-446655440004', content: 'Bake at 350°F for 12 minutes', position: 2 },
        ],
        tags: ['Dessert', 'Cookies'], // Note: tags are flattened from recipe_tags
      });

      // Verify that supabase.from was called with the correct table name
      expect(mockSupabase.mocks.from).toHaveBeenCalledWith('recipes');

      // Verify the existence check query structure
      expect(mockSupabase.mocks.select).toHaveBeenNthCalledWith(1, 'id, user_id');
      expect(mockSupabase.mocks.eq).toHaveBeenNthCalledWith(1, 'id', testRecipeId);
      expect(mockSupabase.mocks.single).toHaveBeenNthCalledWith(1);

      // Verify the full fetch query structure (this is the complex JOIN query)
      expect(mockSupabase.mocks.select).toHaveBeenNthCalledWith(2, `
        id,
        name,
        description,
        created_at,
        ingredients (
          id,
          content,
          position
        ),
        steps (
          id,
          content,
          position
        ),
        recipe_tags (
          tags (
            name
          )
        )
      `);
      expect(mockSupabase.mocks.eq).toHaveBeenNthCalledWith(2, 'id', testRecipeId);
      expect(mockSupabase.mocks.eq).toHaveBeenNthCalledWith(3, 'user_id', testUserId);
      expect(mockSupabase.mocks.single).toHaveBeenNthCalledWith(2);

      // Verify total call counts
      expect(mockSupabase.mocks.from).toHaveBeenCalledTimes(2); // Two separate queries
      expect(mockSupabase.mocks.select).toHaveBeenCalledTimes(2);
      expect(mockSupabase.mocks.eq).toHaveBeenCalledTimes(3); // id, id, user_id
      expect(mockSupabase.mocks.single).toHaveBeenCalledTimes(2);
    });
  });
});
