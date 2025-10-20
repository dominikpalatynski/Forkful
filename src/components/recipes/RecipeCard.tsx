import React from "react";
import type { RecipeCardProps } from "./types/list.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const RecipeCard = React.memo(function RecipeCard({ recipe }: RecipeCardProps): React.ReactElement {
  return (
    <Card
      onClick={() => (window.location.href = `/recipes/${recipe.id}`)}
      className="h-full hover:shadow-md transition-shadow cursor-pointer"
    >
      <CardHeader>
        <CardTitle className="mb-2 font-semibold">{recipe.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {recipe.description && <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>}
        {recipe.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {recipe.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 text-xs rounded-full bg-secondary">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
