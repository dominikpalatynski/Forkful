import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UpdateRecipeCommand, RecipeDetailDto } from "@/types";
import { queryClient } from "@/store/query";

/**
 * Updates a recipe by sending a PUT request to the API.
 *
 * @param recipeId - The UUID of the recipe to update
 * @param data - The updated recipe data
 * @returns Promise containing the updated recipe data
 * @throws Error if the update fails or response is not OK
 */
async function updateRecipe(recipeId: string, data: UpdateRecipeCommand): Promise<RecipeDetailDto> {
  const response = await fetch(`/api/recipes/${recipeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Recipe not found");
    }
    if (response.status === 403) {
      throw new Error("You don't have permission to update this recipe");
    }
    if (response.status === 400) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Validation failed");
    }
    throw new Error("Failed to update recipe");
  }

  return response.json();
}

/**
 * Custom hook for updating a recipe using React Query mutation.
 * Handles the update operation with toast notifications and navigation.
 *
 * @param recipeId - The UUID of the recipe to update
 * @returns Object containing mutation function, loading state, error state, and success state
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateRecipe(recipeId);
 *
 * const onSubmit = (data: UpdateRecipeCommand) => {
 *   updateMutation.mutate(data);
 * };
 *
 * if (updateMutation.isPending) return <div>Updating...</div>;
 * ```
 */
export function useUpdateRecipe(recipeId: string) {
  const mutation = useMutation({
    mutationFn: (data: UpdateRecipeCommand) => updateRecipe(recipeId, data),
    onSuccess: (updatedRecipe: RecipeDetailDto) => {
      queryClient.invalidateQueries({
        queryKey: ["recipe", updatedRecipe.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["recipes"],
      });

      toast.success("Przepis został pomyślnie zaktualizowany!", {
        duration: 1500,
        onAutoClose: () => {
          window.location.href = `/recipes/${updatedRecipe.id}`;
        },
      });
    },
    onError: (error: Error) => {
      toast.error(`Błąd podczas aktualizacji przepisu: ${error.message}`);
    },
  }, queryClient);

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  } as const;
}
