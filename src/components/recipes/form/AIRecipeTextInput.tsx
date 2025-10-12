import React from "react";
import { z } from "zod";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useForm } from "@/hooks/use-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { CharacterCounter } from "./CharacterCounter";
import type { AIRecipeTextInputProps } from "@/components/recipes/types";

const MIN_CHARS = 100;
const MAX_CHARS = 1000;

/**
 * Schemat walidacji dla input text.
 */
const inputTextSchema = z.object({
  inputText: z
    .string()
    .min(MIN_CHARS, `Tekst musi mieć minimum ${MIN_CHARS} znaków`)
    .max(MAX_CHARS, `Tekst może mieć maksymalnie ${MAX_CHARS} znaków`),
});

type InputTextFormData = z.infer<typeof inputTextSchema>;

/**
 * Komponent fazy 'input' - pozwala użytkownikowi wprowadzić tekst i wygenerować przepis.
 *
 * Funkcjonalności:
 * - Textarea z autofokusem
 * - Licznik znaków z kolorowym feedbackiem
 * - Walidacja długości tekstu (100-1000 znaków) przez react-hook-form + zod
 * - Przycisk "Generuj przepis" (wyłączony gdy tekst poza zakresem)
 * - Przycisk "Wróć" do nawigacji
 * - Disabled state podczas generowania
 *
 * @param props - Props zawierające value, onChange, onGenerate, isGenerating, onBack
 * @returns JSX Element z formularzem wprowadzania tekstu
 *
 * @example
 * ```tsx
 * <AIRecipeTextInput
 *   value={inputText}
 *   onChange={setInputText}
 *   onGenerate={handleGenerate}
 *   isGenerating={false}
 *   onBack={() => navigate('/')}
 * />
 * ```
 */
export const AIRecipeTextInput = React.memo<AIRecipeTextInputProps>(
  ({ value, onChange, onGenerate, isGenerating, onBack }) => {
    const form = useForm({
      schema: inputTextSchema,
      defaultValues: {
        inputText: value,
      },
      mode: "onChange",
    });

    const charCount = form.watch("inputText").length;
    const isValid = form.formState.isValid;

    /**
     * Handler submit formularza.
     */
    const handleSubmit = React.useCallback(
      (data: InputTextFormData) => {
        onGenerate(data.inputText.trim());
      },
      [onGenerate]
    );

    /**
     * Sync form value z parent onChange callback.
     */
    const handleFieldChange = React.useCallback(
      (value: string) => {
        onChange(value);
        return value;
      },
      [onChange]
    );

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Header z przyciskiem Wróć */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onBack}
              disabled={isGenerating}
              aria-label="Wróć do listy przepisów"
            >
              <ArrowLeft />
            </Button>
            <h1 className="text-2xl font-bold">Stwórz przepis z AI</h1>
          </div>

          {/* Instrukcja */}
          <p className="text-muted-foreground">
            Opisz przepis, który chcesz stworzyć. Możesz podać składniki, sposób przygotowania lub
            inne szczegóły. AI wygeneruje dla Ciebie kompletny przepis.
          </p>

          {/* Textarea z licznikiem */}
          <FormField
            control={form.control}
            name="inputText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opis przepisu</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange(e.target.value);
                    }}
                    placeholder="Np. Makaron carbonara z boczkiem, śmietaną i parmezanem. Sos powinien być kremowy..."
                    disabled={isGenerating}
                    autoFocus
                    className="min-h-[200px] resize-y"
                    aria-describedby="char-counter"
                  />
                </FormControl>
                <div className="flex items-center justify-between">
                  <div id="char-counter">
                    <CharacterCounter current={charCount} min={MIN_CHARS} max={MAX_CHARS} />
                  </div>
                  {charCount > 0 && charCount < MIN_CHARS && (
                    <p className="text-sm text-muted-foreground">
                      Minimum {MIN_CHARS - charCount} znaków
                    </p>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Przycisk Generuj */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isValid || isGenerating}
              className="gap-2"
            >
              <Sparkles className="size-4" />
              {isGenerating ? "Generowanie..." : "Generuj przepis"}
            </Button>
          </div>
        </form>
      </Form>
    );
  }
);

AIRecipeTextInput.displayName = "AIRecipeTextInput";
