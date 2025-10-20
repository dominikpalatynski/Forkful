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

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  cancelButton?: {
    text?: string;
    onClick?: () => void;
    disabled?: boolean;
  };
  actionButton: {
    text: string;
    loadingText?: string;
    onClick: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  };
}

/**
 * ConfirmationDialog component provides a reusable confirmation dialog using shadcn/ui AlertDialog.
 * Supports customizable title, description, and button configurations for various confirmation scenarios.
 *
 * @param isOpen - Controls dialog visibility
 * @param onOpenChange - Callback when dialog open state changes
 * @param title - Dialog title text
 * @param description - Dialog description (string or React node)
 * @param cancelButton - Configuration for cancel button (optional)
 * @param actionButton - Configuration for action button (required)
 *
 * @example
 * ```tsx
 * <ConfirmationDialog
 *   isOpen={isDialogOpen}
 *   onOpenChange={setIsDialogOpen}
 *   title="Delete Recipe"
 *   description="Are you sure you want to delete this recipe?"
 *   cancelButton={{ text: "Cancel" }}
 *   actionButton={{
 *     text: "Delete",
 *     loadingText: "Deleting...",
 *     onClick: handleDelete,
 *     isLoading: isDeleting
 *   }}
 * />
 * ```
 */
export function ConfirmationDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  cancelButton = { text: "Cancel" },
  actionButton,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelButton.onClick} disabled={cancelButton.disabled}>
            {cancelButton.text || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction onClick={actionButton.onClick} disabled={actionButton.disabled || actionButton.isLoading}>
            {actionButton.isLoading ? actionButton.loadingText || actionButton.text : actionButton.text}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
