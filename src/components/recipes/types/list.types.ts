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
