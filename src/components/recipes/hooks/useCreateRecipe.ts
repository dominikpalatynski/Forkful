import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateRecipeCommand, RecipeDetailDto } from "@/types";
import { queryClient } from "@/store/query";

const DRAFT_KEY = "forkful_recipe_draft";

/**
 * Creates a new recipe by sending a POST request to the API.
 *
 * @param data - The recipe data to create
 * @returns Promise containing the created recipe data
 * @throws Error if the creation fails or response is not OK
 */
async function createRecipe(data: CreateRecipeCommand): Promise<RecipeDetailDto> {
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Musisz być zalogowany, aby utworzyć przepis");
    }
    if (response.status === 400) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Walidacja nie powiodła się");
    }
    throw new Error("Nie udało się utworzyć przepisu");
  }

  return response.json();
}

/**
 * Custom hook for creating a new recipe using React Query mutation.
 * Handles the creation operation with toast notifications, cache invalidation, and navigation.
 *
 * @returns Object containing mutation function, loading state, error state, and success state
 *
 * @example
 * ```tsx
 * const createMutation = useCreateRecipe();
 *
 * const onSubmit = (data: CreateRecipeCommand) => {
 *   createMutation.mutate(data);
 * };
 *
 * if (createMutation.isPending) return <div>Creating...</div>;
 * ```
 */
export function useCreateRecipe() {
  const mutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: (createdRecipe: RecipeDetailDto) => {
      queryClient.invalidateQueries({
        queryKey: ["recipes"],
      });

      queryClient.invalidateQueries({
        queryKey: ["tags"],
      });

      localStorage.removeItem(DRAFT_KEY);

      toast.success("Przepis został pomyślnie utworzony!", {
        duration: 1500,
        onAutoClose: () => {
          window.location.href = `/recipes/${createdRecipe.id}`;
        },
      });
    },
    onError: (error: Error) => {
      toast.error(`Błąd podczas tworzenia przepisu: ${error.message}`);
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
