import { useMemo, useCallback } from "react";
import { useAIRecipeFormStore } from "@/store/ai-recipe-form.store";
import { useGenerateRecipe } from "./useGenerateRecipe";
import { useCreateRecipe } from "./useCreateRecipe";
import type { CreateRecipeCommand } from "@/types";

/**
 * Custom hook that orchestrates the AI recipe form flow.
 * Extracts state management logic from AIRecipeForm component.
 *
 * Handles:
 * - Store state and actions
 * - API mutations (generate and create)
 * - Event handlers for user interactions
 * - Derived state calculations
 */
export function useAIRecipeFormFlow() {
  const { phase, inputText, generationId, generatedData, setInputText, setGeneratedData, goBackToInput, reset } =
    useAIRecipeFormStore();

  const generateMutation = useGenerateRecipe();
  const createMutation = useCreateRecipe({
    onSuccessBeforeRedirect: () => {
      reset();
    },
  });

  /**
   * Derived state: Check if user has any data entered
   */
  const hasData = useMemo(() => {
    return inputText.trim().length > 0 || generatedData !== null;
  }, [inputText, generatedData]);

  /**
   * Handler for AI recipe generation
   */
  const handleGenerate = useCallback(
    (text: string) => {
      generateMutation.mutate(
        { inputText: text },
        {
          onSuccess: (data) => {
            setGeneratedData(data, data.generationId);
          },
        }
      );
    },
    [generateMutation, setGeneratedData]
  );

  /**
   * Handler for input text changes
   */
  const handleInputChange = useCallback(
    (text: string) => {
      setInputText(text);
    },
    [setInputText]
  );

  /**
   * Handler for navigating back to home
   */
  const handleBack = useCallback(() => {
    reset();
    window.location.href = "/";
  }, [reset]);

  /**
   * Handler for recipe submission
   */
  const handleSubmit = useCallback(
    (data: CreateRecipeCommand) => {
      createMutation.mutate(data);
    },
    [createMutation]
  );

  /**
   * Handler for cancel confirmation
   */
  const handleConfirmCancel = useCallback(() => {
    reset();
    window.location.href = "/";
  }, [reset]);

  /**
   * Handler for back to text confirmation
   */
  const handleConfirmBackToText = useCallback(() => {
    goBackToInput();
  }, [goBackToInput]);

  return {
    // Store state
    phase,
    inputText,
    generationId,
    generatedData,
    hasData,

    // Mutations
    generateMutation,
    createMutation,

    // Handlers
    handleGenerate,
    handleInputChange,
    handleBack,
    handleSubmit,
    handleConfirmCancel,
    handleConfirmBackToText,
  };
}
