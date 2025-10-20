import { useCallback } from "react";
import { SearchInput } from "./SearchInput";
import { Button } from "@/components/ui/button";
import type { RecipeListHeaderProps } from "./types/list.types";
import { Plus, Sparkles } from "lucide-react";

export function RecipeListHeader({ searchValue, onSearchChange }: RecipeListHeaderProps) {
  const handleNew = useCallback(() => {
    window.location.href = "/recipes/new";
  }, []);

  const handleNewAI = useCallback(() => {
    window.location.href = "/recipes/new-ai";
  }, []);

  return (
    <header className="mb-6 flex justify-between items-center gap-4">
      <div className="flex-1">
        <SearchInput value={searchValue} onChange={onSearchChange} placeholder="Szukaj przepisów..." />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleNewAI}>
          <Sparkles className="mr-2 h-4 w-4" /> Z AI
        </Button>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" /> Nowy przepis
        </Button>
      </div>
    </header>
  );
}
