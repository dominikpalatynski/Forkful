export interface RecipeEditFormContainerProps {
  recipeId: string;
}

export interface RecipeEditFormProps {
  initialData: import("@/types").RecipeDetailDto;
  recipeId: string;
}

export interface RecipeBasicInfoSectionProps {
  control: import("react-hook-form").Control<import("@/types").UpdateRecipeCommand>;
}

export interface EditableIngredientsListProps {
  control: import("react-hook-form").Control<import("@/types").UpdateRecipeCommand>;
}

export interface EditableStepsListProps {
  control: import("react-hook-form").Control<import("@/types").UpdateRecipeCommand>;
}

export interface TagInputProps {
  control: import("react-hook-form").Control<import("@/types").UpdateRecipeCommand>;
  suggestions: string[];
}

export interface TagPillProps {
  name: string;
  onRemove: (name: string) => void;
}

export interface FormActionButtonsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isDirty: boolean;
  submitButtonText?: string;
}

// Manual Recipe Creation Form Types
export interface CreateRecipeBasicInfoSectionProps {
  control: import("react-hook-form").Control<import("@/types").CreateRecipeCommand>;
}

export interface CreateRecipeIngredientsListProps {
  control: import("react-hook-form").Control<import("@/types").CreateRecipeCommand>;
}

export interface CreateRecipeStepsListProps {
  control: import("react-hook-form").Control<import("@/types").CreateRecipeCommand>;
}

export interface CreateRecipeTagInputProps {
  control: import("react-hook-form").Control<import("@/types").CreateRecipeCommand>;
  suggestions: string[];
}
