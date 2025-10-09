import React from "react";
import type { RecipeGridProps } from "./types";
import { RecipeCard } from "./RecipeCard";
import { RecipeCardSkeleton } from "./RecipeCardSkeleton";
import { EmptyState } from "./EmptyState";

export function RecipeGrid({ recipes, isLoading, isEmpty }: RecipeGridProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <RecipeCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return <EmptyState variant="no-results" />;
  }

  if (!isLoading && recipes.length === 0) {
    return <EmptyState variant="no-recipes" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}


