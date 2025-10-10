import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DeleteRecipeDialogProps } from "./types";

/**
 * DeleteRecipeDialog component displays a confirmation modal for recipe deletion.
 * Uses shadcn/ui AlertDialog with warning message and action buttons.
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
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Potwierdź usunięcie</AlertDialogTitle>
          <AlertDialogDescription>
            Czy na pewno chcesz usunąć przepis &ldquo;{recipeName}&rdquo;? Ta akcja jest nieodwracalna.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isDeleting}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
