import React from "react";
import { useAIRecipeFormFlow } from "./hooks/useAIRecipeFormFlow";
import { useConfirmationDialogs } from "./AIRecipeForm/useConfirmationDialogs";
import {
  AIRecipeFormInputPhase,
  AIRecipeFormEditPhase,
  AIRecipeFormConfirmationDialogs,
} from "./AIRecipeForm/AIRecipeForm.Phases";

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
 *   3. "Cancel" → redirect to /recipes
 *
 * Architecture:
 * - State managed by Zustand store with localStorage persistence
 * - Custom hook (useAIRecipeFormFlow) extracts state management logic
 * - Compound pattern: InputPhase, EditPhase, ConfirmationDialogs components
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
    hasData,
    handleGenerate,
    handleInputChange,
    handleBack,
    handleSubmit,
    handleConfirmCancel,
    handleConfirmBackToText,
    generateMutation,
    createMutation,
  } = useAIRecipeFormFlow();

  const dialogs = useConfirmationDialogs();

  /**
   * Render Input Phase
   */
  if (phase === "input") {
    return (
      <>
        <AIRecipeFormInputPhase
          inputText={inputText}
          onInputChange={handleInputChange}
          onGenerate={handleGenerate}
          isGenerating={generateMutation.isPending}
          hasData={hasData}
          onBack={handleBack}
          confirmCancelDialog={dialogs.confirmCancel}
        />

        <AIRecipeFormConfirmationDialogs
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
        <AIRecipeFormEditPhase
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

        <AIRecipeFormConfirmationDialogs
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
      <p className="text-muted-foreground">Wystąpił błąd w przepływie tworzenia przepisu. Spróbuj ponownie.</p>
      <button type="button" onClick={handleBack} className="text-primary hover:underline">
        Wróć do listy przepisów
      </button>
    </div>
  );
}
