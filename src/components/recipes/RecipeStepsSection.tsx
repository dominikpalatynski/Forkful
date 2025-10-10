import type { RecipeStepsSectionProps } from "./types";

/**
 * RecipeStepsSection component displays a numbered list of recipe preparation steps.
 * Shows a message if no steps are available.
 *
 * @param steps - Array of step objects to display
 *
 * @example
 * ```tsx
 * <RecipeStepsSection
 *   steps={[
 *     { id: "1", content: "Preheat oven to 350°F", position: 1 },
 *     { id: "2", content: "Mix ingredients", position: 2 }
 *   ]}
 * />
 * ```
 */
export function RecipeStepsSection({ steps }: RecipeStepsSectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Kroki przygotowania</h2>
      {steps.length === 0 ? (
        <p className="text-muted-foreground">Brak kroków</p>
      ) : (
        <ol className="list-decimal list-inside space-y-3">
          {steps.map((step) => (
            <li key={step.id} className="text-base">
              {step.content}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
