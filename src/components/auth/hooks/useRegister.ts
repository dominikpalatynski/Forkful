import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RegisterSchemaType } from "@/lib/schemas/auth.schema";
import { queryClient } from "@/store/query";

/**
 * Registers a new user with email and password credentials.
 * Calls the authentication service to create a new user account.
 *
 * @param credentials - The user's email, password, and password confirmation
 * @returns Promise that resolves on successful registration
 * @throws Error if registration fails
 */
async function registerUser(credentials: RegisterSchemaType): Promise<void> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Registration failed");
  }
}

/**
 * Custom hook for user registration using React Query mutation.
 * Handles the registration operation with toast notifications.
 *
 * @returns Object containing mutation function, loading state, error state, and success state
 *
 * @example
 * ```tsx
 * const registerMutation = useRegister();
 *
 * const onSubmit = (data: RegisterSchemaType) => {
 *   registerMutation.mutate(data);
 * };
 *
 * if (registerMutation.isPending) return <div>Registering...</div>;
 * ```
 */
export function useRegister() {
  const mutation = useMutation(
    {
      mutationFn: registerUser,
      onError: (error: Error) => {
        toast.error(`Rejestracja nie powiodła się: ${error.message}`);
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
