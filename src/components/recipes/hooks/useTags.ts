import { useQuery } from "@tanstack/react-query";
import type { TagDto } from "@/types";
import { queryClient } from "@/store/query";

/**
 * Fetches tags from the API with optional search query.
 *
 * @param query - Optional search query to filter tags
 * @returns Promise containing array of tag DTOs
 * @throws Error if the fetch fails or response is not OK
 */
async function fetchTags(query?: string): Promise<TagDto[]> {
  const url = query ? `/api/tags?q=${encodeURIComponent(query)}` : "/api/tags";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch tags");
  }

  return response.json();
}

/**
 * Custom hook for fetching and managing tags data.
 * Uses React Query for caching, loading states, and error handling.
 *
 * @param query - Optional search query to filter tags
 * @returns Object containing tags data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * const { tags, isLoading, isError, error } = useTags("pizza");
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (isError) return <div>Error: {error.message}</div>;
 *
 * return <div>{tags.map(tag => <span key={tag.id}>{tag.name}</span>)}</div>;
 * ```
 */
export function useTags(query?: string) {
  const {
    data: tags,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TagDto[]>(
    {
      queryKey: ["tags", query],
      queryFn: () => fetchTags(query),
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't refetch on window focus for suggestions
      refetchOnWindowFocus: false,
    },
    queryClient
  );

  return {
    tags: tags || [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  } as const;
}
