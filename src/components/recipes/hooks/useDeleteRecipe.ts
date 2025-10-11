import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/store/query";
import { toast } from "sonner";

/**
 * Deletes a recipe by ID via the API.
 *
 * @param recipeId - The UUID of the recipe to delete
 * @returns Promise that resolves when deletion is complete
 * @throws Error if the deletion fails or response is not OK
 */
async function deleteRecipe(recipeId: string): Promise<void> {
  const response = await fetch(`/api/recipes/${recipeId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Recipe not found");
    }
    if (response.status === 403) {
      throw new Error("You don't have permission to delete this recipe");
    }
    throw new Error("Failed to delete recipe");
  }
}

/**
 * Custom hook for deleting a recipe with loading and error state management.
 * Includes a confirmation dialog state and automatic cache invalidation on success.
 *
 * @returns Object containing delete function, dialog state, loading state, and error state
 *
 * @example
 * ```tsx
 * const {
 *   deleteRecipe,
 *   isDialogOpen,
 *   openDialog,
 *   closeDialog,
 *   isDeleting,
 *   error
 * } = useDeleteRecipe();
 *
 * const handleDelete = async () => {
 *   try {
 *     await deleteRecipe(recipeId);
 *     // Navigate away or show success message
 *   } catch (err) {
 *     // Error is already captured in the hook
 *   }
 * };
 * ```
 */
export function useDeleteRecipe() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mutation = useMutation(
    {
      mutationFn: deleteRecipe,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["recipes"] });
        queryClient.invalidateQueries({ queryKey: ["recipe"] });
        queryClient.invalidateQueries({ queryKey: ["tags"] });

        toast.success("Przepis został pomyślnie usunięty!", {
          duration: 1500,
          onAutoClose: () => {
            closeDialog();
            window.location.href = "/recipes";
          },
        });
      },
      onError: (error: Error) => {
        toast.error(`Błąd podczas usuwania przepisu: ${error.message}`);
      },
    },
    queryClient
  );

  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const handleDelete = useCallback(
    async (recipeId: string) => {
      await mutation.mutateAsync(recipeId);
    },
    [mutation]
  );

  return {
    deleteRecipe: handleDelete,
    isDialogOpen,
    openDialog,
    closeDialog,
    isDeleting: mutation.isPending,
    error: mutation.error as Error | null,
  } as const;
}
