import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StateCardWithHeader } from "./StateCard";
import type { ReactNode } from "react";

interface ErrorStateProps {
  title: string;
  error: Error | null;
  onRetry?: () => void;
  retryLabel?: string;
  children?: ReactNode;
}

/**
 * Reusable error state component for auth flows.
 * Displays error information with optional retry action.
 *
 * @param title - Error title (e.g., "Invalid Reset Link")
 * @param error - Error object containing the message to display
 * @param onRetry - Optional callback for retry action
 * @param retryLabel - Optional custom label for retry button (defaults to "Try Again")
 * @param children - Optional custom content instead of retry button
 *
 * @example
 * ```tsx
 * // With retry button
 * <ErrorState
 *   title="Password Update Failed"
 *   error={error}
 *   onRetry={() => window.location.reload()}
 * />
 *
 * // With custom action
 * <ErrorState
 *   title="Invalid Reset Link"
 *   error={error}
 * >
 *   <a href="/auth/forgot-password">Request new link</a>
 * </ErrorState>
 * ```
 */
export function ErrorState({ title, error, onRetry, retryLabel = "Try Again", children }: ErrorStateProps) {
  return (
    <StateCardWithHeader
      icon={<AlertCircle className="h-6 w-6 text-red-600" />}
      title={title}
      description={error?.message}
      variant="error"
    >
      {children ? (
        <div className="text-center">{children}</div>
      ) : onRetry ? (
        <Button onClick={onRetry} className="w-full">
          {retryLabel}
        </Button>
      ) : null}
    </StateCardWithHeader>
  );
}
