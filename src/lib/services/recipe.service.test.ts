import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecipeService, NotFoundError, ForbiddenError } from "./recipe.service";
import type { SupabaseClientType } from "../../db/supabase.client";

// Type definitions for test mocks
type MockFn = ReturnType<typeof vi.fn>;

// Type helper to access internal/private methods for testing
type RecipeServiceInternal = RecipeService & {
  getRecipeById: (recipeId: string, userId: string) => Promise<unknown>;
  rollbackRecipeUpdate: (recipeId: string) => Promise<void>;
};

// Create reusable mock functions for Supabase fluent API
const createBaseMocks = () => {
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();

  const mockEq = vi.fn(() => ({
    eq: mockEq,
    single: mockSingle,
  }));

  const mockSelect = vi.fn(() => ({
    eq: mockEq,
    single: mockSingle,
  }));

  const mockFrom = vi.fn();

  return {
    from: mockFrom,
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    eq: mockEq,
    single: mockSingle,
  };
};

describe("RecipeService", () => {
  let recipeService: RecipeService;
  let baseMocks: ReturnType<typeof createBaseMocks>;

  beforeEach(() => {
    vi.resetAllMocks();
    baseMocks = createBaseMocks();

    // Create mock delete that supports chaining
    const mockDelete = vi.fn(() => ({
      eq: baseMocks.eq,
    }));

    baseMocks.from.mockImplementation((tableName: string) => ({
      select: baseMocks.select,
      insert: baseMocks.insert,
      update: baseMocks.update,
      delete: mockDelete,
    }));

    const mockSupabaseClient = {
      from: baseMocks.from,
    } as unknown as SupabaseClientType;

    recipeService = new RecipeService(mockSupabaseClient);
  });

  describe("createRecipe", () => {
    const testUserId = "550e8400-e29b-41d4-a716-446655440005";
    const testRecipeId = "550e8400-e29b-41d4-a716-446655440000";

    describe("Success Scenarios", () => {
      it("should successfully create recipe with all fields (name, description, ingredients, steps, tags)", async () => {
        const createRecipeData = {
          name: "Chocolate Chip Cookies",
          description: "Delicious homemade cookies",
          generationId: "gen-123",
          ingredients: [
            { content: "2 cups flour", position: 1 },
            { content: "1 cup butter", position: 2 },
            { content: "1 cup sugar", position: 3 },
          ],
          steps: [
            { content: "Mix dry ingredients", position: 1 },
            { content: "Bake at 350°F for 12 minutes", position: 2 },
          ],
          tags: ["Dessert", "Cookies"],
        };

        const recipeInsertResult = { data: { id: testRecipeId }, error: null };
        const ingredientsInsertResult = { error: null };
        const stepsInsertResult = { error: null };
        const dessertTagCheckResult = { data: null, error: { code: "PGRST116" } };
        const dessertTagCreateResult = { data: { id: "tag-dessert-id" }, error: null };
        const cookiesTagCheckResult = { data: { id: "tag-cookies-id" }, error: null };
        const recipeTagsInsertResult = { error: null };
        const generationUpdateResult = { error: null };
        const finalRecipeFetchResult = {
          data: {
            id: testRecipeId,
            name: "Chocolate Chip Cookies",
            description: "Delicious homemade cookies",
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [
              { id: "550e8400-e29b-41d4-a716-446655440010", content: "2 cups flour", position: 1 },
              { id: "550e8400-e29b-41d4-a716-446655440011", content: "1 cup butter", position: 2 },
              { id: "550e8400-e29b-41d4-a716-446655440012", content: "1 cup sugar", position: 3 },
            ],
            steps: [
              { id: "550e8400-e29b-41d4-a716-446655440013", content: "Mix dry ingredients", position: 1 },
              { id: "550e8400-e29b-41d4-a716-446655440014", content: "Bake at 350°F for 12 minutes", position: 2 },
            ],
            recipe_tags: [{ tags: { name: "Dessert" } }, { tags: { name: "Cookies" } }],
          },
          error: null,
        };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
              select: baseMocks.select,
            };
          }
          if (tableName === "ingredients") {
            return { insert: vi.fn().mockResolvedValue(ingredientsInsertResult) };
          }
          if (tableName === "steps") {
            return { insert: vi.fn().mockResolvedValue(stepsInsertResult) };
          }
          if (tableName === "tags") {
            return {
              select: baseMocks.select,
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(dessertTagCreateResult),
                }),
              }),
            };
          }
          if (tableName === "recipe_tags") {
            return { insert: vi.fn().mockResolvedValue(recipeTagsInsertResult) };
          }
          if (tableName === "generation") {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue(generationUpdateResult),
                }),
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        baseMocks.single.mockResolvedValueOnce(dessertTagCheckResult);
        baseMocks.single.mockResolvedValueOnce(cookiesTagCheckResult);
        baseMocks.single.mockResolvedValueOnce({ data: { id: testRecipeId, user_id: testUserId }, error: null });
        baseMocks.single.mockResolvedValueOnce(finalRecipeFetchResult);

        const result = await recipeService.createRecipe(createRecipeData, testUserId);

        expect(result).toEqual({
          id: testRecipeId,
          name: "Chocolate Chip Cookies",
          description: "Delicious homemade cookies",
          created_at: "2024-01-15T10:30:00Z",
          ingredients: [
            { id: "550e8400-e29b-41d4-a716-446655440010", content: "2 cups flour", position: 1 },
            { id: "550e8400-e29b-41d4-a716-446655440011", content: "1 cup butter", position: 2 },
            { id: "550e8400-e29b-41d4-a716-446655440012", content: "1 cup sugar", position: 3 },
          ],
          steps: [
            { id: "550e8400-e29b-41d4-a716-446655440013", content: "Mix dry ingredients", position: 1 },
            { id: "550e8400-e29b-41d4-a716-446655440014", content: "Bake at 350°F for 12 minutes", position: 2 },
          ],
          tags: ["Dessert", "Cookies"],
        });
      });

      it("should successfully create recipe with only required name field", async () => {
        const createRecipeData = {
          name: "Simple Recipe",
        };

        const recipeInsertResult = { data: { id: testRecipeId }, error: null };
        const finalRecipeFetchResult = {
          data: {
            id: testRecipeId,
            name: "Simple Recipe",
            description: null,
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [],
            steps: [],
            recipe_tags: [],
          },
          error: null,
        };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
              select: baseMocks.select,
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        baseMocks.single.mockResolvedValueOnce({ data: { id: testRecipeId, user_id: testUserId }, error: null });
        baseMocks.single.mockResolvedValueOnce(finalRecipeFetchResult);

        const result = await recipeService.createRecipe(createRecipeData, testUserId);

        expect(result).toEqual({
          id: testRecipeId,
          name: "Simple Recipe",
          description: null,
          created_at: "2024-01-15T10:30:00Z",
          ingredients: [],
          steps: [],
          tags: [],
        });
      });

      it("should create recipe with tags that already exist for the user", async () => {
        const createRecipeData = {
          name: "Vegetarian Recipe",
          tags: ["Vegetarian", "Quick"],
        };

        const recipeInsertResult = { data: { id: testRecipeId }, error: null };
        const vegetarianTagCheckResult = { data: { id: "tag-vegetarian-id" }, error: null };
        const quickTagCheckResult = { data: { id: "tag-quick-id" }, error: null };
        const recipeTagsInsertResult = { error: null };
        const finalRecipeFetchResult = {
          data: {
            id: testRecipeId,
            name: "Vegetarian Recipe",
            description: null,
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [],
            steps: [],
            recipe_tags: [{ tags: { name: "Vegetarian" } }, { tags: { name: "Quick" } }],
          },
          error: null,
        };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
              select: baseMocks.select,
            };
          }
          if (tableName === "recipe_tags") {
            return { insert: vi.fn().mockResolvedValue(recipeTagsInsertResult) };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        baseMocks.single.mockResolvedValueOnce(vegetarianTagCheckResult);
        baseMocks.single.mockResolvedValueOnce(quickTagCheckResult);
        baseMocks.single.mockResolvedValueOnce({ data: { id: testRecipeId, user_id: testUserId }, error: null });
        baseMocks.single.mockResolvedValueOnce(finalRecipeFetchResult);

        const result = await recipeService.createRecipe(createRecipeData, testUserId);

        expect(result.tags).toEqual(["Vegetarian", "Quick"]);
      });

      it("should create recipe where some tags exist and some are new", async () => {
        const createRecipeData = {
          name: "Experimental Recipe",
          tags: ["Vegetarian", "Experimental"],
        };

        const recipeInsertResult = { data: { id: testRecipeId }, error: null };
        const vegetarianTagCheckResult = { data: { id: "tag-vegetarian-id" }, error: null };
        const experimentalTagCheckResult = { data: null, error: { code: "PGRST116" } };
        const experimentalTagCreateResult = { data: { id: "tag-experimental-id" }, error: null };
        const recipeTagsInsertResult = { error: null };
        const finalRecipeFetchResult = {
          data: {
            id: testRecipeId,
            name: "Experimental Recipe",
            description: null,
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [],
            steps: [],
            recipe_tags: [{ tags: { name: "Vegetarian" } }, { tags: { name: "Experimental" } }],
          },
          error: null,
        };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
              select: baseMocks.select,
            };
          }
          if (tableName === "tags") {
            return {
              select: baseMocks.select,
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(experimentalTagCreateResult),
                }),
              }),
            };
          }
          if (tableName === "recipe_tags") {
            return { insert: vi.fn().mockResolvedValue(recipeTagsInsertResult) };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        baseMocks.single.mockResolvedValueOnce(vegetarianTagCheckResult);
        baseMocks.single.mockResolvedValueOnce(experimentalTagCheckResult);
        baseMocks.single.mockResolvedValueOnce({ data: { id: testRecipeId, user_id: testUserId }, error: null });
        baseMocks.single.mockResolvedValueOnce(finalRecipeFetchResult);

        const result = await recipeService.createRecipe(createRecipeData, testUserId);

        expect(result.tags).toEqual(["Vegetarian", "Experimental"]);
      });

      it("should create recipe without linking to a generation record", async () => {
        const createRecipeData = {
          name: "Recipe Without Generation",
          description: "No generation ID provided",
          ingredients: [{ content: "1 cup flour", position: 1 }],
          steps: [{ content: "Mix ingredients", position: 1 }],
          tags: ["Simple"],
        };

        const recipeInsertResult = { data: { id: testRecipeId }, error: null };
        const ingredientsInsertResult = { error: null };
        const stepsInsertResult = { error: null };
        const simpleTagCheckResult = { data: null, error: { code: "PGRST116" } };
        const simpleTagCreateResult = { data: { id: "tag-simple-id" }, error: null };
        const recipeTagsInsertResult = { error: null };
        const finalRecipeFetchResult = {
          data: {
            id: testRecipeId,
            name: "Recipe Without Generation",
            description: "No generation ID provided",
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [{ id: "550e8400-e29b-41d4-a716-446655440010", content: "1 cup flour", position: 1 }],
            steps: [{ id: "550e8400-e29b-41d4-a716-446655440011", content: "Mix ingredients", position: 1 }],
            recipe_tags: [{ tags: { name: "Simple" } }],
          },
          error: null,
        };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
              select: baseMocks.select,
            };
          }
          if (tableName === "ingredients") {
            return { insert: vi.fn().mockResolvedValue(ingredientsInsertResult) };
          }
          if (tableName === "steps") {
            return { insert: vi.fn().mockResolvedValue(stepsInsertResult) };
          }
          if (tableName === "tags") {
            return {
              select: baseMocks.select,
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(simpleTagCreateResult),
                }),
              }),
            };
          }
          if (tableName === "recipe_tags") {
            return { insert: vi.fn().mockResolvedValue(recipeTagsInsertResult) };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        baseMocks.single.mockResolvedValueOnce(simpleTagCheckResult);
        baseMocks.single.mockResolvedValueOnce({ data: { id: testRecipeId, user_id: testUserId }, error: null });
        baseMocks.single.mockResolvedValueOnce(finalRecipeFetchResult);

        const result = await recipeService.createRecipe(createRecipeData, testUserId);

        expect(result.name).toBe("Recipe Without Generation");
        expect(result.description).toBe("No generation ID provided");
      });
    });

    describe("Error Scenarios", () => {
      it("should fail when initial recipe insert fails", async () => {
        const createRecipeData = {
          name: "Failing Recipe",
        };

        const recipeInsertResult = { data: null, error: { message: "UNIQUE violation" } };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        await expect(recipeService.createRecipe(createRecipeData, testUserId)).rejects.toThrow(
          "Failed to create recipe: UNIQUE violation"
        );
      });

      it("should rollback recipe creation when ingredient insert fails", async () => {
        const createRecipeData = {
          name: "Recipe with Bad Ingredients",
          ingredients: [{ content: "", position: 1 }],
        };

        const recipeInsertResult = { data: { id: testRecipeId }, error: null };
        const ingredientsInsertResult = { error: { message: "Column content cannot be null" } };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
              select: baseMocks.select,
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "ingredients") {
            return {
              insert: vi.fn().mockResolvedValue(ingredientsInsertResult),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "steps") {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "recipe_tags") {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        await expect(recipeService.createRecipe(createRecipeData, testUserId)).rejects.toThrow(
          "Failed to insert ingredients: Column content cannot be null"
        );
      });

      it("should rollback recipe creation when step insert fails", async () => {
        const createRecipeData = {
          name: "Recipe with Bad Steps",
          ingredients: [{ content: "1 cup flour", position: 1 }],
          steps: [
            { content: "Valid step", position: 1 },
            { content: "Bad step", position: -1 },
          ],
        };

        const recipeInsertResult = { data: { id: testRecipeId }, error: null };
        const ingredientsInsertResult = { error: null };
        const stepsInsertResult = { error: { message: "Invalid position value" } };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
              select: baseMocks.select,
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "ingredients") {
            return {
              insert: vi.fn().mockResolvedValue(ingredientsInsertResult),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "steps") {
            return {
              insert: vi.fn().mockResolvedValue(stepsInsertResult),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "recipe_tags") {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        await expect(recipeService.createRecipe(createRecipeData, testUserId)).rejects.toThrow(
          "Failed to insert steps: Invalid position value"
        );
      });

      it("should rollback when creating new tag fails", async () => {
        const createRecipeData = {
          name: "Recipe with Bad Tag",
          tags: ["NewTag"],
        };

        const recipeInsertResult = { data: { id: testRecipeId }, error: null };
        const newTagCheckResult = { data: null, error: { code: "PGRST116" } };
        const newTagCreateResult = { data: null, error: { message: "Database connection lost" } };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
              select: baseMocks.select,
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "ingredients") {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "steps") {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "tags") {
            return {
              select: baseMocks.select,
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(newTagCreateResult),
                }),
              }),
            };
          }
          if (tableName === "recipe_tags") {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        baseMocks.single.mockResolvedValueOnce(newTagCheckResult);

        await expect(recipeService.createRecipe(createRecipeData, testUserId)).rejects.toThrow(
          "Failed to create tag 'NewTag': Database connection lost"
        );
      });

      it("should rollback when linking tags to recipe fails", async () => {
        const createRecipeData = {
          name: "Recipe with Tag Link Failure",
          tags: ["ExistingTag"],
        };

        const recipeInsertResult = { data: { id: testRecipeId }, error: null };
        const existingTagCheckResult = { data: { id: "tag-existing-id" }, error: null };
        const recipeTagsInsertResult = { error: { message: "Foreign key constraint violated" } };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
              select: baseMocks.select,
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "ingredients") {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "steps") {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "recipe_tags") {
            return {
              insert: vi.fn().mockResolvedValue(recipeTagsInsertResult),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        baseMocks.single.mockResolvedValueOnce(existingTagCheckResult);

        await expect(recipeService.createRecipe(createRecipeData, testUserId)).rejects.toThrow(
          "Failed to link tags to recipe: Foreign key constraint violated"
        );
      });

      it("should rollback when updating generation record fails", async () => {
        const createRecipeData = {
          name: "Recipe with Generation Failure",
          generationId: "gen-123",
          ingredients: [{ content: "1 cup flour", position: 1 }],
          steps: [{ content: "Mix well", position: 1 }],
          tags: ["Simple"],
        };

        const recipeInsertResult = { data: { id: testRecipeId }, error: null };
        const ingredientsInsertResult = { error: null };
        const stepsInsertResult = { error: null };
        const simpleTagCheckResult = { data: { id: "tag-simple-id" }, error: null };
        const recipeTagsInsertResult = { error: null };
        const generationUpdateResult = { error: { message: "Generation record not found" } };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
              select: baseMocks.select,
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "ingredients") {
            return {
              insert: vi.fn().mockResolvedValue(ingredientsInsertResult),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "steps") {
            return {
              insert: vi.fn().mockResolvedValue(stepsInsertResult),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "recipe_tags") {
            return {
              insert: vi.fn().mockResolvedValue(recipeTagsInsertResult),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          if (tableName === "generation") {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue(generationUpdateResult),
                }),
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        baseMocks.single.mockResolvedValueOnce(simpleTagCheckResult);

        await expect(recipeService.createRecipe(createRecipeData, testUserId)).rejects.toThrow(
          "Failed to update generation record: Generation record not found"
        );
      });

      it("should fail when fetching created recipe returns error", async () => {
        const createRecipeData = {
          name: "Recipe Fetch Failure",
        };

        const recipeInsertResult = { data: { id: testRecipeId }, error: null };
        const existenceCheckResult = { data: { id: testRecipeId, user_id: testUserId }, error: null };
        const recipeFetchResult = { data: null, error: { message: "Recipe fetch failed" } };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
              select: baseMocks.select,
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        baseMocks.single.mockResolvedValueOnce(existenceCheckResult);
        baseMocks.single.mockResolvedValueOnce(recipeFetchResult);

        await expect(recipeService.createRecipe(createRecipeData, testUserId)).rejects.toThrow(
          "Failed to fetch recipe details: Recipe fetch failed"
        );
      });

      it("should fail when recipe data structure validation fails", async () => {
        const createRecipeData = {
          name: "Invalid Recipe Structure",
        };

        const recipeInsertResult = { data: { id: testRecipeId }, error: null };
        const existenceCheckResult = { data: { id: testRecipeId, user_id: testUserId }, error: null };
        const invalidRecipeFetchResult = {
          data: {
            id: null, // Invalid - should be string
            name: "Invalid Recipe Structure",
            ingredients: [],
            steps: [],
            recipe_tags: [],
          },
          error: null,
        };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue(recipeInsertResult),
                }),
              }),
              select: baseMocks.select,
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({}),
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        baseMocks.single.mockResolvedValueOnce(existenceCheckResult);
        baseMocks.single.mockResolvedValueOnce(invalidRecipeFetchResult);

        await expect(recipeService.createRecipe(createRecipeData, testUserId)).rejects.toThrow(
          "Invalid recipe data structure:"
        );
      });
    });
  });

  describe("getRecipeById", () => {
    describe("Success Scenarios", () => {
      it("should successfully retrieve full recipe details when user is authorized", async () => {
        const testRecipeId = "recipe-123";
        const testUserId = "user-123";

        const mockRecipeData = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test Recipe",
          description: "Test Description",
          created_at: "2024-01-01T00:00:00Z",
          ingredients: [
            { id: "550e8400-e29b-41d4-a716-446655440001", content: "Ingredient 1", position: 1 },
            { id: "550e8400-e29b-41d4-a716-446655440002", content: "Ingredient 2", position: 2 },
          ],
          steps: [
            { id: "550e8400-e29b-41d4-a716-446655440003", content: "Step 1", position: 1 },
            { id: "550e8400-e29b-41d4-a716-446655440004", content: "Step 2", position: 2 },
          ],
          recipe_tags: [{ tags: { name: "tag1" } }, { tags: { name: "tag2" } }],
        };

        const mockExistenceCheckResult = { data: { id: testRecipeId, user_id: testUserId }, error: null };
        const mockRecipeFetchResult = { data: mockRecipeData, error: null };

        // Mock the from method to handle different queries
        const existenceCheckCallCount = 0;
        const fullFetchCallCount = 0;

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              select: vi.fn((selectArg: string) => {
                if (selectArg === "id, user_id") {
                  // Existence check query
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          single: vi.fn().mockResolvedValueOnce(mockExistenceCheckResult),
                        };
                      }
                      return { single: vi.fn() };
                    }),
                  };
                } else {
                  // Full recipe fetch query
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          eq: vi.fn((field2: string, value2: string) => {
                            if (field2 === "user_id" && value2 === testUserId) {
                              return {
                                single: vi.fn().mockResolvedValueOnce(mockRecipeFetchResult),
                              };
                            }
                            return { single: vi.fn() };
                          }),
                        };
                      }
                      return { eq: vi.fn() };
                    }),
                  };
                }
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        const result = await recipeService.getRecipeById(testRecipeId, testUserId);

        expect(result).toEqual({
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test Recipe",
          description: "Test Description",
          created_at: "2024-01-01T00:00:00Z",
          ingredients: [
            { id: "550e8400-e29b-41d4-a716-446655440001", content: "Ingredient 1", position: 1 },
            { id: "550e8400-e29b-41d4-a716-446655440002", content: "Ingredient 2", position: 2 },
          ],
          steps: [
            { id: "550e8400-e29b-41d4-a716-446655440003", content: "Step 1", position: 1 },
            { id: "550e8400-e29b-41d4-a716-446655440004", content: "Step 2", position: 2 },
          ],
          tags: ["tag1", "tag2"],
        });
      });

      it("should successfully retrieve recipe with null/empty ingredients array", async () => {
        const testRecipeId = "recipe-123";
        const testUserId = "user-123";

        const mockRecipeData = {
          id: "550e8400-e29b-41d4-a716-446655440005",
          name: "Test Recipe",
          description: "Test Description",
          created_at: "2024-01-01T00:00:00Z",
          ingredients: null,
          steps: [{ id: "550e8400-e29b-41d4-a716-446655440006", content: "Step 1", position: 1 }],
          recipe_tags: [{ tags: { name: "tag1" } }],
        };

        const mockExistenceCheckResult = { data: { id: testRecipeId, user_id: testUserId }, error: null };
        const mockRecipeFetchResult = { data: mockRecipeData, error: null };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              select: vi.fn((selectArg: string) => {
                if (selectArg === "id, user_id") {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          single: vi.fn().mockResolvedValueOnce(mockExistenceCheckResult),
                        };
                      }
                      return { single: vi.fn() };
                    }),
                  };
                } else {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          eq: vi.fn((field2: string, value2: string) => {
                            if (field2 === "user_id" && value2 === testUserId) {
                              return {
                                single: vi.fn().mockResolvedValueOnce(mockRecipeFetchResult),
                              };
                            }
                            return { single: vi.fn() };
                          }),
                        };
                      }
                      return { eq: vi.fn() };
                    }),
                  };
                }
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        const result = await recipeService.getRecipeById(testRecipeId, testUserId);

        expect(result).toEqual({
          id: "550e8400-e29b-41d4-a716-446655440005",
          name: "Test Recipe",
          description: "Test Description",
          created_at: "2024-01-01T00:00:00Z",
          ingredients: [],
          steps: [{ id: "550e8400-e29b-41d4-a716-446655440006", content: "Step 1", position: 1 }],
          tags: ["tag1"],
        });
      });

      it("should successfully retrieve recipe with null/empty steps array", async () => {
        const testRecipeId = "recipe-123";
        const testUserId = "user-123";

        const mockRecipeData = {
          id: "550e8400-e29b-41d4-a716-446655440007",
          name: "Test Recipe",
          description: "Test Description",
          created_at: "2024-01-01T00:00:00Z",
          ingredients: [{ id: "550e8400-e29b-41d4-a716-446655440008", content: "Ingredient 1", position: 1 }],
          steps: null,
          recipe_tags: [{ tags: { name: "tag1" } }],
        };

        const mockExistenceCheckResult = { data: { id: testRecipeId, user_id: testUserId }, error: null };
        const mockRecipeFetchResult = { data: mockRecipeData, error: null };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              select: vi.fn((selectArg: string) => {
                if (selectArg === "id, user_id") {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          single: vi.fn().mockResolvedValueOnce(mockExistenceCheckResult),
                        };
                      }
                      return { single: vi.fn() };
                    }),
                  };
                } else {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          eq: vi.fn((field2: string, value2: string) => {
                            if (field2 === "user_id" && value2 === testUserId) {
                              return {
                                single: vi.fn().mockResolvedValueOnce(mockRecipeFetchResult),
                              };
                            }
                            return { single: vi.fn() };
                          }),
                        };
                      }
                      return { eq: vi.fn() };
                    }),
                  };
                }
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        const result = await recipeService.getRecipeById(testRecipeId, testUserId);

        expect(result).toEqual({
          id: "550e8400-e29b-41d4-a716-446655440007",
          name: "Test Recipe",
          description: "Test Description",
          created_at: "2024-01-01T00:00:00Z",
          ingredients: [{ id: "550e8400-e29b-41d4-a716-446655440008", content: "Ingredient 1", position: 1 }],
          steps: [],
          tags: ["tag1"],
        });
      });

      it("should successfully retrieve recipe with null/empty tags array", async () => {
        const testRecipeId = "recipe-123";
        const testUserId = "user-123";

        const mockRecipeData = {
          id: "550e8400-e29b-41d4-a716-446655440009",
          name: "Test Recipe",
          description: "Test Description",
          created_at: "2024-01-01T00:00:00Z",
          ingredients: [{ id: "550e8400-e29b-41d4-a716-446655440010", content: "Ingredient 1", position: 1 }],
          steps: [{ id: "550e8400-e29b-41d4-a716-446655440011", content: "Step 1", position: 1 }],
          recipe_tags: null,
        };

        const mockExistenceCheckResult = { data: { id: testRecipeId, user_id: testUserId }, error: null };
        const mockRecipeFetchResult = { data: mockRecipeData, error: null };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              select: vi.fn((selectArg: string) => {
                if (selectArg === "id, user_id") {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          single: vi.fn().mockResolvedValueOnce(mockExistenceCheckResult),
                        };
                      }
                      return { single: vi.fn() };
                    }),
                  };
                } else {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          eq: vi.fn((field2: string, value2: string) => {
                            if (field2 === "user_id" && value2 === testUserId) {
                              return {
                                single: vi.fn().mockResolvedValueOnce(mockRecipeFetchResult),
                              };
                            }
                            return { single: vi.fn() };
                          }),
                        };
                      }
                      return { eq: vi.fn() };
                    }),
                  };
                }
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        const result = await recipeService.getRecipeById(testRecipeId, testUserId);

        expect(result).toEqual({
          id: "550e8400-e29b-41d4-a716-446655440009",
          name: "Test Recipe",
          description: "Test Description",
          created_at: "2024-01-01T00:00:00Z",
          ingredients: [{ id: "550e8400-e29b-41d4-a716-446655440010", content: "Ingredient 1", position: 1 }],
          steps: [{ id: "550e8400-e29b-41d4-a716-446655440011", content: "Step 1", position: 1 }],
          tags: [],
        });
      });

      it("should sort ingredients and steps correctly by position", async () => {
        const testRecipeId = "recipe-123";
        const testUserId = "user-123";

        const mockRecipeData = {
          id: "550e8400-e29b-41d4-a716-446655440012",
          name: "Test Recipe",
          description: "Test Description",
          created_at: "2024-01-01T00:00:00Z",
          ingredients: [
            { id: "550e8400-e29b-41d4-a716-446655440013", content: "Ingredient 3", position: 3 },
            { id: "550e8400-e29b-41d4-a716-446655440014", content: "Ingredient 1", position: 1 },
            { id: "550e8400-e29b-41d4-a716-446655440015", content: "Ingredient 2", position: 2 },
          ],
          steps: [
            { id: "550e8400-e29b-41d4-a716-446655440016", content: "Step 2", position: 2 },
            { id: "550e8400-e29b-41d4-a716-446655440017", content: "Step 1", position: 1 },
            { id: "550e8400-e29b-41d4-a716-446655440018", content: "Step 3", position: 3 },
          ],
          recipe_tags: [],
        };

        const mockExistenceCheckResult = { data: { id: testRecipeId, user_id: testUserId }, error: null };
        const mockRecipeFetchResult = { data: mockRecipeData, error: null };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              select: vi.fn((selectArg: string) => {
                if (selectArg === "id, user_id") {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          single: vi.fn().mockResolvedValueOnce(mockExistenceCheckResult),
                        };
                      }
                      return { single: vi.fn() };
                    }),
                  };
                } else {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          eq: vi.fn((field2: string, value2: string) => {
                            if (field2 === "user_id" && value2 === testUserId) {
                              return {
                                single: vi.fn().mockResolvedValueOnce(mockRecipeFetchResult),
                              };
                            }
                            return { single: vi.fn() };
                          }),
                        };
                      }
                      return { eq: vi.fn() };
                    }),
                  };
                }
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        const result = await recipeService.getRecipeById(testRecipeId, testUserId);

        expect(result.ingredients).toEqual([
          { id: "550e8400-e29b-41d4-a716-446655440014", content: "Ingredient 1", position: 1 },
          { id: "550e8400-e29b-41d4-a716-446655440015", content: "Ingredient 2", position: 2 },
          { id: "550e8400-e29b-41d4-a716-446655440013", content: "Ingredient 3", position: 3 },
        ]);

        expect(result.steps).toEqual([
          { id: "550e8400-e29b-41d4-a716-446655440017", content: "Step 1", position: 1 },
          { id: "550e8400-e29b-41d4-a716-446655440016", content: "Step 2", position: 2 },
          { id: "550e8400-e29b-41d4-a716-446655440018", content: "Step 3", position: 3 },
        ]);
      });
    });

    describe("Authorization Error Scenarios", () => {
      it("should throw NotFoundError when recipe does not exist (PGRST116)", async () => {
        const testRecipeId = "non-existent-id";
        const testUserId = "user-123";

        const mockExistenceCheckResult = {
          data: null,
          error: { code: "PGRST116", message: "No rows returned" },
        };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              select: vi.fn((selectArg: string) => {
                if (selectArg === "id, user_id") {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          single: vi.fn().mockResolvedValueOnce(mockExistenceCheckResult),
                        };
                      }
                      return { single: vi.fn() };
                    }),
                  };
                }
                return { eq: vi.fn() };
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        await expect(recipeService.getRecipeById(testRecipeId, testUserId)).rejects.toThrow(NotFoundError);

        await expect(recipeService.getRecipeById(testRecipeId, testUserId)).rejects.toThrow(
          `Recipe with ID '${testRecipeId}' not found`
        );
      });

      it("should throw NotFoundError when recipe query returns null data", async () => {
        const testRecipeId = "non-existent-id";
        const testUserId = "user-123";

        const mockExistenceCheckResult = { data: null, error: null };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              select: vi.fn((selectArg: string) => {
                if (selectArg === "id, user_id") {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          single: vi.fn().mockResolvedValueOnce(mockExistenceCheckResult),
                        };
                      }
                      return { single: vi.fn() };
                    }),
                  };
                }
                return { eq: vi.fn() };
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        await expect(recipeService.getRecipeById(testRecipeId, testUserId)).rejects.toThrow(NotFoundError);

        await expect(recipeService.getRecipeById(testRecipeId, testUserId)).rejects.toThrow(
          `Recipe with ID '${testRecipeId}' not found`
        );
      });

      it("should throw ForbiddenError when user does not own recipe", async () => {
        const testRecipeId = "recipe-123";
        const ownerUserId = "owner-user-123";
        const accessingUserId = "different-user-456";

        const mockExistenceCheckResult = { data: { id: testRecipeId, user_id: ownerUserId }, error: null };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              select: vi.fn((selectArg: string) => {
                if (selectArg === "id, user_id") {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          single: vi.fn().mockResolvedValueOnce(mockExistenceCheckResult),
                        };
                      }
                      return { single: vi.fn() };
                    }),
                  };
                }
                return { eq: vi.fn() };
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        await expect(recipeService.getRecipeById(testRecipeId, accessingUserId)).rejects.toThrow(ForbiddenError);

        await expect(recipeService.getRecipeById(testRecipeId, accessingUserId)).rejects.toThrow(
          "Access denied. You don't have permission to view this recipe"
        );
      });
    });

    describe("Database Error Scenarios", () => {
      it("should fail when checking recipe existence encounters database error", async () => {
        const testRecipeId = "recipe-123";
        const testUserId = "user-123";

        const mockExistenceCheckResult = {
          data: null,
          error: { message: "Connection timeout" },
        };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              select: vi.fn((selectArg: string) => {
                if (selectArg === "id, user_id") {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          single: vi.fn().mockResolvedValueOnce(mockExistenceCheckResult),
                        };
                      }
                      return { single: vi.fn() };
                    }),
                  };
                }
                return { eq: vi.fn() };
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        await expect(recipeService.getRecipeById(testRecipeId, testUserId)).rejects.toThrow(Error);

        await expect(recipeService.getRecipeById(testRecipeId, testUserId)).rejects.toThrow(
          "Failed to check recipe existence: Connection timeout"
        );
      });

      it("should fail when fetching full recipe details encounters database error", async () => {
        const testRecipeId = "recipe-123";
        const testUserId = "user-123";

        const mockExistenceCheckResult = { data: { id: testRecipeId, user_id: testUserId }, error: null };
        const mockRecipeFetchResult = {
          data: null,
          error: { message: "Query failed" },
        };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              select: vi.fn((selectArg: string) => {
                if (selectArg === "id, user_id") {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          single: vi.fn().mockResolvedValueOnce(mockExistenceCheckResult),
                        };
                      }
                      return { single: vi.fn() };
                    }),
                  };
                } else {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          eq: vi.fn((field2: string, value2: string) => {
                            if (field2 === "user_id" && value2 === testUserId) {
                              return {
                                single: vi.fn().mockResolvedValueOnce(mockRecipeFetchResult),
                              };
                            }
                            return { single: vi.fn() };
                          }),
                        };
                      }
                      return { eq: vi.fn() };
                    }),
                  };
                }
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        await expect(recipeService.getRecipeById(testRecipeId, testUserId)).rejects.toThrow(Error);

        await expect(recipeService.getRecipeById(testRecipeId, testUserId)).rejects.toThrow(
          "Failed to fetch recipe details: Query failed"
        );
      });

      it("should fail when fetched recipe data does not match schema", async () => {
        const testRecipeId = "recipe-123";
        const testUserId = "user-123";

        const mockRecipeData = {
          // Missing required 'id' field - invalid structure
          name: "Test Recipe",
          description: "Test Description",
          created_at: "2024-01-01T00:00:00Z",
          ingredients: [{ id: "ing-1", content: "Ingredient 1", position: 1 }],
          steps: [{ id: "step-1", content: "Step 1", position: 1 }],
          recipe_tags: [],
        };

        const mockExistenceCheckResult = { data: { id: testRecipeId, user_id: testUserId }, error: null };
        const mockRecipeFetchResult = { data: mockRecipeData, error: null };

        baseMocks.from.mockImplementation((tableName: string) => {
          if (tableName === "recipes") {
            return {
              select: vi.fn((selectArg: string) => {
                if (selectArg === "id, user_id") {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          single: vi.fn().mockResolvedValueOnce(mockExistenceCheckResult),
                        };
                      }
                      return { single: vi.fn() };
                    }),
                  };
                } else {
                  return {
                    eq: vi.fn((field: string, value: string) => {
                      if (field === "id" && value === testRecipeId) {
                        return {
                          eq: vi.fn((field2: string, value2: string) => {
                            if (field2 === "user_id" && value2 === testUserId) {
                              return {
                                single: vi.fn().mockResolvedValueOnce(mockRecipeFetchResult),
                              };
                            }
                            return { single: vi.fn() };
                          }),
                        };
                      }
                      return { eq: vi.fn() };
                    }),
                  };
                }
              }),
            };
          }
          return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
        });

        await expect(recipeService.getRecipeById(testRecipeId, testUserId)).rejects.toThrow(Error);

        await expect(recipeService.getRecipeById(testRecipeId, testUserId)).rejects.toThrow(
          "Invalid recipe data structure:"
        );
      });
    });
  });

  describe("getRecipesForUser()", () => {
    let mockRange: MockFn;
    let mockOrder: MockFn;
    let mockEqTag: MockFn;

    // Helper function to generate valid UUIDs for testing
    const generateUUID = (index: number) => `550e8400-e29b-41d4-a716-4466554400${index.toString().padStart(2, "0")}`;

    beforeEach(() => {
      mockRange = vi.fn();
      mockOrder = vi.fn(() => ({
        range: mockRange,
      }));
      mockEqTag = vi.fn(() => ({
        eq: mockEqTag,
        order: mockOrder,
      }));

      // Extend the base mock to handle getRecipesForUser query chaining
      baseMocks.from.mockImplementation((tableName: string) => {
        if (tableName === "recipes") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: mockEqTag,
                order: mockOrder,
              })),
              count: "exact",
            })),
            insert: baseMocks.insert,
            update: baseMocks.update,
            delete: vi.fn(),
          };
        }
        return {
          select: baseMocks.select,
          insert: baseMocks.insert,
          update: baseMocks.update,
          delete: vi.fn(),
        };
      });

      mockRange.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
    });

    describe("3.1 Success Scenarios", () => {
      it("3.1.1 should retrieve first page of recipes with default sort (created_at, desc)", async () => {
        const mockRecipes = [
          { id: generateUUID(1), name: "Recipe 1", description: "Desc 1", created_at: "2024-01-01", recipe_tags: null },
          { id: generateUUID(2), name: "Recipe 2", description: "Desc 2", created_at: "2024-01-02", recipe_tags: null },
          { id: generateUUID(3), name: "Recipe 3", description: "Desc 3", created_at: "2024-01-03", recipe_tags: null },
          { id: generateUUID(4), name: "Recipe 4", description: "Desc 4", created_at: "2024-01-04", recipe_tags: null },
          { id: generateUUID(5), name: "Recipe 5", description: "Desc 5", created_at: "2024-01-05", recipe_tags: null },
          { id: generateUUID(6), name: "Recipe 6", description: "Desc 6", created_at: "2024-01-06", recipe_tags: null },
          { id: generateUUID(7), name: "Recipe 7", description: "Desc 7", created_at: "2024-01-07", recipe_tags: null },
          { id: generateUUID(8), name: "Recipe 8", description: "Desc 8", created_at: "2024-01-08", recipe_tags: null },
        ];

        mockRange.mockResolvedValueOnce({
          data: mockRecipes,
          error: null,
          count: 8,
        });

        const options = {
          page: 1,
          pageSize: 10,
          sortBy: "created_at" as const,
          order: "desc" as const,
          tag: undefined,
        };
        const result = await recipeService.getRecipesForUser("user-123", options);

        expect(result.data).toHaveLength(8);
        expect(result.pagination).toEqual({
          page: 1,
          pageSize: 10,
          totalItems: 8,
          totalPages: 1,
        });
        expect(mockRange).toHaveBeenCalledWith(0, 9);
      });

      it("3.1.2 should retrieve recipes filtered by specific tag", async () => {
        const mockRecipes = [
          {
            id: generateUUID(1),
            name: "Recipe 1",
            description: "Desc 1",
            created_at: "2024-01-01",
            recipe_tags: [{ tags: { name: "Vegetarian" } }],
          },
          {
            id: generateUUID(2),
            name: "Recipe 2",
            description: "Desc 2",
            created_at: "2024-01-02",
            recipe_tags: [{ tags: { name: "Vegetarian" } }],
          },
          {
            id: generateUUID(3),
            name: "Recipe 3",
            description: "Desc 3",
            created_at: "2024-01-03",
            recipe_tags: [{ tags: { name: "Vegetarian" } }],
          },
        ];

        mockRange.mockResolvedValueOnce({
          data: mockRecipes,
          error: null,
          count: 3,
        });

        const options = {
          page: 1,
          pageSize: 10,
          sortBy: "created_at" as const,
          order: "desc" as const,
          tag: "Vegetarian",
        };
        const result = await recipeService.getRecipesForUser("user-123", options);

        expect(result.data).toHaveLength(3);
        expect(result.data[0].tags).toContain("Vegetarian");
        expect(result.data[1].tags).toContain("Vegetarian");
        expect(result.data[2].tags).toContain("Vegetarian");
        expect(result.pagination).toEqual({
          page: 1,
          pageSize: 10,
          totalItems: 3,
          totalPages: 1,
        });
      });

      it("3.1.3 should retrieve recipes sorted by name in ascending order", async () => {
        const mockRecipes = [
          {
            id: generateUUID(1),
            name: "Apple Pie",
            description: "Desc 1",
            created_at: "2024-01-01",
            recipe_tags: null,
          },
          { id: generateUUID(2), name: "Bread", description: "Desc 2", created_at: "2024-01-02", recipe_tags: null },
          { id: generateUUID(3), name: "Cake", description: "Desc 3", created_at: "2024-01-03", recipe_tags: null },
        ];

        mockRange.mockResolvedValueOnce({
          data: mockRecipes,
          error: null,
          count: 3,
        });

        const options = { page: 1, pageSize: 10, sortBy: "name" as const, order: "asc" as const };
        const result = await recipeService.getRecipesForUser("user-123", options);

        expect(result.data[0].name).toBe("Apple Pie");
        expect(result.data[1].name).toBe("Bread");
        expect(result.data[2].name).toBe("Cake");
        expect(mockOrder).toHaveBeenCalledWith("name", { ascending: true });
      });

      it("3.1.4 should retrieve recipes sorted by created_at in ascending order", async () => {
        const mockRecipes = [
          {
            id: generateUUID(1),
            name: "Old Recipe",
            description: "Desc 1",
            created_at: "2024-01-01",
            recipe_tags: null,
          },
          {
            id: generateUUID(2),
            name: "New Recipe",
            description: "Desc 2",
            created_at: "2024-01-02",
            recipe_tags: null,
          },
        ];

        mockRange.mockResolvedValueOnce({
          data: mockRecipes,
          error: null,
          count: 2,
        });

        const options = { page: 1, pageSize: 10, sortBy: "created_at" as const, order: "asc" as const };
        const result = await recipeService.getRecipesForUser("user-123", options);

        expect(result.data[0].name).toBe("Old Recipe");
        expect(result.data[1].name).toBe("New Recipe");
        expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
      });

      it("3.1.5 should retrieve different pages of recipes", async () => {
        const mockRecipes = Array.from({ length: 10 }, (_, i) => ({
          id: generateUUID(i + 11),
          name: `Recipe ${i + 11}`,
          description: `Desc ${i + 11}`,
          created_at: `2024-01-${String(i + 11).padStart(2, "0")}`,
          recipe_tags: null,
        }));

        mockRange.mockResolvedValueOnce({
          data: mockRecipes,
          error: null,
          count: 25,
        });

        const options = { page: 2, pageSize: 10, sortBy: "created_at" as const, order: "desc" as const };
        const result = await recipeService.getRecipesForUser("user-123", options);

        expect(mockRange).toHaveBeenCalledWith(10, 19);
        expect(result.data).toHaveLength(10);
        expect(result.pagination).toEqual({
          page: 2,
          pageSize: 10,
          totalItems: 25,
          totalPages: 3,
        });
      });

      it("3.1.6 should retrieve last page with fewer items than pageSize", async () => {
        const mockRecipes = Array.from({ length: 5 }, (_, i) => ({
          id: generateUUID(i + 21),
          name: `Recipe ${i + 21}`,
          description: `Desc ${i + 21}`,
          created_at: `2024-01-${String(i + 21).padStart(2, "0")}`,
          recipe_tags: null,
        }));

        mockRange.mockResolvedValueOnce({
          data: mockRecipes,
          error: null,
          count: 25,
        });

        const options = { page: 3, pageSize: 10, sortBy: "created_at" as const, order: "desc" as const };
        const result = await recipeService.getRecipesForUser("user-123", options);

        expect(mockRange).toHaveBeenCalledWith(20, 29);
        expect(result.data).toHaveLength(5);
        expect(result.pagination).toEqual({
          page: 3,
          pageSize: 10,
          totalItems: 25,
          totalPages: 3,
        });
      });

      it("3.1.7 should return empty list when no recipes exist", async () => {
        mockRange.mockResolvedValueOnce({
          data: [],
          error: null,
          count: 0,
        });

        const options = { page: 1, pageSize: 10, sortBy: "created_at" as const, order: "desc" as const };
        const result = await recipeService.getRecipesForUser("user-123", options);

        expect(result.data).toEqual([]);
        expect(result.pagination).toEqual({
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
        });
      });

      it("3.1.8 should return empty list when tag filter matches no recipes", async () => {
        mockRange.mockResolvedValueOnce({
          data: [],
          error: null,
          count: 0,
        });

        const options = {
          page: 1,
          pageSize: 10,
          sortBy: "created_at" as const,
          order: "desc" as const,
          tag: "NonexistentTag",
        };
        const result = await recipeService.getRecipesForUser("user-123", options);

        expect(result.data).toEqual([]);
        expect(result.pagination).toEqual({
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
        });
      });

      it("3.1.9 should retrieve all recipes in single page with pageSize > total count", async () => {
        const mockRecipes = Array.from({ length: 5 }, (_, i) => ({
          id: generateUUID(i + 1),
          name: `Recipe ${i + 1}`,
          description: `Desc ${i + 1}`,
          created_at: `2024-01-${String(i + 1).padStart(2, "0")}`,
          recipe_tags: null,
        }));

        mockRange.mockResolvedValueOnce({
          data: mockRecipes,
          error: null,
          count: 5,
        });

        const options = { page: 1, pageSize: 100, sortBy: "created_at" as const, order: "desc" as const };
        const result = await recipeService.getRecipesForUser("user-123", options);

        expect(result.data).toHaveLength(5);
        expect(result.pagination).toEqual({
          page: 1,
          pageSize: 100,
          totalItems: 5,
          totalPages: 1,
        });
      });

      it("3.1.10 should return recipes with correctly mapped tags", async () => {
        const mockRecipes = [
          {
            id: generateUUID(1),
            name: "Recipe 1",
            description: "Desc 1",
            created_at: "2024-01-01",
            recipe_tags: [{ tags: { name: "Vegetarian" } }, { tags: { name: "Quick" } }],
          },
          {
            id: generateUUID(2),
            name: "Recipe 2",
            description: "Desc 2",
            created_at: "2024-01-02",
            recipe_tags: [{ tags: { name: "Pasta" } }],
          },
          {
            id: generateUUID(3),
            name: "Recipe 3",
            description: "Desc 3",
            created_at: "2024-01-03",
            recipe_tags: null,
          },
        ];

        mockRange.mockResolvedValueOnce({
          data: mockRecipes,
          error: null,
          count: 3,
        });

        const options = { page: 1, pageSize: 10, sortBy: "created_at" as const, order: "desc" as const };
        const result = await recipeService.getRecipesForUser("user-123", options);

        expect(result.data[0].tags).toEqual(["Vegetarian", "Quick"]);
        expect(result.data[1].tags).toEqual(["Pasta"]);
        expect(result.data[2].tags).toEqual([]);
      });
    });

    describe("3.2 Error Scenarios", () => {
      it("3.2.1 should fail when database query encounters error", async () => {
        mockRange.mockResolvedValueOnce({
          data: null,
          error: { message: "Database connection lost" },
          count: null,
        });

        const options = { page: 1, pageSize: 10, sortBy: "created_at" as const, order: "desc" as const };
        await expect(recipeService.getRecipesForUser("user-123", options)).rejects.toThrow(
          "Failed to get recipes for user: Failed to fetch recipes: Database connection lost"
        );
      });

      it("3.2.2 should fail when recipe data does not match schema", async () => {
        const invalidRecipes = [
          { name: "Recipe 1", description: "Desc 1", created_at: "2024-01-01", recipe_tags: null }, // missing id
        ];

        mockRange.mockResolvedValueOnce({
          data: invalidRecipes,
          error: null,
          count: 1,
        });

        const options = { page: 1, pageSize: 10, sortBy: "created_at" as const, order: "desc" as const };
        await expect(recipeService.getRecipesForUser("user-123", options)).rejects.toThrow(
          "Failed to get recipes for user: Invalid recipe data structure:"
        );
      });

      it("3.2.3 should handle null count from Supabase gracefully", async () => {
        const mockRecipes = [
          { id: generateUUID(1), name: "Recipe 1", description: "Desc 1", created_at: "2024-01-01", recipe_tags: null },
        ];

        mockRange.mockResolvedValueOnce({
          data: mockRecipes,
          error: null,
          count: null,
        });

        const options = { page: 1, pageSize: 10, sortBy: "created_at" as const, order: "desc" as const };
        const result = await recipeService.getRecipesForUser("user-123", options);

        expect(result.data).toHaveLength(1);
        expect(result.pagination.totalItems).toBe(0);
        expect(result.pagination.totalPages).toBe(0);
      });
    });
  });

  describe("updateRecipe", () => {
    const testUserId = "550e8400-e29b-41d4-a716-446655440005";
    const testRecipeId = "550e8400-e29b-41d4-a716-446655440000";

    describe("Success Scenarios", () => {
      it("should successfully update recipe name, description, ingredients, steps, and tags", async () => {
        const updateRecipeData = {
          name: "Updated Recipe Name",
          description: "Updated description",
          ingredients: [
            { id: "ing-1", content: "Updated ingredient 1", position: 1 },
            { content: "New ingredient 2", position: 2 },
          ],
          steps: [
            { id: "step-1", content: "Updated step 1", position: 1 },
            { content: "New step 2", position: 2 },
          ],
          tags: ["Updated", "New"],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    not: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({ error: null }),
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      eq: vi.fn().mockResolvedValue({ error: null }),
                    }),
                  }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    not: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({ error: null }),
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      eq: vi.fn().mockResolvedValue({ error: null }),
                    }),
                  }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
              };
            }

            if (tableName === "tags") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi
                        .fn()
                        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } }) // Updated tag
                        .mockResolvedValueOnce({ data: { id: "new-tag-id" }, error: null }), // New tag exists
                    }),
                  }),
                }),
                insert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: "updated-tag-id" }, error: null }),
                  }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock final getRecipeById
        const mockGetRecipeById = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "getRecipeById")
          .mockResolvedValue({
            id: testRecipeId,
            name: "Updated Recipe Name",
            description: "Updated description",
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [
              { id: "ing-1", content: "Updated ingredient 1", position: 1 },
              { id: "new-ing-2", content: "New ingredient 2", position: 2 },
            ],
            steps: [
              { id: "step-1", content: "Updated step 1", position: 1 },
              { id: "new-step-2", content: "New step 2", position: 2 },
            ],
            tags: ["Updated", "New"],
          });

        const result = await localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId);

        expect(result).toEqual({
          id: testRecipeId,
          name: "Updated Recipe Name",
          description: "Updated description",
          created_at: "2024-01-15T10:30:00Z",
          ingredients: [
            { id: "ing-1", content: "Updated ingredient 1", position: 1 },
            { id: "new-ing-2", content: "New ingredient 2", position: 2 },
          ],
          steps: [
            { id: "step-1", content: "Updated step 1", position: 1 },
            { id: "new-step-2", content: "New step 2", position: 2 },
          ],
          tags: ["Updated", "New"],
        });

        expect(mockGetRecipeById).toHaveBeenCalledWith(testRecipeId, testUserId);
      });

      it("should update only recipe metadata without changing ingredients/steps/tags", async () => {
        const updateRecipeData = {
          name: "New Name",
          description: "New description",
          ingredients: [],
          steps: [],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock final getRecipeById
        const mockGetRecipeById = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "getRecipeById")
          .mockResolvedValue({
            id: testRecipeId,
            name: "New Name",
            description: "New description",
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [
              { id: "ing-1", content: "Existing ingredient 1", position: 1 },
              { id: "ing-2", content: "Existing ingredient 2", position: 2 },
            ],
            steps: [
              { id: "step-1", content: "Existing step 1", position: 1 },
              { id: "step-2", content: "Existing step 2", position: 2 },
            ],
            tags: ["Existing", "Tags"],
          });

        const result = await localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId);

        expect(result).toEqual({
          id: testRecipeId,
          name: "New Name",
          description: "New description",
          created_at: "2024-01-15T10:30:00Z",
          ingredients: [
            { id: "ing-1", content: "Existing ingredient 1", position: 1 },
            { id: "ing-2", content: "Existing ingredient 2", position: 2 },
          ],
          steps: [
            { id: "step-1", content: "Existing step 1", position: 1 },
            { id: "step-2", content: "Existing step 2", position: 2 },
          ],
          tags: ["Existing", "Tags"],
        });

        expect(mockGetRecipeById).toHaveBeenCalledWith(testRecipeId, testUserId);
      });

      it("should add new ingredients to existing recipe", async () => {
        const updateRecipeData = {
          name: "Recipe Name",
          description: "Description",
          ingredients: [
            { id: "ing-1", content: "Existing ingredient 1", position: 1 },
            { id: "ing-2", content: "Existing ingredient 2", position: 2 },
            { content: "New ingredient 3", position: 3 },
            { content: "New ingredient 4", position: 4 },
          ],
          steps: [],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    not: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({ error: null }),
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      eq: vi.fn().mockResolvedValue({ error: null }),
                    }),
                  }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock final getRecipeById
        const mockGetRecipeById = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "getRecipeById")
          .mockResolvedValue({
            id: testRecipeId,
            name: "Recipe Name",
            description: "Description",
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [
              { id: "ing-1", content: "Existing ingredient 1", position: 1 },
              { id: "ing-2", content: "Existing ingredient 2", position: 2 },
              { id: "new-ing-3", content: "New ingredient 3", position: 3 },
              { id: "new-ing-4", content: "New ingredient 4", position: 4 },
            ],
            steps: [],
            tags: [],
          });

        const result = await localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId);

        expect(result.ingredients).toHaveLength(4);
      });

      it("should delete ingredients from recipe", async () => {
        const updateRecipeData = {
          name: "Recipe Name",
          description: "Description",
          ingredients: [
            { id: "ing-1", content: "Updated ingredient 1", position: 1 },
            { id: "ing-3", content: "Updated ingredient 3", position: 2 },
          ],
          steps: [],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    not: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({ error: null }),
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      eq: vi.fn().mockResolvedValue({ error: null }),
                    }),
                  }),
                }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock final getRecipeById
        const mockGetRecipeById = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "getRecipeById")
          .mockResolvedValue({
            id: testRecipeId,
            name: "Recipe Name",
            description: "Description",
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [
              { id: "ing-1", content: "Updated ingredient 1", position: 1 },
              { id: "ing-3", content: "Updated ingredient 3", position: 2 },
            ],
            steps: [],
            tags: [],
          });

        const result = await localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId);

        expect(result.ingredients).toHaveLength(2);
        expect(result.ingredients.find((i) => i.id === "ing-1")).toBeDefined();
        expect(result.ingredients.find((i) => i.id === "ing-3")).toBeDefined();
      });

      it("should remove all existing ingredients and add new ones", async () => {
        const updateRecipeData = {
          name: "Recipe Name",
          description: "Description",
          ingredients: [
            { content: "New ingredient 1", position: 1 },
            { content: "New ingredient 2", position: 2 },
            { content: "New ingredient 3", position: 3 },
          ],
          steps: [],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock final getRecipeById
        const mockGetRecipeById = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "getRecipeById")
          .mockResolvedValue({
            id: testRecipeId,
            name: "Recipe Name",
            description: "Description",
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [
              { id: "new-ing-1", content: "New ingredient 1", position: 1 },
              { id: "new-ing-2", content: "New ingredient 2", position: 2 },
              { id: "new-ing-3", content: "New ingredient 3", position: 3 },
            ],
            steps: [],
            tags: [],
          });

        const result = await localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId);

        expect(result.ingredients).toHaveLength(3);
        expect(result.ingredients.every((i) => i.content.startsWith("New ingredient"))).toBe(true);
      });

      it("should remove all ingredients from recipe", async () => {
        const updateRecipeData = {
          name: "Recipe Name",
          description: "Description",
          ingredients: [],
          steps: [],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock final getRecipeById
        const mockGetRecipeById = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "getRecipeById")
          .mockResolvedValue({
            id: testRecipeId,
            name: "Recipe Name",
            description: "Description",
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [],
            steps: [],
            tags: [],
          });

        const result = await localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId);

        expect(result.ingredients).toHaveLength(0);
      });

      it("should update tags: add new, keep some, remove some", async () => {
        const updateRecipeData = {
          name: "Recipe Name",
          description: "Description",
          ingredients: [],
          steps: [],
          tags: ["Vegetarian", "Easy", "New"],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
              };
            }

            if (tableName === "tags") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi
                        .fn()
                        .mockResolvedValueOnce({ data: { id: "vegetarian-id" }, error: null }) // Vegetarian exists
                        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } }) // Easy doesn't exist
                        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } }), // New doesn't exist
                    }),
                  }),
                }),
                insert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: "easy-id" }, error: null }),
                  }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock final getRecipeById
        const mockGetRecipeById = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "getRecipeById")
          .mockResolvedValue({
            id: testRecipeId,
            name: "Recipe Name",
            description: "Description",
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [],
            steps: [],
            tags: ["Vegetarian", "Easy", "New"],
          });

        const result = await localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId);

        expect(result.tags).toEqual(["Vegetarian", "Easy", "New"]);
      });

      it("should remove all tags from recipe", async () => {
        const updateRecipeData = {
          name: "Recipe Name",
          description: "Description",
          ingredients: [],
          steps: [],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock final getRecipeById
        const mockGetRecipeById = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "getRecipeById")
          .mockResolvedValue({
            id: testRecipeId,
            name: "Recipe Name",
            description: "Description",
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [],
            steps: [],
            tags: [],
          });

        const result = await localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId);

        expect(result.tags).toHaveLength(0);
      });

      it("should link recipe to tags that already exist for user", async () => {
        const updateRecipeData = {
          name: "Recipe Name",
          description: "Description",
          ingredients: [],
          steps: [],
          tags: ["Vegetarian", "Quick"],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
                insert: vi.fn().mockResolvedValue({ error: null }),
              };
            }

            if (tableName === "tags") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi
                        .fn()
                        .mockResolvedValueOnce({ data: { id: "vegetarian-id" }, error: null }) // Vegetarian exists
                        .mockResolvedValueOnce({ data: { id: "quick-id" }, error: null }), // Quick exists
                    }),
                  }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock final getRecipeById
        const mockGetRecipeById = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "getRecipeById")
          .mockResolvedValue({
            id: testRecipeId,
            name: "Recipe Name",
            description: "Description",
            created_at: "2024-01-15T10:30:00Z",
            ingredients: [],
            steps: [],
            tags: ["Vegetarian", "Quick"],
          });

        const result = await localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId);

        expect(result.tags).toEqual(["Vegetarian", "Quick"]);
      });
    });

    describe("Error Scenarios - Authorization", () => {
      it("should fail when recipe does not exist", async () => {
        const updateRecipeData = {
          name: "Updated Name",
          description: "Updated description",
          ingredients: [],
          steps: [],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: "PGRST116" },
                    }),
                  }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        await expect(localRecipeService.updateRecipe("non-existent", updateRecipeData, testUserId)).rejects.toThrow(
          NotFoundError
        );

        await expect(localRecipeService.updateRecipe("non-existent", updateRecipeData, testUserId)).rejects.toThrow(
          "Recipe with ID 'non-existent' not found"
        );
      });

      it("should fail when user does not own recipe", async () => {
        const updateRecipeData = {
          name: "Updated Name",
          description: "Updated description",
          ingredients: [],
          steps: [],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: "user-456",
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        await expect(localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId)).rejects.toThrow(
          ForbiddenError
        );

        await expect(localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId)).rejects.toThrow(
          "Access denied. You don't have permission to update this recipe"
        );
      });
    });

    describe("Error Scenarios - Update Operations", () => {
      it("should rollback when main recipe update fails", async () => {
        const updateRecipeData = {
          name: "Updated Name",
          description: "Updated description",
          ingredients: [],
          steps: [],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: { message: "Column name cannot be null" } }),
                  }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock rollback
        const mockRollbackRecipeUpdate = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "rollbackRecipeUpdate")
          .mockResolvedValue(undefined);

        await expect(localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId)).rejects.toThrow(
          "Failed to update recipe: Column name cannot be null"
        );

        expect(mockRollbackRecipeUpdate).toHaveBeenCalledWith(testRecipeId, {
          id: testRecipeId,
          user_id: testUserId,
          name: "Original Name",
          description: "Original desc",
        });
      });

      it("should rollback all changes when ingredient update fails", async () => {
        const updateRecipeData = {
          name: "Updated Name",
          description: "Updated description",
          ingredients: [{ id: "ing-1", content: "Updated ingredient", position: 1 }],
          steps: [],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    not: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({ error: null }),
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      eq: vi.fn().mockResolvedValue({ error: { message: "Update failed" } }),
                    }),
                  }),
                }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipes") {
              return {
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock rollback
        const mockRollbackRecipeUpdate = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "rollbackRecipeUpdate")
          .mockResolvedValue(undefined);

        await expect(localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId)).rejects.toThrow(); // Expect any error to be thrown

        expect(mockRollbackRecipeUpdate).toHaveBeenCalledWith(testRecipeId, {
          id: testRecipeId,
          user_id: testUserId,
          name: "Original Name",
          description: "Original desc",
        });
      });

      it("should rollback when deleting old ingredients fails", async () => {
        const updateRecipeData = {
          name: "Updated Name",
          description: "Updated description",
          ingredients: [{ id: "ing-1", content: "Updated ingredient", position: 1 }],
          steps: [],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    not: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({ error: { message: "Foreign key constraint" } }),
                    }),
                  }),
                }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipes") {
              return {
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock rollback
        const mockRollbackRecipeUpdate = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "rollbackRecipeUpdate")
          .mockResolvedValue(undefined);

        await expect(localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId)).rejects.toThrow(); // Expect any error to be thrown

        expect(mockRollbackRecipeUpdate).toHaveBeenCalledWith(testRecipeId, {
          id: testRecipeId,
          user_id: testUserId,
          name: "Original Name",
          description: "Original desc",
        });
      });

      it("should rollback when step operations fail", async () => {
        const updateRecipeData = {
          name: "Updated Name",
          description: "Updated description",
          ingredients: [],
          steps: [{ content: "New step", position: 1 }],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    not: vi.fn().mockReturnValue({
                      in: vi.fn().mockResolvedValue({ error: null }),
                    }),
                  }),
                }),
                insert: vi.fn().mockResolvedValue({ error: { message: "Insert failed" } }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock rollback
        const mockRollbackRecipeUpdate = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "rollbackRecipeUpdate")
          .mockResolvedValue(undefined);

        await expect(localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId)).rejects.toThrow(
          "Failed to insert new steps: Insert failed"
        );

        expect(mockRollbackRecipeUpdate).toHaveBeenCalledWith(testRecipeId, {
          id: testRecipeId,
          user_id: testUserId,
          name: "Original Name",
          description: "Original desc",
        });
      });

      it("should rollback when creating new tag during update fails", async () => {
        const updateRecipeData = {
          name: "Updated Name",
          description: "Updated description",
          ingredients: [],
          steps: [],
          tags: ["New Tag"],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "tags") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
                    }),
                  }),
                }),
                insert: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: "Database error" } }),
                  }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock rollback
        const mockRollbackRecipeUpdate = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "rollbackRecipeUpdate")
          .mockResolvedValue(undefined);

        await expect(localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId)).rejects.toThrow(
          "Failed to create tag 'New Tag': Database error"
        );

        expect(mockRollbackRecipeUpdate).toHaveBeenCalledWith(testRecipeId, {
          id: testRecipeId,
          user_id: testUserId,
          name: "Original Name",
          description: "Original desc",
        });
      });

      it("should rollback when recipe_tags insertion fails", async () => {
        const updateRecipeData = {
          name: "Updated Name",
          description: "Updated description",
          ingredients: [],
          steps: [],
          tags: ["Existing Tag"],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
                insert: vi.fn().mockResolvedValue({ error: { message: "Insert failed" } }),
              };
            }

            if (tableName === "tags") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: { id: "existing-tag-id" }, error: null }),
                    }),
                  }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock rollback
        const mockRollbackRecipeUpdate = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "rollbackRecipeUpdate")
          .mockResolvedValue(undefined);

        await expect(localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId)).rejects.toThrow(
          "Failed to link tags to recipe: Insert failed"
        );

        expect(mockRollbackRecipeUpdate).toHaveBeenCalledWith(testRecipeId, {
          id: testRecipeId,
          user_id: testUserId,
          name: "Original Name",
          description: "Original desc",
        });
      });

      it("should rollback when fetching updated recipe fails", async () => {
        const updateRecipeData = {
          name: "Updated Name",
          description: "Updated description",
          ingredients: [],
          steps: [],
          tags: [],
        };

        // Create a custom mock implementation for this test
        const mockSupabaseClient = {
          from: vi.fn((tableName: string) => {
            if (tableName === "recipes") {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: testRecipeId,
                        user_id: testUserId,
                        name: "Original Name",
                        description: "Original desc",
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }

            if (tableName === "ingredients") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "steps") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            if (tableName === "recipe_tags") {
              return {
                delete: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }

            return { select: baseMocks.select, insert: baseMocks.insert, update: baseMocks.update, delete: vi.fn() };
          }),
        } as unknown as SupabaseClientType;

        const localRecipeService = new RecipeService(mockSupabaseClient);

        // Mock getRecipeById to fail
        const mockGetRecipeById = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "getRecipeById")
          .mockRejectedValue(new Error("Fetch failed"));

        // Mock rollback
        const mockRollbackRecipeUpdate = vi
          .spyOn(localRecipeService as RecipeServiceInternal, "rollbackRecipeUpdate")
          .mockResolvedValue(undefined);

        await expect(localRecipeService.updateRecipe(testRecipeId, updateRecipeData, testUserId)).rejects.toThrow(
          "Fetch failed"
        );

        expect(mockRollbackRecipeUpdate).toHaveBeenCalledWith(testRecipeId, {
          id: testRecipeId,
          user_id: testUserId,
          name: "Original Name",
          description: "Original desc",
        });
      });
    });
  });

  describe("deleteRecipe", () => {
    describe("Success Scenarios", () => {
      it("Successfully delete recipe when user is authorized", async () => {
        // Arrange
        const recipeId = "recipe-123";
        const userId = "user-123";
        const mockRecipeExists = { id: recipeId, user_id: userId };

        // Create mock delete chain for this test
        const mockDeleteResult = { error: null };
        const mockDeleteEq2 = vi.fn(() => mockDeleteResult);
        const mockDeleteEq1 = vi.fn(() => ({ eq: mockDeleteEq2 }));

        baseMocks.from.mockImplementation((tableName: string) => ({
          select: baseMocks.select,
          insert: baseMocks.insert,
          update: baseMocks.update,
          delete: vi.fn(() => ({ eq: mockDeleteEq1 })),
        }));

        baseMocks.single.mockResolvedValueOnce({ data: mockRecipeExists, error: null });

        // Act & Assert
        await expect(recipeService.deleteRecipe(recipeId, userId)).resolves.toBeUndefined();
      });
    });

    describe("Authorization Error Scenarios", () => {
      it("Throw NotFoundError when recipe does not exist", async () => {
        // Arrange
        const recipeId = "non-existent-id";

        // Override from mock for this test
        baseMocks.from.mockImplementation((tableName: string) => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST116", message: "No rows found" },
              }),
            })),
          })),
          insert: baseMocks.insert,
          update: baseMocks.update,
          delete: vi.fn(() => ({ eq: baseMocks.eq })),
        }));

        // Act & Assert
        await expect(recipeService.deleteRecipe(recipeId, "user-123")).rejects.toThrow(NotFoundError);

        await expect(recipeService.deleteRecipe(recipeId, "user-123")).rejects.toThrow(
          `Recipe with ID '${recipeId}' not found`
        );
      });

      it("Throw NotFoundError when existence check returns null", async () => {
        // Arrange
        const recipeId = "recipe-123";

        // Override from mock for this test
        baseMocks.from.mockImplementation((tableName: string) => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
          insert: baseMocks.insert,
          update: baseMocks.update,
          delete: vi.fn(() => ({ eq: baseMocks.eq })),
        }));

        // Act & Assert
        await expect(recipeService.deleteRecipe(recipeId, "user-123")).rejects.toThrow(NotFoundError);

        await expect(recipeService.deleteRecipe(recipeId, "user-123")).rejects.toThrow(
          `Recipe with ID '${recipeId}' not found`
        );
      });

      it("Throw ForbiddenError when user does not own recipe", async () => {
        // Arrange
        const recipeId = "recipe-123";
        const ownerId = "owner-123";
        const requestingUserId = "different-user-456";
        const mockRecipeExists = { id: recipeId, user_id: ownerId };

        // Override from mock for this test
        baseMocks.from.mockImplementation((tableName: string) => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockRecipeExists, error: null }),
            })),
          })),
          insert: baseMocks.insert,
          update: baseMocks.update,
          delete: vi.fn(() => ({ eq: baseMocks.eq })),
        }));

        // Act & Assert
        await expect(recipeService.deleteRecipe(recipeId, requestingUserId)).rejects.toThrow(ForbiddenError);

        await expect(recipeService.deleteRecipe(recipeId, requestingUserId)).rejects.toThrow(
          "Access denied. You don't have permission to delete this recipe"
        );
      });
    });

    describe("Database Error Scenarios", () => {
      it("Fail when checking existence encounters database error", async () => {
        // Arrange
        const recipeId = "recipe-123";
        const errorMessage = "Connection timeout";

        baseMocks.single.mockResolvedValueOnce({
          data: null,
          error: { code: "OTHER_ERROR", message: errorMessage },
        });

        // Act & Assert
        await expect(recipeService.deleteRecipe(recipeId, "user-123")).rejects.toThrow(
          `Failed to check recipe existence: ${errorMessage}`
        );
      });

      it("Fail when delete operation encounters database error", async () => {
        // Arrange
        const recipeId = "recipe-123";
        const userId = "user-123";
        const mockRecipeExists = { id: recipeId, user_id: userId };
        const errorMessage = "Database locked";

        // Create mock delete chain that returns error
        const mockDeleteResult = { error: { message: errorMessage } };
        const mockDeleteEq2 = vi.fn(() => mockDeleteResult);
        const mockDeleteEq1 = vi.fn(() => ({ eq: mockDeleteEq2 }));

        baseMocks.from.mockImplementation((tableName: string) => ({
          select: baseMocks.select,
          insert: baseMocks.insert,
          update: baseMocks.update,
          delete: vi.fn(() => ({ eq: mockDeleteEq1 })),
        }));

        baseMocks.single.mockResolvedValueOnce({ data: mockRecipeExists, error: null });

        // Act & Assert
        await expect(recipeService.deleteRecipe(recipeId, userId)).rejects.toThrow(
          `Failed to delete recipe: ${errorMessage}`
        );
      });
    });
  });
});
