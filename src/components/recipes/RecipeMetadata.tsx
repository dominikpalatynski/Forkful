import { Badge } from "@/components/ui/badge";
import type { RecipeMetadataProps } from "./types";

/**
 * RecipeMetadata component displays the recipe description and associated tags.
 * Both elements are conditionally rendered based on data availability.
 *
 * @param description - Optional recipe description text
 * @param tags - Array of tag names to display as badges
 *
 * @example
 * ```tsx
 * <RecipeMetadata
 *   description="A delicious homemade recipe"
 *   tags={["dessert", "quick", "easy"]}
 * />
 * ```
 */
export function RecipeMetadata({ description, tags }: RecipeMetadataProps) {
  // Don't render the section if there's no description and no tags
  if (!description && tags.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      {description && <p className="text-muted-foreground mb-4">{description}</p>}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}
