import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { TagPillProps } from "../types";

/**
 * TagPill Component
 *
 * Represents a single selected tag with a remove button.
 * Displays the tag name in a badge and provides a close button for removal.
 *
 * @param name - The tag name to display
 * @param onRemove - Callback function called when the remove button is clicked
 */
export function TagPill({ name, onRemove }: TagPillProps) {
  const handleRemove = () => {
    onRemove(name);
  };

  return (
    <Badge variant="secondary" className="flex items-center gap-2 pr-1">
      <span className="text-sm">{name}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
        onClick={handleRemove}
        aria-label={`Usuń tag "${name}"`}
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );
}
