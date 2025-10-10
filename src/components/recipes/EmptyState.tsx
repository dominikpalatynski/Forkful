import React from "react";
import type { EmptyStateProps } from "./types";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ChefHat, Search } from "lucide-react";

export function EmptyState({ variant }: EmptyStateProps): React.ReactElement {
  const isNoRecipes = variant === "no-recipes";

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {isNoRecipes ? <ChefHat className="size-16" /> : <Search className="size-16" />}
        </EmptyMedia>
        <EmptyTitle>{isNoRecipes ? "Brak przepisów" : "Brak wyników"}</EmptyTitle>
        <EmptyDescription>
          {isNoRecipes
            ? "Nie masz jeszcze żadnych zapisanych przepisów. Dodaj swój pierwszy przepis, aby rozpocząć."
            : "Nie znaleziono przepisów pasujących do Twojego wyszukiwania. Spróbuj użyć innych słów kluczowych lub wyczyść filtry."}
        </EmptyDescription>
      </EmptyHeader>
      {isNoRecipes && (
        <EmptyContent>
          <Button asChild>
            <a href="/recipes/new">Dodaj pierwszy przepis</a>
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
