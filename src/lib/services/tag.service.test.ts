import { describe, it, expect, vi, beforeEach } from "vitest";
import { TagService } from "./tag.service";
import type { SupabaseClientType } from "../../db/supabase.client";

const createBaseMocks = () => {
  const mockIlike = vi.fn();
  const mockOrder = vi.fn();
  const mockEq = vi.fn();
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();

  return { from: mockFrom, select: mockSelect, eq: mockEq, order: mockOrder, ilike: mockIlike };
};

describe("TagService", () => {
  let service: TagService;
  let baseMocks: ReturnType<typeof createBaseMocks>;

  beforeEach(() => {
    vi.resetAllMocks();
    baseMocks = createBaseMocks();

    // Default fallback for all tables
    baseMocks.from.mockImplementation((tableName: string) => ({
      select: baseMocks.select,
    }));

    baseMocks.select.mockReturnValue({
      eq: baseMocks.eq,
    });

    baseMocks.eq.mockReturnValue({
      order: baseMocks.order,
    });

    // Default: order returns object that can be awaited or chained with ilike
    baseMocks.order.mockReturnValue({
      ilike: baseMocks.ilike,
      then: (resolve: any) => resolve({ data: [], error: null }),
    });

    baseMocks.ilike.mockReturnValue({
      then: (resolve: any) => resolve({ data: [], error: null }),
    });

    // Create service with mock client
    const mockClient = { from: baseMocks.from } as unknown as SupabaseClientType;
    service = new TagService(mockClient);
  });

  describe("getTags()", () => {
    describe("Success Scenarios - No Search Query", () => {
      it("should successfully retrieve all tags for a user when no search query is provided", async () => {
        const mockTags = [
          { id: "tag-1", name: "Vegetarian" },
          { id: "tag-2", name: "Vegan" },
          { id: "tag-3", name: "Gluten-Free" },
          { id: "tag-4", name: "Quick" },
          { id: "tag-5", name: "Dessert" },
        ];

        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        const result = await service.getTags("user-123");

        expect(result).toEqual(mockTags);
        expect(result).toHaveLength(5);
        expect(baseMocks.from).toHaveBeenCalledWith("tags");
        expect(baseMocks.select).toHaveBeenCalledWith("id, name");
        expect(baseMocks.eq).toHaveBeenCalledWith("user_id", "user-123");
        expect(baseMocks.order).toHaveBeenCalledWith("name", { ascending: true });
        expect(baseMocks.ilike).not.toHaveBeenCalled();
      });

      it("should successfully retrieve a single tag for a user", async () => {
        const mockTag = [{ id: "tag-1", name: "Italian" }];

        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: (resolve: any) => resolve({ data: mockTag, error: null }),
        });

        const result = await service.getTags("user-456");

        expect(result).toEqual(mockTag);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ id: "tag-1", name: "Italian" });
      });

      it("should return empty array when user has no tags", async () => {
        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: (resolve: any) => resolve({ data: null, error: null }),
        });

        const result = await service.getTags("user-789");

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it("should verify tags are returned in alphabetical order by name", async () => {
        const mockTags = [
          { id: "tag-1", name: "Zebra" },
          { id: "tag-2", name: "Apple" },
          { id: "tag-3", name: "Mango" },
        ];

        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        const result = await service.getTags("user-123");

        expect(result).toEqual(mockTags);
        expect(baseMocks.order).toHaveBeenCalledWith("name", { ascending: true });
      });
    });

    describe("Success Scenarios - With Search Query", () => {
      it("should successfully search tags and return filtered results", async () => {
        const mockTags = [
          { id: "tag-1", name: "Pasta Primavera" },
          { id: "tag-2", name: "Pasta Carbonara" },
        ];

        baseMocks.ilike.mockReturnValue({
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        const result = await service.getTags("user-123", "Pasta");

        expect(result).toEqual(mockTags);
        expect(result).toHaveLength(2);
        expect(baseMocks.ilike).toHaveBeenCalledWith("name", "Pasta%");
      });

      it("should verify search is case-insensitive", async () => {
        const mockTags = [{ id: "tag-1", name: "Pasta" }];

        baseMocks.ilike.mockReturnValue({
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        const result = await service.getTags("user-123", "pAsTa");

        expect(result).toEqual(mockTags);
        expect(baseMocks.ilike).toHaveBeenCalledWith("name", "pAsTa%");
      });

      it("should search returns only tags that start with the query (prefix match)", async () => {
        const mockTags = [
          { id: "tag-1", name: "Italian" },
          { id: "tag-2", name: "Italy" },
        ];

        baseMocks.ilike.mockReturnValue({
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        const result = await service.getTags("user-123", "Ital");

        expect(result).toEqual(mockTags);
        expect(result).toHaveLength(2);
        expect(baseMocks.ilike).toHaveBeenCalledWith("name", "Ital%");
      });

      it("should return empty array when search query matches no tags", async () => {
        baseMocks.ilike.mockReturnValue({
          then: (resolve: any) => resolve({ data: [], error: null }),
        });

        const result = await service.getTags("user-123", "NonExistentTag");

        expect(result).toEqual([]);
        expect(baseMocks.ilike).toHaveBeenCalledWith("name", "NonExistentTag%");
      });

      it("should handle special characters in search query", async () => {
        const mockTags = [{ id: "tag-1", name: "Spicy & Hot" }];

        baseMocks.ilike.mockReturnValue({
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        const result = await service.getTags("user-123", "Spicy & Hot");

        expect(result).toEqual(mockTags);
        expect(baseMocks.ilike).toHaveBeenCalledWith("name", "Spicy & Hot%");
      });
    });

    describe("Edge Cases - Query Handling", () => {
      it("should treat empty string query as no query", async () => {
        const mockTags = [
          { id: "tag-1", name: "Tag1" },
          { id: "tag-2", name: "Tag2" },
          { id: "tag-3", name: "Tag3" },
        ];

        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        const result = await service.getTags("user-123", "");

        expect(result).toEqual(mockTags);
        expect(baseMocks.ilike).not.toHaveBeenCalled();
      });

      it("should treat whitespace-only query as no query", async () => {
        const mockTags = [
          { id: "tag-1", name: "Tag1" },
          { id: "tag-2", name: "Tag2" },
        ];

        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        const result = await service.getTags("user-123", "   ");

        expect(result).toEqual(mockTags);
        expect(baseMocks.ilike).not.toHaveBeenCalled();
      });

      it("should trim leading and trailing whitespace from query", async () => {
        const mockTags = [{ id: "tag-1", name: "Vegetarian" }];

        baseMocks.ilike.mockReturnValue({
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        const result = await service.getTags("user-123", "  Vegetarian  ");

        expect(result).toEqual(mockTags);
        expect(baseMocks.ilike).toHaveBeenCalledWith("name", "Vegetarian%");
      });

      it("should successfully search with single character query", async () => {
        const mockTags = [
          { id: "tag-1", name: "Apple" },
          { id: "tag-2", name: "Asian" },
        ];

        baseMocks.ilike.mockReturnValue({
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        const result = await service.getTags("user-123", "A");

        expect(result).toEqual(mockTags);
        expect(baseMocks.ilike).toHaveBeenCalledWith("name", "A%");
      });

      it("should handle very long query strings", async () => {
        const longQuery = "A very long search query with many words that is unusually long";
        const mockTags = [{ id: "tag-1", name: longQuery }];

        baseMocks.ilike.mockReturnValue({
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        const result = await service.getTags("user-123", longQuery);

        expect(result).toEqual(mockTags);
        expect(baseMocks.ilike).toHaveBeenCalledWith("name", `${longQuery}%`);
      });
    });

    describe("Error Scenarios - Supabase Failures", () => {
      it("should handle Supabase database error gracefully", async () => {
        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: (resolve: any) => resolve({ data: null, error: { message: "Connection timeout" } }),
        });

        await expect(service.getTags("user-123")).rejects.toThrow("Failed to fetch tags: Connection timeout");
      });

      it("should handle permission/authorization errors", async () => {
        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: (resolve: any) => resolve({ data: null, error: { message: "row level security violation" } }),
        });

        await expect(service.getTags("unauthorized-user")).rejects.toThrow(
          "Failed to fetch tags: row level security violation"
        );
      });

      it("should handle case when query succeeds but returns null", async () => {
        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: (resolve: any) => resolve({ data: null, error: null }),
        });

        const result = await service.getTags("user-123");

        expect(result).toEqual([]);
      });

      it("should handle unexpected non-database errors", async () => {
        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: () => {
            throw new Error("Out of memory");
          },
        });

        await expect(service.getTags("user-123")).rejects.toThrow(
          "Unexpected error while fetching tags: Out of memory"
        );
      });

      it("should handle unexpected errors that are not Error instances", async () => {
        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: () => {
            throw { code: 500, message: "Server error" };
          },
        });

        await expect(service.getTags("user-123")).rejects.toThrow(
          "Unexpected error while fetching tags: Unknown error"
        );
      });
    });

    describe("Integration and Dependency Tests", () => {
      it("should verify correct Supabase query builder method chaining", async () => {
        const mockTags = [{ id: "tag-1", name: "Test" }];

        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        await service.getTags("user-123");

        expect(baseMocks.from).toHaveBeenCalledWith("tags");
        expect(baseMocks.select).toHaveBeenCalledWith("id, name");
        expect(baseMocks.eq).toHaveBeenCalledWith("user_id", "user-123");
        expect(baseMocks.order).toHaveBeenCalledWith("name", { ascending: true });
      });

      it("should verify ilike method is called correctly when query provided", async () => {
        const mockTags = [{ id: "tag-1", name: "Pasta" }];

        baseMocks.ilike.mockReturnValue({
          then: (resolve: any) => resolve({ data: mockTags, error: null }),
        });

        await service.getTags("user-123", "Pasta");

        expect(baseMocks.from).toHaveBeenCalledWith("tags");
        expect(baseMocks.select).toHaveBeenCalledWith("id, name");
        expect(baseMocks.eq).toHaveBeenCalledWith("user_id", "user-123");
        expect(baseMocks.order).toHaveBeenCalledWith("name", { ascending: true });
        expect(baseMocks.ilike).toHaveBeenCalledWith("name", "Pasta%");
      });

      it("should verify service correctly uses injected Supabase client", async () => {
        const customMockFrom = vi.fn();
        const customMockSelect = vi.fn();
        const customMockEq = vi.fn();
        const customMockOrder = vi.fn();

        customMockFrom.mockReturnValue({ select: customMockSelect });
        customMockSelect.mockReturnValue({ eq: customMockEq });
        customMockEq.mockReturnValue({ order: customMockOrder });
        customMockOrder.mockReturnValue({
          then: (resolve: any) => resolve({ data: [], error: null }),
        });

        const customClient = { from: customMockFrom } as unknown as SupabaseClientType;
        const customService = new TagService(customClient);

        await customService.getTags("user-123");

        expect(customMockFrom).toHaveBeenCalledWith("tags");
      });
    });

    describe("Data Transformation Tests", () => {
      it("should verify database records are correctly transformed to TagDto", async () => {
        const rawDbRecords = [
          { id: "tag-1", name: "Vegetarian", user_id: "user-123", created_at: "2024-10-01" },
          { id: "tag-2", name: "Vegan", user_id: "user-123", created_at: "2024-10-02" },
        ];

        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: (resolve: any) => resolve({ data: rawDbRecords, error: null }),
        });

        const result = await service.getTags("user-123");

        expect(result).toEqual([
          { id: "tag-1", name: "Vegetarian" },
          { id: "tag-2", name: "Vegan" },
        ]);
        expect(result[0]).not.toHaveProperty("user_id");
        expect(result[0]).not.toHaveProperty("created_at");
        expect(result[1]).not.toHaveProperty("user_id");
        expect(result[1]).not.toHaveProperty("created_at");
      });

      it("should verify tag order is preserved during transformation", async () => {
        const orderedTags = [
          { id: "tag-1", name: "Apple" },
          { id: "tag-2", name: "Mango" },
          { id: "tag-3", name: "Zebra" },
        ];

        baseMocks.order.mockReturnValue({
          ilike: baseMocks.ilike,
          then: (resolve: any) => resolve({ data: orderedTags, error: null }),
        });

        const result = await service.getTags("user-123");

        expect(result).toEqual(orderedTags);
        expect(result[0].name).toBe("Apple");
        expect(result[1].name).toBe("Mango");
        expect(result[2].name).toBe("Zebra");
      });
    });
  });
});
