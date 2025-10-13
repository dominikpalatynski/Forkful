import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LoginSchemaType } from "@/lib/schemas/auth.schema";
import { queryClient } from "@/store/query";

/**
 * Authenticates a user with email and password credentials.
 * Calls the authentication service to sign in the user and establish a session.
 *
 * @param credentials - The user's email and password
 * @returns Promise that resolves on successful authentication
 * @throws Error if authentication fails
 */
async function loginUser(credentials: LoginSchemaType): Promise<void> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Login failed");
  }
}

/**
 * Custom hook for user login using React Query mutation.
 * Handles the login operation with toast notifications and navigation.
 *
 * @returns Object containing mutation function, loading state, error state, and success state
 *
 * @example
 * ```tsx
 * const loginMutation = useLogin();
 *
 * const onSubmit = (data: LoginSchemaType) => {
 *   loginMutation.mutate(data);
 * };
 *
 * if (loginMutation.isPending) return <div>Logging in...</div>;
 * ```
 */
export function useLogin() {
  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      window.location.href = "/recipes";
    },
    onError: (error: Error) => {
      toast.error(`Login failed: ${error.message}`);
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
