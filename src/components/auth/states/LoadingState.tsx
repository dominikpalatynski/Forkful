import { Loader2 } from "lucide-react";
import { StateCard } from "./StateCard";

interface LoadingStateProps {
  message?: string;
}

/**
 * Reusable loading state component for auth flows.
 * Displays a spinner with customizable message.
 *
 * @param message - Optional loading message (defaults to "Loading...")
 *
 * @example
 * ```tsx
 * // Default message
 * <LoadingState />
 *
 * // Custom message
 * <LoadingState message="Verifying reset link..." />
 * ```
 */
export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <StateCard>
      <div className="flex items-center justify-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </StateCard>
  );
}
