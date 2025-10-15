import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ForgotPasswordSchemaType } from "@/lib/schemas/auth.schema";
import { queryClient } from "@/store/query";

/**
 * Initiates the password reset process by sending a reset link to the user's email.
 * Calls the authentication service to send a password reset email.
 *
 * @param emailData - The user's email address
 * @returns Promise that resolves when reset email is sent (or would be sent)
 * @throws Error if the password reset request fails
 */
async function forgotPassword(emailData: ForgotPasswordSchemaType): Promise<void> {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Password reset request failed");
  }
}

/**
 * Custom hook for password reset using React Query mutation.
 * Handles the forgot password operation with toast notifications.
 *
 * @returns Object containing mutation function, loading state, error state, and success state
 *
 * @example
 * ```tsx
 * const forgotPasswordMutation = useForgotPassword();
 *
 * const onSubmit = (data: ForgotPasswordSchemaType) => {
 *   forgotPasswordMutation.mutate(data);
 * };
 *
 * if (forgotPasswordMutation.isPending) return <div>Sending reset email...</div>;
 * ```
 */
export function useForgotPassword() {
  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      toast.success("If an account with that email exists, we've sent you a password reset link.");
    },
    onError: (error: Error) => {
      toast.error(`Password reset request failed: ${error.message}`);
    },
  }, queryClient);

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  } as const;
}
