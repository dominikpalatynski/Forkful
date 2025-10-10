import type { RecipeIngredientsSectionProps } from "./types";

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
      <h2 className="text-2xl font-semibold mb-4">Składniki</h2>
      {ingredients.length === 0 ? (
        <p className="text-muted-foreground">Brak składników</p>
      ) : (
        <ul className="list-disc list-inside space-y-2">
          {ingredients.map((ingredient) => (
            <li key={ingredient.id} className="text-base">
              {ingredient.content}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
