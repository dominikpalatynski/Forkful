import React from "react";
import { AIRecipeTextInput } from "../form/AIRecipeTextInput";
import { AIEditRecipeForm } from "../form/AIEditRecipeForm";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { GeneratedRecipeDto, CreateRecipeCommand } from "@/types";
import type { DialogState } from "./useConfirmationDialogs";
import type { AIRecipeFormInputPhaseProps, AIRecipeFormEditPhaseProps, AIRecipeFormConfirmationDialogsProps } from "../types/ai.types";

/**
 * AIRecipeFormInputPhase Component
 *
 * Renders the input phase of AI Recipe Form where users enter text
 * to generate a recipe. Handles navigation with confirmation when
 * user has entered data.
 */

export function AIRecipeFormInputPhase({
  inputText,
  onInputChange,
  onGenerate,
  isGenerating,
  hasData,
  onBack,
  confirmCancelDialog,
}: AIRecipeFormInputPhaseProps) {
  const handleBack = React.useCallback(() => {
    if (hasData) {
      confirmCancelDialog.open();
    } else {
      onBack();
    }
  }, [hasData, confirmCancelDialog, onBack]);

  return (
    <AIRecipeTextInput
      value={inputText}
      onChange={onInputChange}
      onGenerate={onGenerate}
      isGenerating={isGenerating}
      onBack={handleBack}
    />
  );
}

/**
 * AIRecipeFormEditPhase Component
 *
 * Renders the edit phase of AI Recipe Form where users can review
 * and edit the generated recipe data before submitting. Handles
 * navigation with confirmation dialogs.
 */

export function AIRecipeFormEditPhase({
  generatedData,
  generationId,
  onSubmit,
  onBackToTextEdit,
  hasData,
  onCancel,
  isSubmitting,
  confirmCancelDialog,
  backToTextDialog,
}: AIRecipeFormEditPhaseProps) {
  const handleCancel = React.useCallback(() => {
    if (hasData) {
      confirmCancelDialog.open();
    } else {
      onCancel();
    }
  }, [hasData, confirmCancelDialog, onCancel]);

  const handleBackToTextEdit = React.useCallback(() => {
    backToTextDialog.open();
  }, [backToTextDialog]);

  return (
    <AIEditRecipeForm
      initialData={generatedData}
      generationId={generationId}
      onSubmit={onSubmit}
      onBackToTextEdit={handleBackToTextEdit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
    />
  );
}

/**
 * AIRecipeFormConfirmationDialogs Component
 *
 * Centralized component for managing all confirmation dialogs
 * in the AI Recipe Form. Renders different dialogs based on
 * the current phase.
 */

export function AIRecipeFormConfirmationDialogs({
  phase,
  confirmCancelDialog,
  backToTextDialog,
  onConfirmCancel,
  onConfirmBackToText,
}: AIRecipeFormConfirmationDialogsProps) {
  return (
    <>
      {/* Cancel confirmation dialog - shown in both phases but with different messages */}
      <ConfirmationDialog
        isOpen={confirmCancelDialog.isOpen}
        onOpenChange={(open) => {
          if (open) {
            confirmCancelDialog.open();
          } else {
            confirmCancelDialog.close();
          }
        }}
        title="Odrzucić wprowadzone dane?"
        description={
          phase === "input"
            ? "Masz wprowadzony tekst. Czy na pewno chcesz wyjść bez generowania przepisu?"
            : "Masz wygenerowany przepis. Czy na pewno chcesz wyjść bez zapisywania?"
        }
        cancelButton={{
          text: "Powrót",
        }}
        actionButton={{
          text: "Odrzuć dane",
          onClick: onConfirmCancel,
        }}
      />

      {/* Back to text edit dialog - only shown in edit phase */}
      {phase === "edit" && (
        <ConfirmationDialog
          isOpen={backToTextDialog.isOpen}
          onOpenChange={(open) => {
            if (open) {
              backToTextDialog.open();
            } else {
              backToTextDialog.close();
            }
          }}
          title="Wrócić do edycji tekstu?"
          description="Powrót do edycji tekstu spowoduje porzucenie wygenerowanego przepisu. Będziesz musiał wygenerować przepis ponownie."
          cancelButton={{
            text: "Anuluj",
          }}
          actionButton={{
            text: "Wróć do tekstu",
            onClick: onConfirmBackToText,
          }}
        />
      )}
    </>
  );
}
