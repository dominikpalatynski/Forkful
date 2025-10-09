import React from "react";
import { useRecipeListState } from "./hooks/useRecipeListState";
import { RecipeListHeader } from "./RecipeListHeader";
import { TagFilter } from "./TagFilter";
import { RecipeGrid } from "./RecipeGrid";
import { PaginationControls } from "./PaginationControls";
import { ErrorState } from "./ErrorState";

export function RecipeListView(): React.ReactElement {
  const state = useRecipeListState();

  if (state.isError) {
    return <ErrorState error={state.error ?? "Wystąpił błąd"} onRetry={state.handleRetry} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <RecipeListHeader
        searchValue={state.searchQuery}
        onSearchChange={state.handleSearchChange}
      />

      {state.tags.length > 0 && (
        <TagFilter
          tags={state.tags}
          selectedTag={state.selectedTag}
          onTagSelect={state.handleTagSelect}
        />
      )}

      <RecipeGrid
        recipes={state.recipes}
        isLoading={state.isLoading}
        isEmpty={state.isEmpty}
        onRecipeClick={state.handleRecipeClick}
      />

      {state.pagination && state.recipes.length > 0 && (
        <PaginationControls
          currentPage={state.pagination.page}
          totalPages={state.pagination.totalPages}
          totalItems={state.pagination.totalItems}
          pageSize={state.pagination.pageSize}
          onPageChange={state.handlePageChange}
          onPageSizeChange={state.handlePageSizeChange}
        />
      )}
    </div>
  );
}


