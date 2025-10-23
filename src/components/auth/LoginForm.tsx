import { useForm } from "@/hooks/use-form";
import { LoginSchema, type LoginSchemaType } from "@/lib/schemas/auth.schema";
import { useLogin } from "./hooks/useLogin";
import { LoginEmailField } from "./form/LoginEmailField";
import { LoginPasswordField } from "./form/LoginPasswordField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Login form container component.
 * Handles user authentication with email and password.
 * Provides navigation links to registration and password recovery.
 */
export function LoginForm() {
  const form = useForm({
    schema: LoginSchema,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: login, isPending, error, isError } = useLogin();

  const onSubmit = (data: LoginSchemaType) => {
    if (isPending) return;
    login(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>

      <CardContent>
        {isError && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm">
              <p className="font-medium text-red-800">Login failed</p>
              <p className="text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <LoginEmailField control={form.control} />

            <LoginPasswordField control={form.control} />

            <Button
              type="submit"
              className="w-full"
              disabled={!form.formState.isDirty || isPending}
              data-testid="auth-submit-button"
            >
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>

        <div className="text-center space-y-2 mt-6">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/auth/register" className="text-primary hover:underline font-medium">
              Sign up
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Forgot your password?{" "}
            <a href="/auth/forgot-password" className="text-primary hover:underline font-medium">
              Reset password
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
