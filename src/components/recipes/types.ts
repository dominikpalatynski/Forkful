import type { TagDto, RecipeListItemDto } from "@/types";

export interface RecipeListHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface TagFilterProps {
  tags: TagDto[];
  selectedTag: string | null;
  onTagSelect: (tagName: string | null) => void;
}

export interface TagFilterPillProps {
  name: string;
  isSelected: boolean;
  onClick: (name: string) => void;
}

export interface RecipeGridProps {
  recipes: RecipeListItemDto[];
  isLoading: boolean;
  isEmpty: boolean;
  onRecipeClick: (recipeId: string) => void;
}

export interface RecipeCardProps {
  recipe: RecipeListItemDto;
}

export interface EmptyStateProps {
  variant: "no-recipes" | "no-results";
}

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export interface ErrorStateProps {
  error: Error | string;
  onRetry: () => void;
}

// ============================================================================
// Recipe Detail View Types
// ============================================================================

export interface RecipeDetailViewProps {
  recipeId: string;
}

export interface RecipeDetailHeaderProps {
  name: string;
  createdAt: string; // ISO date string
  recipeId: string;
  tags: string[];
  onDeleteClick: () => void;
}

export interface RecipeMetadataProps {
  description?: string | null;
}

export interface RecipeContentLayoutProps {
  ingredients: import("@/types").RecipeIngredientDto[];
  steps: import("@/types").RecipeStepDto[];
}

export interface RecipeIngredientsSectionProps {
  ingredients: import("@/types").RecipeIngredientDto[];
}

export interface RecipeStepsSectionProps {
  steps: import("@/types").RecipeStepDto[];
}

export interface DeleteRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  recipeName: string;
  isDeleting: boolean;
}

// ============================================================================
// Recipe Edit Form Types
// ============================================================================

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

// ============================================================================
// Manual Recipe Creation Form Types
// ============================================================================


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

// ============================================================================
// AI Recipe Creation Form Types
// ============================================================================

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
