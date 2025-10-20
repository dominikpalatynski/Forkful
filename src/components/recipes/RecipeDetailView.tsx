import { useRecipeDetail } from "./hooks/useRecipeDetail";
import { useDeleteRecipe } from "./hooks/useDeleteRecipe";
import { RecipeDetailHeader } from "./RecipeDetailHeader";
import { RecipeMetadata } from "./RecipeMetadata";
import { RecipeContentLayout } from "./RecipeContentLayout";
import { DeleteRecipeDialog } from "./DeleteRecipeDialog";
import { ErrorState } from "./ErrorState";
import type { RecipeDetailViewProps } from "./types/detail.types";

/**
 * LoadingState component displays a loading skeleton while recipe data is being fetched.
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Ładowanie przepisu...</p>
      </div>
    </div>
  );
}

/**
 * RecipeDetailView is the main container component for displaying recipe details.
 * It manages data fetching, loading states, error handling, and deletion dialog state.
 *
 * Features:
 * - Fetches recipe data using useRecipeDetail hook
 * - Displays loading state during data fetch
 * - Handles and displays errors with retry functionality
 * - Manages delete confirmation dialog
 * - Navigates to recipe list after successful deletion
 *
 * @param recipeId - UUID of the recipe to display
 *
 * @example
 * ```tsx
 * <RecipeDetailView recipeId="550e8400-e29b-41d4-a716-446655440000" />
 * ```
 */
export function RecipeDetailView({ recipeId }: RecipeDetailViewProps) {
  // Fetch recipe data
  const { recipe, isLoading, isError, error, refetch } = useRecipeDetail(recipeId);

  // Manage delete functionality
  const { deleteRecipe, isDialogOpen, openDialog, closeDialog, isDeleting, error: deleteError } = useDeleteRecipe();

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <LoadingState />
      </div>
    );
  }

  // Show error state
  if (isError || !recipe) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <ErrorState error={error || "Nie udało się pobrać przepisu"} onRetry={refetch} />
      </div>
    );
  }

  // Show recipe details
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <RecipeDetailHeader
        name={recipe.name}
        createdAt={recipe.created_at}
        recipeId={recipeId}
        tags={recipe.tags}
        onDeleteClick={openDialog}
      />

      <RecipeMetadata description={recipe.description} />

      <RecipeContentLayout ingredients={recipe.ingredients} steps={recipe.steps} />

      <DeleteRecipeDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onConfirm={() => deleteRecipe(recipeId)}
        recipeName={recipe.name}
        isDeleting={isDeleting}
      />

      {/* Display delete error if it occurs */}
      {deleteError && (
        <div className="mt-4">
          <ErrorState error={deleteError} onRetry={closeDialog} />
        </div>
      )}
    </div>
  );
}
