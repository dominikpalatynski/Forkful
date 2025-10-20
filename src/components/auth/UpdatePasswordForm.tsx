import type { UpdatePasswordSchemaType } from "@/lib/schemas/auth.schema";
import { useUpdatePassword } from "./hooks/useUpdatePassword";
import { usePasswordResetToken } from "./hooks/usePasswordResetToken";
import { LoadingState } from "./states/LoadingState";
import { ErrorState } from "./states/ErrorState";
import { PasswordForm } from "./UpdatePasswordForm/PasswordForm";

/**
 * Update password form container component.
 * Handles password update through the recovery flow with token verification.
 * Orchestrates token verification, error handling, and form presentation.
 *
 * Refactored to follow separation of concerns:
 * - Token management: usePasswordResetToken hook
 * - Form presentation: PasswordForm component
 * - State rendering: LoadingState and ErrorState components
 * - Container logic: This component (routing between states)
 */
export function UpdatePasswordForm() {
  // Token verification state
  const tokenVerification = usePasswordResetToken();

  // Password update state
  const {
    mutate: updatePassword,
    isPending: isUpdatePending,
    error: updateError,
    isError: isUpdateError,
  } = useUpdatePassword();

  // Handle form submission
  const handleSubmit = (data: UpdatePasswordSchemaType) => {
    updatePassword({
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  // Show loading state during token verification
  if (tokenVerification.isPending) {
    return <LoadingState message="Verifying reset link..." />;
  }

  // Show error state if token verification failed
  if (tokenVerification.isError && tokenVerification.error) {
    return (
      <ErrorState title="Invalid Reset Link" error={tokenVerification.error}>
        <a href="/auth/forgot-password" className="text-primary hover:underline font-medium">
          Request a new password reset link
        </a>
      </ErrorState>
    );
  }

  // Show error state if password update failed
  if (isUpdateError && updateError) {
    return <ErrorState title="Password Update Failed" error={updateError} onRetry={() => window.location.reload()} />;
  }

  // Don't render form until token is successfully verified
  if (!tokenVerification.isSuccess) {
    return null;
  }

  // Render the password form
  return <PasswordForm onSubmit={handleSubmit} isPending={isUpdatePending} />;
}
