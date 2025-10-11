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
              <CardHeader className="text-xl  ">
                <span className="font-bold text-primary">
                  {`Krok ${idx + 1}`}
                </span>
              </CardHeader>
              <CardContent className="py-4">
                <h3 className="text-lg font-semibold mb-2">Opis</h3>
                <span>{step.content}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
