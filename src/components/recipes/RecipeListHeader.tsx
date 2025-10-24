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
    <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
      <div className="w-full md:flex-1">
        <SearchInput value={searchValue} onChange={onSearchChange} placeholder="Szukaj przepisów..." />
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <Button
          variant="outline"
          onClick={handleNewAI}
          data-testid="recipe-new-ai-button"
          className="flex-1 md:flex-none min-h-11"
        >
          <Sparkles className="mr-2 h-4 w-4" /> Z AI
        </Button>
        <Button onClick={handleNew} data-testid="recipe-new-button" className="flex-1 md:flex-none min-h-11">
          <Plus className="mr-2 h-4 w-4" /> Nowy przepis
        </Button>
      </div>
    </header>
  );
}
