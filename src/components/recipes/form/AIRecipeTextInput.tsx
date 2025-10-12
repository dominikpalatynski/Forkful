import React from "react";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CharacterCounter } from "./CharacterCounter";
import type { AIRecipeTextInputProps } from "@/components/recipes/types";

const MIN_CHARS = 100;
const MAX_CHARS = 1000;

/**
 * Komponent fazy 'input' - pozwala użytkownikowi wprowadzić tekst i wygenerować przepis.
 *
 * Funkcjonalności:
 * - Textarea z autofokusem
 * - Licznik znaków z kolorowym feedbackiem
 * - Walidacja długości tekstu (100-1000 znaków)
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
    const charCount = value.length;
    const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;

    /**
     * Obsługuje kliknięcie przycisku "Generuj przepis".
     * Wywołuje onGenerate z aktualnym tekstem.
     */
    const handleGenerateClick = React.useCallback(() => {
      if (isValid && !isGenerating) {
        onGenerate(value.trim());
      }
    }, [value, isValid, isGenerating, onGenerate]);

    /**
     * Obsługuje zmianę wartości textarea.
     */
    const handleTextChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    return (
      <div className="space-y-6">
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
        <div className="space-y-2">
          <label htmlFor="recipe-input" className="text-sm font-medium">
            Opis przepisu
          </label>
          <Textarea
            id="recipe-input"
            value={value}
            onChange={handleTextChange}
            placeholder="Np. Makaron carbonara z boczkiem, śmietaną i parmezanem. Sos powinien być kremowy..."
            disabled={isGenerating}
            autoFocus
            className="min-h-[200px] resize-y"
            aria-describedby="char-counter"
            aria-invalid={!isValid && charCount > 0}
          />
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
        </div>

        {/* Przycisk Generuj */}
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleGenerateClick}
            disabled={!isValid || isGenerating}
            className="gap-2"
          >
            <Sparkles className="size-4" />
            {isGenerating ? "Generowanie..." : "Generuj przepis"}
          </Button>
        </div>
      </div>
    );
  }
);

AIRecipeTextInput.displayName = "AIRecipeTextInput";
