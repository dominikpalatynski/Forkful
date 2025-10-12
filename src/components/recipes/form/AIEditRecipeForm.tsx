import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { CreateRecipeBasicInfoSection } from "./CreateRecipeBasicInfoSection";
import { CreateRecipeIngredientsList } from "./CreateRecipeIngredientsList";
import { CreateRecipeStepsList } from "./CreateRecipeStepsList";
import { CreateRecipeTagInput } from "./CreateRecipeTagInput";
import { AIFormActionButtons } from "./AIFormActionButtons";
import { useTags } from "../hooks/useTags";
import type { AIEditRecipeFormProps } from "../types";
import type { CreateRecipeCommand } from "@/types";

/**
 * Schemat walidacji dla formularza tworzenia przepisu z AI.
 * Zgodny z CreateRecipeCommand ale z dodatkowymi regułami walidacji.
 */
const createRecipeSchema = z.object({
  name: z.string().min(1, "Nazwa przepisu jest wymagana").max(255, "Nazwa jest zbyt długa"),
  description: z.string().optional(),
  generationId: z.string().optional(),
  ingredients: z
    .array(
      z.object({
        content: z.string().min(1, "Składnik nie może być pusty"),
        position: z.number(),
      })
    )
    .optional(),
  steps: z
    .array(
      z.object({
        content: z.string().min(1, "Krok nie może być pusty"),
        position: z.number(),
      })
    )
    .optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * AIEditRecipeForm Component
 *
 * Komponent fazy 'edit' - pozwala użytkownikowi edytować dane wygenerowane przez AI
 * przed zapisaniem przepisu do bazy danych.
 *
 * Funkcjonalności:
 * - Reużycie komponentów z manual creation (CreateRecipeBasicInfoSection, etc.)
 * - Integracja z react-hook-form + zod validation
 * - Inicjalizacja formularza danymi z GeneratedRecipeDto
 * - Automatyczne dodanie generationId do submit data
 * - Trzy akcje: submit, powrót do edycji tekstu, anulowanie
 *
 * @param initialData - Dane wygenerowane przez AI (GeneratedRecipeDto)
 * @param generationId - ID generacji do zapisania w przepisie
 * @param onSubmit - Callback wywoływany po submit z CreateRecipeCommand
 * @param onBackToTextEdit - Callback do powrotu do fazy 'input'
 * @param onCancel - Callback do anulowania całego procesu
 * @param isSubmitting - Czy formularz jest w trakcie wysyłania
 *
 * @example
 * ```tsx
 * <AIEditRecipeForm
 *   initialData={generatedData}
 *   generationId={generationId}
 *   onSubmit={handleSubmit}
 *   onBackToTextEdit={() => store.goBackToInput()}
 *   onCancel={() => navigate('/')}
 *   isSubmitting={mutation.isPending}
 * />
 * ```
 */
export function AIEditRecipeForm({
  initialData,
  generationId,
  onSubmit,
  onBackToTextEdit,
  onCancel,
  isSubmitting,
}: AIEditRecipeFormProps) {
  /**
   * Transformuje GeneratedRecipeDto do formatu dla react-hook-form.
   * Mapuje dane wejściowe na wartości domyślne formularza.
   */
  const getDefaultValues = React.useCallback((): CreateRecipeCommand => {
    return {
      name: initialData.name,
      description: initialData.description ?? undefined,
      generationId,
      ingredients: initialData.ingredients || [],
      steps: initialData.steps || [],
      tags: [],
    };
  }, [initialData, generationId]);

  /**
   * Inicjalizacja formularza z react-hook-form.
   */
  const form = useForm<CreateRecipeCommand>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  /**
   * Pobieranie sugestii tagów dla autocomplete.
   */
  const { tags: allTags } = useTags();
  const tagSuggestions = React.useMemo(() => allTags.map((tag) => tag.name), [allTags]);

  /**
   * Handler submit formularza.
   * Dodaje generationId do danych przed wywołaniem onSubmit.
   */
  const handleSubmit = React.useCallback(
    (data: CreateRecipeCommand) => {
      const dataWithGenerationId: CreateRecipeCommand = {
        ...data,
        generationId,
      };
      onSubmit(dataWithGenerationId);
    },
    [generationId, onSubmit]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Edytuj wygenerowany przepis</h1>
          <p className="text-muted-foreground mt-2">
            Możesz edytować wygenerowane dane przed zapisaniem przepisu.
          </p>
        </div>

        {/* Basic Info (name, description) */}
        <CreateRecipeBasicInfoSection control={form.control} />

        {/* Ingredients */}
        <CreateRecipeIngredientsList control={form.control} />

        {/* Steps */}
        <CreateRecipeStepsList control={form.control} />

        {/* Tags */}
        <CreateRecipeTagInput control={form.control} suggestions={tagSuggestions} />

        {/* Action Buttons */}
        <AIFormActionButtons
          onBackToTextEdit={onBackToTextEdit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
        />
      </form>
    </Form>
  );
}
