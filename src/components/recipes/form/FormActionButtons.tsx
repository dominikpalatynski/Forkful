import { Button } from "@/components/ui/button";
import type { FormActionButtonsProps } from "../types";

/**
 * FormActionButtons Component
 *
 * Renders action buttons for the recipe edit form.
 * Includes Cancel and Save buttons with appropriate states and styling.
 *
 * @param onCancel - Callback function called when cancel button is clicked
 * @param isSubmitting - Whether the form is currently being submitted
 * @param isDirty - Whether the form has been modified from its initial state
 */
export function FormActionButtons({ onCancel, isSubmitting, isDirty }: FormActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-4 pt-6 border-t">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="px-6">
        Anuluj
      </Button>

      <Button type="submit" disabled={!isDirty || isSubmitting} className="px-6">
        {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
      </Button>
    </div>
  );
}
