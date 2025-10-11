import type { RecipeMetadataProps } from "./types";
import { SectionHeader } from "./SectionHeader";
import { Card, CardContent } from "../ui/card";
/**
 * RecipeMetadata component displays the recipe description and associated tags.
 * Both elements are conditionally rendered based on data availability.
 *
 * @param description - Optional recipe description text
 *
 * @example
 * ```tsx
 * <RecipeMetadata
 *   description="A delicious homemade recipe"
 * />
 * ```
 */
export function RecipeMetadata({ description }: RecipeMetadataProps) {
  return (
    <section className="mb-8">
      <SectionHeader>Opis</SectionHeader>
      <Card>
        <CardContent>
          {description && description.trim() !== "" ? (
            <p >{description}</p>
          ) : (
            <p className="text-muted-foreground">Brak opisu</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
