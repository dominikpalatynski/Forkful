import { useState, useCallback } from "react";

export interface DialogState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Custom hook for managing confirmation dialog states.
 * Provides a clean API for opening/closing multiple dialogs.
 */
export function useConfirmationDialogs() {
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [isBackToTextOpen, setIsBackToTextOpen] = useState(false);

  const confirmCancel = {
    isOpen: isConfirmCancelOpen,
    open: useCallback(() => setIsConfirmCancelOpen(true), []),
    close: useCallback(() => setIsConfirmCancelOpen(false), []),
    toggle: useCallback(() => setIsConfirmCancelOpen((prev) => !prev), []),
  };

  const backToText = {
    isOpen: isBackToTextOpen,
    open: useCallback(() => setIsBackToTextOpen(true), []),
    close: useCallback(() => setIsBackToTextOpen(false), []),
    toggle: useCallback(() => setIsBackToTextOpen((prev) => !prev), []),
  };

  return {
    confirmCancel,
    backToText,
  };
}
