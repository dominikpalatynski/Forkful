import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { VerifiedUserDto } from "@/types";
import { queryClient } from "@/store/query";

/**
 * Verifies a password reset token hash received via email link.
 * Calls the authentication service to verify the OTP token.
 *
 * @param tokenHash - The token hash from the email link URL
 * @returns Promise that resolves with user data on successful verification
 * @throws Error if token verification fails
 */
async function verifyResetToken(tokenHash: string): Promise<VerifiedUserDto> {
  const response = await fetch("/api/auth/verify-reset-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token_hash: tokenHash }),
  });

  if (!response.ok) {
    const errorData = await response.json();

    // Handle specific error cases
    if (response.status === 400) {
      if (errorData.message?.includes("expired") || errorData.message?.includes("invalid")) {
        throw new Error("Link resetowania hasła wygasł lub jest nieprawidłowy. Poproś o nowy link.");
      }
      throw new Error("Nieprawidłowy link resetowania hasła.");
    }

    if (response.status === 500) {
      throw new Error("Wystąpił błąd serwera. Spróbuj ponownie.");
    }

    throw new Error(errorData.message || "Weryfikacja tokena nie powiodła się");
  }

  const data = await response.json();
  return data.user;
}

/**
 * Custom hook for password reset token verification using React Query mutation.
 * Handles the token verification operation with toast notifications and navigation.
 *
 * @returns Object containing mutation function, loading state, error state, and success state
 *
 * @example
 * ```tsx
 * const verifyTokenMutation = useVerifyResetToken();
 *
 * useEffect(() => {
 *   const tokenHash = new URLSearchParams(window.location.search).get('token_hash');
 *   if (tokenHash) {
 *     verifyTokenMutation.mutate(tokenHash);
 *   }
 * }, []);
 *
 * if (verifyTokenMutation.isPending) return <div>Weryfikowanie linku resetowania...</div>;
 * if (verifyTokenMutation.isSuccess) return <ResetPasswordForm user={verifyTokenMutation.data} />;
 * ```
 */
export function useVerifyResetToken() {
  const mutation = useMutation({
    mutationFn: verifyResetToken,
  }, queryClient);

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    data: mutation.data as VerifiedUserDto | undefined,
    reset: mutation.reset,
  } as const;
}
