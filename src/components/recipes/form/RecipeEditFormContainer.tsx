import { useRecipeDetail } from "../hooks/useRecipeDetail";
import { RecipeEditForm } from "./RecipeEditForm";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";
import type { RecipeEditFormContainerProps } from "../types/form.types";

/**
 * RecipeEditFormContainer Component
 *
 * Container component that fetches recipe data and handles loading/error states.
 * Uses useRecipeDetail hook to fetch initial data and renders RecipeEditForm
 * when data is available.
 *
 * @param recipeId - The UUID of the recipe to edit
 */
export function RecipeEditFormContainer({ recipeId }: RecipeEditFormContainerProps) {
  const { recipe, isLoading, isError, error, refetch } = useRecipeDetail(recipeId);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie przepisu...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  // Show empty state if no recipe data
  if (!recipe) {
    return <EmptyState variant="no-recipes" />;
  }

  // Render the form with loaded data
  return <RecipeEditForm initialData={recipe} recipeId={recipeId} />;
}
