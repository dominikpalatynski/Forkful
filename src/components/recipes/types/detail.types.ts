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
