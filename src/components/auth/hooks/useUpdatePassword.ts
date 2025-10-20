import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/store/query";

/**
 * Updates the user's password using a valid reset token obtained through the password recovery flow.
 * Calls the authentication service to update the password.
 *
 * @param passwordData - The new password and confirmation
 * @returns Promise that resolves on successful password update
 * @throws Error if password update fails
 */
async function updatePassword(passwordData: { password: string; confirmPassword: string }): Promise<void> {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(passwordData),
  });

  if (!response.ok) {
    const errorData = await response.json();

    // Handle specific error cases
    if (response.status === 400) {
      if (errorData.message?.includes("Passwords do not match")) {
        throw new Error("Passwords do not match");
      }
      if (errorData.message?.includes("Password should be at least")) {
        throw new Error("Password does not meet requirements");
      }
      throw new Error("Invalid password format");
    }

    if (response.status === 401) {
      if (errorData.message?.includes("expired") || errorData.message?.includes("invalid")) {
        throw new Error("Your password reset link has expired or is invalid. Please request a new one.");
      }
      throw new Error("Authentication failed. Please try again.");
    }

    if (response.status === 500) {
      throw new Error("Server error occurred. Please try again.");
    }

    throw new Error(errorData.message || "Password update failed");
  }
}

/**
 * Custom hook for password update using React Query mutation.
 * Handles the password update operation with toast notifications and navigation.
 *
 * @returns Object containing mutation function, loading state, error state, and success state
 *
 * @example
 * ```tsx
 * const updatePasswordMutation = useUpdatePassword();
 *
 * const onSubmit = (data) => {
 *   updatePasswordMutation.mutate({ password: data.password, confirmPassword: data.confirmPassword });
 * };
 *
 * if (updatePasswordMutation.isPending) return <div>Updating password...</div>;
 * ```
 */
export function useUpdatePassword() {
  const mutation = useMutation(
    {
      mutationFn: updatePassword,
      onSuccess: () => {
        window.location.href = "/auth/login";
      },
    },
    queryClient
  );

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
