import { useQuery } from "@tanstack/react-query";
import type { RecipeDetailDto } from "@/types";
import { queryClient } from "@/store/query";

/**
 * Fetches a single recipe by ID from the API.
 *
 * @param recipeId - The UUID of the recipe to fetch
 * @returns Promise containing the recipe detail data
 * @throws Error if the fetch fails or response is not OK
 */
async function fetchRecipeById(recipeId: string): Promise<RecipeDetailDto> {
  if (recipeId === "skip-fetch") {
    return {
      id: "",
      name: "",
      description: "",
      created_at: "",
      ingredients: [],
      steps: [],
      tags: [],
    };
  }

  const response = await fetch(`/api/recipes/${recipeId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Recipe not found");
    }
    if (response.status === 403) {
      throw new Error("You don't have permission to view this recipe");
    }
    throw new Error("Failed to fetch recipe");
  }

  return response.json();
}

/**
 * Custom hook for fetching and managing a single recipe's detail data.
 * Uses React Query for caching, loading states, and error handling.
 *
 * @param recipeId - The UUID of the recipe to fetch
 * @returns Object containing recipe data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * const { recipe, isLoading, isError, error, refetch } = useRecipeDetail(recipeId);
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (isError) return <div>Error: {error.message}</div>;
 * if (!recipe) return null;
 *
 * return <div>{recipe.name}</div>;
 * ```
 */
export function useRecipeDetail(recipeId: string) {
  const {
    data: recipe,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<RecipeDetailDto>(
    {
      queryKey: ["recipe", recipeId],
      queryFn: () => fetchRecipeById(recipeId),
      // Disable automatic refetching on window focus for detail views
      refetchOnWindowFocus: false,
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
    },
    queryClient
  );

  return {
    recipe,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  } as const;
}
