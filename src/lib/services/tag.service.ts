import type { SupabaseClientType } from "../../db/supabase.client";
import type { Tag, TagDto } from "../../types";

/**
 * Service class for handling tag-related operations.
 * Provides methods to interact with the tags table in Supabase.
 */
export class TagService {
  constructor(private supabase: SupabaseClientType) {}

  /**
   * Retrieves all unique tags belonging to the specified user.
   * Optionally filters tags by name using case-insensitive search.
   * 
   * @param userId - The ID of the user whose tags to retrieve
   * @param query - Optional search query to filter tags by name (case-insensitive)
   * @returns Promise<TagDto[]> - Array of tag DTOs
   * @throws Error if the database query fails
   */
  async getTags(userId: string, query?: string): Promise<TagDto[]> {
    try {
      // Build the base query
      let queryBuilder = this.supabase
        .from("tags")
        .select("id, name")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      // Add optional name filtering if query is provided
      if (query && query.trim()) {
        queryBuilder = queryBuilder.ilike("name", `${query.trim()}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw new Error(`Failed to fetch tags: ${error.message}`);
      }

      // Transform the data to TagDto format
      return (data || []).map((tag): TagDto => ({
        id: tag.id,
        name: tag.name,
      }));
    } catch (error) {
      // Re-throw with more context if it's not already our custom error
      if (error instanceof Error && error.message.startsWith("Failed to fetch tags:")) {
        throw error;
      }
      throw new Error(`Unexpected error while fetching tags: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
