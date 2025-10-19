import { useEffect } from "react";
import { useVerifyResetToken } from "./useVerifyResetToken";

/**
 * Custom hook that manages password reset token verification flow.
 * Automatically extracts token from URL query params and triggers verification.
 *
 * This hook encapsulates the token extraction, verification triggering, and state management
 * to reduce complexity in the component that uses it.
 *
 * @returns Object containing verification state (isPending, isSuccess, isError, error)
 *
 * @example
 * ```tsx
 * function UpdatePasswordForm() {
 *   const tokenVerification = usePasswordResetToken();
 *
 *   if (tokenVerification.isPending) return <LoadingState />;
 *   if (tokenVerification.isError) return <ErrorState error={tokenVerification.error} />;
 *   if (!tokenVerification.isSuccess) return null;
 *
 *   return <PasswordForm />;
 * }
 * ```
 */
export function usePasswordResetToken() {
  const {
    mutate: verifyToken,
    isPending,
    isSuccess,
    isError,
    error
  } = useVerifyResetToken();

  // Extract token from URL and verify it on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenHash = urlParams.get('token_hash');

    // Only verify if we have a token and haven't already started/completed verification
    if (tokenHash && !isPending && !isSuccess && !isError) {
      verifyToken(tokenHash);
    }
  }, [verifyToken, isPending, isSuccess, isError]);

  return {
    isPending,
    isSuccess,
    isError,
    error,
  } as const;
}
