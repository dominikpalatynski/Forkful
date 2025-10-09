import React, { useCallback } from "react";
import { SearchInput } from "./SearchInput";3
import { Button } from "@/components/ui/button";
import type { RecipeListHeaderProps } from "./types";
import { Plus } from "lucide-react";

export function RecipeListHeader({ searchValue, onSearchChange }: RecipeListHeaderProps): JSX.Element {
  const handleNew = useCallback(() => {
    window.location.href = "/recipes/new";
  }, []);

  return (
    <header className="mb-6 flex justify-between items-center gap-4">
      <div className="flex-1">
        <SearchInput value={searchValue} onChange={onSearchChange} placeholder="Szukaj przepisów..." />
      </div>
      <div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" /> Nowy przepis
        </Button>
      </div>
    </header>
  );
}


