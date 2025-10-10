import { Card, CardContent } from "../ui/card";
import type { RecipeIngredientsSectionProps } from "./types";
import { SectionHeader } from "./SectionHeader";
/**
 * RecipeIngredientsSection component displays a list of recipe ingredients
 * as bullet points. Shows a message if no ingredients are available.
 *
 * @param ingredients - Array of ingredient objects to display
 *
 * @example
 * ```tsx
 * <RecipeIngredientsSection
 *   ingredients={[
 *     { id: "1", content: "2 cups flour", position: 1 },
 *     { id: "2", content: "1 tsp salt", position: 2 }
 *   ]}
 * />
 * ```
 */
export function RecipeIngredientsSection({ ingredients }: RecipeIngredientsSectionProps) {
  return (
    <section>
      <SectionHeader>Składniki</SectionHeader>
      {ingredients.length === 0 ? (
        <p className="text-muted-foreground">Brak składników</p>
      ) : (
        <Card>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              {ingredients.map((ingredient) => (
                <li key={ingredient.id} className="text-base">
                  {ingredient.content}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
