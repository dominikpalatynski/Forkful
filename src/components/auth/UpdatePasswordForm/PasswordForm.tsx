import { useForm } from "@/hooks/use-form";
import { UpdatePasswordSchema, type UpdatePasswordSchemaType } from "@/lib/schemas/auth.schema";
import { UpdatePasswordField } from "../form/UpdatePasswordField";
import { ConfirmPasswordField } from "../form/ConfirmPasswordField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface PasswordFormProps {
  onSubmit: (data: UpdatePasswordSchemaType) => void;
  isPending: boolean;
}

/**
 * Password update form component.
 * Handles password input, validation, and submission.
 * Separated from the container to focus solely on form presentation and interaction.
 *
 * @param onSubmit - Callback function to handle form submission
 * @param isPending - Whether the submission is currently in progress
 *
 * @example
 * ```tsx
 * <PasswordForm
 *   onSubmit={(data) => updatePassword(data)}
 *   isPending={isUpdatePending}
 * />
 * ```
 */
export function PasswordForm({ onSubmit, isPending }: PasswordFormProps) {
  const form = useForm({
    schema: UpdatePasswordSchema,
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (data: UpdatePasswordSchemaType) => {
    if (isPending) return;
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Update your password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <UpdatePasswordField control={form.control} />
            <ConfirmPasswordField control={form.control} />

            <Button type="submit" className="w-full" disabled={!form.formState.isDirty || isPending}>
              {isPending ? (
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
            <a href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
