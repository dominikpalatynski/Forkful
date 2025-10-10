import { SectionHeader } from "./SectionHeader";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function RecipeStepsSection({ steps }: RecipeStepsSectionProps) {
  return (
    <section>
      <SectionHeader>Kroki przygotowania</SectionHeader>
      {steps.length === 0 ? (
        <p className="text-muted-foreground">Brak kroków</p>
      ) : (
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <Card key={step.id}>
              <CardHeader className="text-xl flex flex-row items-center gap-2 py-2">
                <span className="flex-shrink-0 font-bold text-primary w-6 text-right">{idx + 1}.</span>
              </CardHeader>
              <CardContent className="py-4">
                <span>{step.content}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
