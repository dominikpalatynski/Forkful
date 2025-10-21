import { useState, useEffect, useMemo } from "react";
import { useRecipeDetail } from "./useRecipeDetail";

/**
 * Custom hook for managing breadcrumb data including recipe fetching.
 * Extracts recipe ID from the current path and fetches recipe details when needed.
 *
 * @returns Object containing current path, recipe title, and loading state
 *
 * @example
 * ```tsx
 * const { currentPath, recipeTitle, isLoadingRecipe } = useBreadcrumbs();
 *
 * return (
 *   <DashboardBreadcrumbs
 *     currentPath={currentPath}
 *     recipeTitle={recipeTitle}
 *     isLoadingRecipe={isLoadingRecipe}
 *   />
 * );
 * ```
 */
export function useBreadcrumbs() {
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    // Get current path on client side
    setCurrentPath(window.location.pathname);
  }, []);

  // Extract recipe ID from URL if present
  const recipeId = useMemo(() => {
    const match = currentPath.match(/^\/recipes\/([^/]+)/);
    const id = match ? match[1] : null;
    // Only return ID if it's not a special route
    if (id && id !== "new" && id !== "new-ai") {
      return id;
    }
    return null;
  }, [currentPath]);

  // Fetch recipe details only if we have a valid recipe ID
  // Use a dummy ID if no recipeId to satisfy the hook call requirement
  const { recipe, isLoading } = useRecipeDetail(recipeId || "skip-fetch");

  return {
    currentPath,
    recipeTitle: recipe?.name,
    isLoadingRecipe: recipeId ? isLoading : false,
  } as const;
}
