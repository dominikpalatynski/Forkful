/** Faza przepływu AI Recipe Form */
export type AIRecipeFormPhase = 'input' | 'edit';

/** Props dla AIRecipeTextInput */
export interface AIRecipeTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: (inputText: string) => void;
  isGenerating: boolean;
  onBack: () => void;
}

/** Props dla CharacterCounter */
export interface CharacterCounterProps {
  current: number;
  min: number;
  max: number;
}

/** Props dla AIEditRecipeForm */
export interface AIEditRecipeFormProps {
  initialData: import("@/types").GeneratedRecipeDto;
  generationId: string;
  onSubmit: (data: import("@/types").CreateRecipeCommand) => void;
  onBackToTextEdit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

/** Props dla AIFormActionButtons */
export interface AIFormActionButtonsProps {
  onBackToTextEdit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}
