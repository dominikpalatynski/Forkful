import React from "react";
import { AIEditRecipeForm } from "../form/AIEditRecipeForm";
import type { GeneratedRecipeDto, CreateRecipeCommand } from "@/types";
import type { DialogState } from "./useConfirmationDialogs";

export interface EditPhaseProps {
  generatedData: GeneratedRecipeDto;
  generationId: string;
  onSubmit: (data: CreateRecipeCommand) => void;
  onBackToTextEdit: () => void;
  hasData: boolean;
  onCancel: () => void;
  isSubmitting: boolean;
  confirmCancelDialog: DialogState;
  backToTextDialog: DialogState;
}

/**
 * EditPhase Component
 *
 * Renders the edit phase of AI Recipe Form where users can review
 * and edit the generated recipe data before submitting. Handles
 * navigation with confirmation dialogs.
 */
export function EditPhase({
  generatedData,
  generationId,
  onSubmit,
  hasData,
  onCancel,
  isSubmitting,
  confirmCancelDialog,
  backToTextDialog,
}: EditPhaseProps) {
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
