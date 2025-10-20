import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient } from "@/store/query";

/**
 * Signs out the current user and clears the session.
 * Calls the authentication API to terminate the user session.
 *
 * @returns Promise that resolves on successful logout
 * @throws Error if logout operation fails
 */
async function logoutUser(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Logout failed");
  }
}

/**
 * Custom hook for user logout using React Query mutation.
 * Handles the logout operation with toast notifications and navigation.
 *
 * @returns Object containing mutation function, loading state, error state, and success state
 *
 * @example
 * ```tsx
 * const logoutMutation = useLogout();
 *
 * const handleLogout = () => {
 *   logoutMutation.mutate();
 * };
 *
 * if (logoutMutation.isPending) return <div>Logging out...</div>;
 * ```
 */
export function useLogout() {
  const mutation = useMutation(
    {
      mutationFn: logoutUser,
      onSuccess: () => {
        window.location.href = "/auth/login";
      },
      onError: (error: Error) => {
        toast.error(`Logout failed: ${error.message}`);
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
