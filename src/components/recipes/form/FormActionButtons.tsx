import { Button } from "@/components/ui/button";
import type { FormActionButtonsProps } from "../types/form.types";

/**
 * FormActionButtons Component
 *
 * Renders action buttons for the recipe form (edit or create).
 * Includes Cancel and Save/Create buttons with appropriate states and styling.
 *
 * @param onCancel - Callback function called when cancel button is clicked
 * @param isSubmitting - Whether the form is currently being submitted
 * @param isDirty - Whether the form has been modified from its initial state
 * @param submitButtonText - Optional custom text for submit button (defaults to "Zapisz zmiany")
 */
export function FormActionButtons({ onCancel, isSubmitting, isDirty, submitButtonText = "Zapisz zmiany" }: FormActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-4 pt-6 border-t">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="px-6">
        Anuluj
      </Button>

      <Button type="submit" disabled={!isDirty || isSubmitting} className="px-6">
        {isSubmitting ? "Zapisywanie..." : submitButtonText}
      </Button>
    </div>
  );
}
