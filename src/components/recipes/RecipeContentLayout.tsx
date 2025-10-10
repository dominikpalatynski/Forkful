import { RecipeIngredientsSection } from "./RecipeIngredientsSection";
import { RecipeStepsSection } from "./RecipeStepsSection";
import type { RecipeContentLayoutProps } from "./types";

/**
 * RecipeContentLayout component provides a responsive layout for recipe ingredients
 * and preparation steps. Uses a 2-column grid on desktop (lg+) and single column on mobile.
 *
 * @param ingredients - Array of ingredients to display
 * @param steps - Array of preparation steps to display
 *
 * @example
 * ```tsx
 * <RecipeContentLayout
 *   ingredients={recipe.ingredients}
 *   steps={recipe.steps}
 * />
 * ```
 */
export function RecipeContentLayout({ ingredients, steps }: RecipeContentLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <RecipeIngredientsSection ingredients={ingredients} />
      <RecipeStepsSection steps={steps} />
    </div>
  );
}
