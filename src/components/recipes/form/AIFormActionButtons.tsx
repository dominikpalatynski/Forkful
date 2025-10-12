import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AIFormActionButtonsProps } from "../types";

/**
 * AIFormActionButtons Component
 *
 * Renderuje przyciski akcji specyficzne dla AI Recipe Form w fazie edycji.
 * Zawiera trzy przyciski:
 * - "Wróć do edycji tekstu" - powrót do fazy 'input'
 * - "Anuluj" - anulowanie całego procesu
 * - "Zapisz przepis" - submit formularza
 *
 * @param onBackToTextEdit - Callback wywoływany po kliknięciu "Wróć do edycji tekstu"
 * @param onCancel - Callback wywoływany po kliknięciu "Anuluj"
 * @param isSubmitting - Czy formularz jest w trakcie wysyłania
 * @param isDirty - Czy formularz został zmodyfikowany
 *
 * @example
 * ```tsx
 * <AIFormActionButtons
 *   onBackToTextEdit={() => store.goBackToInput()}
 *   onCancel={() => navigate('/')}
 *   isSubmitting={mutation.isPending}
 *   isDirty={formState.isDirty}
 * />
 * ```
 */
export function AIFormActionButtons({
  onBackToTextEdit,
  onCancel,
  isSubmitting
}: AIFormActionButtonsProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t">
      {/* Przycisk po lewej stronie */}
      <Button
        type="button"
        variant="ghost"
        onClick={onBackToTextEdit}
        disabled={isSubmitting}
        className="gap-2"
      >
        <ArrowLeft className="size-4" />
        Wróć do edycji tekstu
      </Button>

      {/* Przyciski po prawej stronie */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6"
        >
          Anuluj
        </Button>

        <Button type="submit" disabled={isSubmitting} className="px-6">
          {isSubmitting ? "Zapisywanie..." : "Zapisz przepis"}
        </Button>
      </div>
    </div>
  );
}
