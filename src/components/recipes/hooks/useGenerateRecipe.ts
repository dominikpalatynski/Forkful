import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { GenerateRecipeCommand, GeneratedRecipeDto } from "@/types";
import { queryClient } from "@/store/query";

/**
 * Wysyła żądanie generowania przepisu do API.
 *
 * @param data - Komenda zawierająca tekst wejściowy
 * @returns Promise zawierający wygenerowane dane przepisu
 * @throws Error jeśli generowanie się nie powiedzie lub odpowiedź nie jest OK
 */
async function generateRecipe(data: GenerateRecipeCommand): Promise<GeneratedRecipeDto> {
  const response = await fetch("/api/recipes/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Musisz być zalogowany, aby generować przepisy");
    }
    if (response.status === 400) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Nieprawidłowe dane wejściowe");
    }
    if (response.status === 422) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Tekst jest zbyt krótki lub niepoprawny");
    }
    if (response.status === 500) {
      throw new Error("Błąd serwera podczas generowania przepisu. Spróbuj ponownie później.");
    }
    throw new Error("Nie udało się wygenerować przepisu");
  }

  return response.json();
}

/**
 * Custom hook do generowania przepisu z AI przy użyciu React Query mutation.
 * Obsługuje operację generowania z toast notifications.
 *
 * @returns Obiekt zawierający funkcję mutation, loading state, error state i success state
 *
 * @example
 * ```tsx
 * const generateMutation = useGenerateRecipe();
 *
 * const handleGenerate = (inputText: string) => {
 *   generateMutation.mutate(
 *     { inputText },
 *     {
 *       onSuccess: (data) => {
 *         console.log('Generated recipe:', data);
 *       }
 *     }
 *   );
 * };
 *
 * if (generateMutation.isPending) return <div>Generowanie...</div>;
 * ```
 */
export function useGenerateRecipe() {
  const mutation = useMutation(
    {
      mutationFn: generateRecipe,
      onError: (error: Error) => {
        toast.error(`Błąd podczas generowania przepisu: ${error.message}`);
      },
    },
    queryClient
  );

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  } as const;
}
