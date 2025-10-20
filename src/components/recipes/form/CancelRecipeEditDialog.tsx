import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export interface CancelRecipeEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * CancelRecipeEditDialog component displays a confirmation dialog when user
 * tries to cancel editing a recipe with unsaved changes.
 *
 * @param isOpen - Controls dialog visibility
 * @param onOpenChange - Callback when dialog open state changes
 * @param onConfirm - Callback when user confirms cancellation
 */
export function CancelRecipeEditDialog({ isOpen, onOpenChange, onConfirm }: CancelRecipeEditDialogProps) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Odrzucić zmiany?"
      description="Masz niezapisane zmiany w przepisie. Czy na pewno chcesz wyjść bez zapisywania?"
      cancelButton={{
        text: "Powrót do edycji",
      }}
      actionButton={{
        text: "Odrzuć zmiany",
        onClick: onConfirm,
      }}
    />
  );
}
