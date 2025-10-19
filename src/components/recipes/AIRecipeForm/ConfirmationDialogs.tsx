import React from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { DialogState } from "./useConfirmationDialogs";

export interface ConfirmationDialogsProps {
  phase: "input" | "edit";
  confirmCancelDialog: DialogState;
  backToTextDialog: DialogState;
  onConfirmCancel: () => void;
  onConfirmBackToText: () => void;
}

/**
 * ConfirmationDialogs Component
 *
 * Centralized component for managing all confirmation dialogs
 * in the AI Recipe Form. Renders different dialogs based on
 * the current phase.
 */
export function ConfirmationDialogs({
  phase,
  confirmCancelDialog,
  backToTextDialog,
  onConfirmCancel,
  onConfirmBackToText,
}: ConfirmationDialogsProps) {
  return (
    <>
      {/* Cancel confirmation dialog - shown in both phases but with different messages */}
      <ConfirmationDialog
        isOpen={confirmCancelDialog.isOpen}
        onOpenChange={(open) => {
          if (open) {
            confirmCancelDialog.open();
          } else {
            confirmCancelDialog.close();
          }
        }}
        title="Odrzucić wprowadzone dane?"
        description={
          phase === "input"
            ? "Masz wprowadzony tekst. Czy na pewno chcesz wyjść bez generowania przepisu?"
            : "Masz wygenerowany przepis. Czy na pewno chcesz wyjść bez zapisywania?"
        }
        cancelButton={{
          text: "Powrót",
        }}
        actionButton={{
          text: "Odrzuć dane",
          onClick: onConfirmCancel,
        }}
      />

      {/* Back to text edit dialog - only shown in edit phase */}
      {phase === "edit" && (
        <ConfirmationDialog
          isOpen={backToTextDialog.isOpen}
          onOpenChange={(open) => {
            if (open) {
              backToTextDialog.open();
            } else {
              backToTextDialog.close();
            }
          }}
          title="Wrócić do edycji tekstu?"
          description="Powrót do edycji tekstu spowoduje porzucenie wygenerowanego przepisu. Będziesz musiał wygenerować przepis ponownie."
          cancelButton={{
            text: "Anuluj",
          }}
          actionButton={{
            text: "Wróć do tekstu",
            onClick: onConfirmBackToText,
          }}
        />
      )}
    </>
  );
}
