import React from "react";
import { useAIRecipeFormStore } from "@/store/ai-recipe-form.store";
import { useGenerateRecipe } from "./hooks/useGenerateRecipe";
import { useCreateRecipe } from "./hooks/useCreateRecipe";
import {
  useConfirmationDialogs
} from "./AIRecipeForm/useConfirmationDialogs";
import { InputPhase } from "./AIRecipeForm/InputPhase";
import { EditPhase } from "./AIRecipeForm/EditPhase";
import { ConfirmationDialogs } from "./AIRecipeForm/ConfirmationDialogs";
import type { CreateRecipeCommand } from "@/types";

/**
 * AIRecipeForm Component
 *
 * Main orchestrator for AI-powered recipe creation flow.
 * Manages two distinct phases:
 *
 * Phase 1 - 'input':
 * - User enters text description (100-1000 characters)
 * - Generates recipe via POST /api/recipes/generate
 * - Transitions to 'edit' phase on success
 *
 * Phase 2 - 'edit':
 * - User reviews and edits generated recipe data
 * - Three actions available:
 *   1. "Save recipe" → POST /api/recipes → redirect to /recipes/:id
 *   2. "Back to text edit" → return to 'input' phase (preserves text)
 *   3. "Cancel" → redirect to /
 *
 * Architecture:
 * - State managed by Zustand store with localStorage persistence
 * - State machine pattern via useAIRecipeFormMachine hook
 * - Separated concerns: InputPhase, EditPhase, ConfirmationDialogs
 * - Dialog management via useConfirmationDialogs hook
 *
 * @example
 * ```tsx
 * // In Astro page:
 * <AIRecipeForm client:load />
 * ```
 */
export function AIRecipeForm() {
  const {
    phase,
    inputText,
    generationId,
    generatedData,
    setInputText,
    setGeneratedData,
    goBackToInput,
    reset,
  } = useAIRecipeFormStore();

  const dialogs = useConfirmationDialogs();
  const generateMutation = useGenerateRecipe();
  const createMutation = useCreateRecipe({
    onSuccessBeforeRedirect: () => {
      reset();
    },
  });

  /**
   * Derived state: Check if user has any data entered
   */
  const hasData = React.useMemo(() => {
    return inputText.trim().length > 0 || generatedData !== null;
  }, [inputText, generatedData]);

  /**
   * Handler for AI recipe generation
   */
  const handleGenerate = React.useCallback(
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
  const handleInputChange = React.useCallback(
    (text: string) => {
      setInputText(text);
    },
    [setInputText]
  );

  /**
   * Handler for navigating back to home
   */
  const handleBack = React.useCallback(() => {
    reset();
    window.location.href = "/";
  }, [reset]);

  /**
   * Handler for recipe submission
   */
  const handleSubmit = React.useCallback(
    (data: CreateRecipeCommand) => {
      createMutation.mutate(data);
    },
    [createMutation]
  );

  /**
   * Handler for cancel confirmation
   */
  const handleConfirmCancel = React.useCallback(() => {
    reset();
    window.location.href = "/";
  }, [reset]);

  /**
   * Handler for back to text confirmation
   */
  const handleConfirmBackToText = React.useCallback(() => {
    goBackToInput();
    dialogs.backToText.close();
  }, [goBackToInput, dialogs.backToText]);

  /**
   * Render Input Phase
   */
  if (phase === "input") {
    return (
      <>
        <InputPhase
          inputText={inputText}
          onInputChange={handleInputChange}
          onGenerate={handleGenerate}
          isGenerating={generateMutation.isPending}
          hasData={hasData}
          onBack={handleBack}
          confirmCancelDialog={dialogs.confirmCancel}
        />

        <ConfirmationDialogs
          phase="input"
          confirmCancelDialog={dialogs.confirmCancel}
          backToTextDialog={dialogs.backToText}
          onConfirmCancel={handleConfirmCancel}
          onConfirmBackToText={handleConfirmBackToText}
        />
      </>
    );
  }

  /**
   * Render Edit Phase
   * Validates that generatedData and generationId are available
   */
  if (phase === "edit" && generatedData && generationId) {
    return (
      <>
        <EditPhase
          generatedData={generatedData}
          generationId={generationId}
          onSubmit={handleSubmit}
          onBackToTextEdit={dialogs.backToText.open}
          hasData={hasData}
          onCancel={handleBack}
          isSubmitting={createMutation.isPending}
          confirmCancelDialog={dialogs.confirmCancel}
          backToTextDialog={dialogs.backToText}
        />

        <ConfirmationDialogs
          phase="edit"
          confirmCancelDialog={dialogs.confirmCancel}
          backToTextDialog={dialogs.backToText}
          onConfirmCancel={handleConfirmCancel}
          onConfirmBackToText={handleConfirmBackToText}
        />
      </>
    );
  }

  /**
   * Fallback for inconsistent state
   * Should not occur in normal operation
   */
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Wystąpił błąd w przepływie tworzenia przepisu. Spróbuj ponownie.
      </p>
      <button
        type="button"
        onClick={handleBack}
        className="text-primary hover:underline"
      >
        Wróć do strony głównej
      </button>
    </div>
  );
}
