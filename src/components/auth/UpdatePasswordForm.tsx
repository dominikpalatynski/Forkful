import { useForm } from "@/hooks/use-form";
import { UpdatePasswordSchema, type UpdatePasswordSchemaType } from "@/lib/schemas/auth.schema";
import { useUpdatePassword } from "./hooks/useUpdatePassword";
import { useVerifyResetToken } from "./hooks/useVerifyResetToken";
import { UpdatePasswordField } from "./form/UpdatePasswordField";
import { ConfirmPasswordField } from "./form/ConfirmPasswordField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect } from "react";

/**
 * Update password form container component.
 * Handles password update through the recovery flow with token verification.
 * Verifies reset token before showing the form and handles password update.
 */
export function UpdatePasswordForm() {
  const form = useForm({
    schema: UpdatePasswordSchema,
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate: updatePassword, isPending: isUpdatePending, error: updateError, isError: isUpdateError } = useUpdatePassword();
  const { mutate: verifyToken, isPending: isVerifyPending, error: verifyError, isError: isVerifyError, isSuccess: isVerifySuccess } = useVerifyResetToken();

  // Extract token from URL and verify it on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenHash = urlParams.get('token_hash');

    if (tokenHash && !isVerifyPending && !isVerifySuccess && !isVerifyError) {
      verifyToken(tokenHash);
    }
  }, [verifyToken, isVerifyPending, isVerifySuccess, isVerifyError]);

  const onSubmit = (data: UpdatePasswordSchemaType) => {
    if (isUpdatePending) return;
    updatePassword({
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  // Show loading state during token verification
  if (isVerifyPending) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Verifying reset link...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if token verification failed
  if (isVerifyError && verifyError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-900">Invalid Reset Link</CardTitle>
          <CardDescription className="text-red-700">
            {verifyError.message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <a
              href="/auth/forgot-password"
              className="text-primary hover:underline font-medium"
            >
              Request a new password reset link
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if password update failed
  if (isUpdateError && updateError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-900">Password Update Failed</CardTitle>
          <CardDescription className="text-red-700">
            {updateError.message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Don't render form until token is successfully verified
  if (!isVerifySuccess) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Update your password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <UpdatePasswordField control={form.control} />
            <ConfirmPasswordField control={form.control} />

            <Button
              type="submit"
              className="w-full"
              disabled={!form.formState.isDirty || isUpdatePending}
            >
              {isUpdatePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center space-y-2 mt-6">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <a
              href="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
