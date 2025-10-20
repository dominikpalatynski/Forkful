import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { DeleteRecipeDialogProps } from "./types/detail.types";

/**
 * DeleteRecipeDialog component displays a confirmation modal for recipe deletion.
 * Uses the reusable ConfirmationDialog component with warning message and action buttons.
 *
 * @param isOpen - Controls dialog visibility
 * @param onClose - Callback to close the dialog without action
 * @param onConfirm - Async callback to confirm deletion
 * @param recipeName - Name of recipe to display in warning message
 * @param isDeleting - Loading state during deletion operation
 *
 * @example
 * ```tsx
 * <DeleteRecipeDialog
 *   isOpen={isDialogOpen}
 *   onClose={closeDialog}
 *   onConfirm={handleDeleteConfirm}
 *   recipeName="Chocolate Cake"
 *   isDeleting={isDeleting}
 * />
 * ```
 */
export function DeleteRecipeDialog({ isOpen, onClose, onConfirm, recipeName, isDeleting }: DeleteRecipeDialogProps) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onOpenChange={onClose}
      title="Potwierdź usunięcie"
      description={`Czy na pewno chcesz usunąć przepis "${recipeName}"? Ta akcja jest nieodwracalna.`}
      cancelButton={{
        text: "Anuluj",
        onClick: onClose,
        disabled: isDeleting,
      }}
      actionButton={{
        text: "Usuń",
        loadingText: "Usuwanie...",
        onClick: onConfirm,
        disabled: isDeleting,
        isLoading: isDeleting,
      }}
    />
  );
}
