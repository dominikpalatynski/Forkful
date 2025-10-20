import { Button } from "@/components/ui/button";
import type { RecipeDetailHeaderProps } from "./types/detail.types";
import { Badge } from "@/components/ui/badge";
/**
 * Formats an ISO date string to a localized readable format (DD.MM.YYYY).
 *
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date string in Polish locale
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * RecipeDetailHeader component displays the recipe name, creation date,
 * and action buttons (Back, Edit, Delete) in a responsive layout.
 *
 * @param name - Recipe name to display
 * @param createdAt - ISO date string of recipe creation
 * @param recipeId - Recipe UUID for edit navigation
 * @param onDeleteClick - Callback to trigger delete action
 *
 * @example
 * ```tsx
 * <RecipeDetailHeader
 *   name="Chocolate Cake"
 *   createdAt="2024-01-15T10:30:00Z"
 *   recipeId="uuid-123"
 *   onDeleteClick={handleOpenDeleteDialog}
 * />
 * ```
 */
export function RecipeDetailHeader({ name, createdAt, recipeId, tags, onDeleteClick }: RecipeDetailHeaderProps) {
  const handleBackClick = () => {
    window.location.href = "/recipes";
  };

  const handleEditClick = () => {
    window.location.href = `/recipes/${recipeId}/edit`;
  };

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <div className="flex flex-row gap-2 items-center">
          <h1 className="text-3xl font-bold">{name}</h1>
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Utworzono: {formatDate(createdAt)}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={handleBackClick}>
          Wróć
        </Button>
        <Button variant="default" onClick={handleEditClick}>
          Edytuj
        </Button>
        <Button variant="secondary" onClick={onDeleteClick}>
          Usuń
        </Button>
      </div>
    </header>
  );
}
