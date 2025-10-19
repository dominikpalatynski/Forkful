import React from "react";
import { AIRecipeTextInput } from "../form/AIRecipeTextInput";
import type { DialogState } from "./useConfirmationDialogs";

export interface InputPhaseProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onGenerate: (text: string) => void;
  isGenerating: boolean;
  hasData: boolean;
  onBack: () => void;
  confirmCancelDialog: DialogState;
}

/**
 * InputPhase Component
 *
 * Renders the input phase of AI Recipe Form where users enter text
 * to generate a recipe. Handles navigation with confirmation when
 * user has entered data.
 */
export function InputPhase({
  inputText,
  onInputChange,
  onGenerate,
  isGenerating,
  hasData,
  onBack,
  confirmCancelDialog,
}: InputPhaseProps) {
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
