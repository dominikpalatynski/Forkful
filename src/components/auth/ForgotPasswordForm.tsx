import { useForm } from "@/hooks/use-form";
import { ForgotPasswordSchema, type ForgotPasswordSchemaType } from "@/lib/schemas/auth.schema";
import { useForgotPassword } from "./hooks/useForgotPassword";
import { ForgotPasswordEmailField } from "./form/ForgotPasswordEmailField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Forgot password form container component.
 * Handles password reset request with email input.
 * Provides navigation links back to login and registration.
 */
export function ForgotPasswordForm() {
  const form = useForm({
    schema: ForgotPasswordSchema,
    defaultValues: {
      email: "",
    },
  });

  const { mutate: forgotPassword, isPending, error, isError } = useForgotPassword();

  const onSubmit = (data: ForgotPasswordSchemaType) => {
    if (isPending) return;
    forgotPassword(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isError && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm">
              <p className="font-medium text-red-800">Reset request failed</p>
              <p className="text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ForgotPasswordEmailField control={form.control} />

            <Button type="submit" className="w-full" disabled={!form.formState.isDirty || isPending}>
              {isPending ? "Sending reset link..." : "Send reset link"}
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
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/auth/register" className="text-primary hover:underline font-medium">
              Sign up
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
