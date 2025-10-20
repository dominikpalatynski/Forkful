import { useForm } from "@/hooks/use-form";
import { RegisterSchema, type RegisterSchemaType } from "@/lib/schemas/auth.schema";
import { useRegister } from "./hooks/useRegister";
import { RegisterEmailField } from "./form/RegisterEmailField";
import { RegisterPasswordField } from "./form/RegisterPasswordField";
import { RegisterConfirmPasswordField } from "./form/RegisterConfirmPasswordField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

/**
 * Registration form container component.
 * Handles user registration with email, password, and password confirmation.
 * Provides navigation links to login and password recovery.
 */
export function RegisterForm() {
  const form = useForm({
    schema: RegisterSchema,
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate: register, isPending, isSuccess, isError, error } = useRegister();

  const onSubmit = (data: RegisterSchemaType) => {
    if (isPending) return;
    register(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Utwórz konto</CardTitle>
        <CardDescription>Dołącz do Forkful i zacznij gotować</CardDescription>
      </CardHeader>

      <CardContent>
        {isSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Rejestracja zakończona pomyślnie!</p>
                <p className="text-green-700 mt-1">
                  Sprawdź swoją skrzynkę e-mail i kliknij w link weryfikacyjny, aby aktywować konto.
                </p>
              </div>
            </div>
          </div>
        )}

        {isError && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm">
              <p className="font-medium text-red-800">Rejestracja nie powiodła się</p>
              <p className="text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <RegisterEmailField control={form.control} />

            <RegisterPasswordField control={form.control} />

            <RegisterConfirmPasswordField control={form.control} />

            <Button type="submit" className="w-full" disabled={!form.formState.isDirty || isPending || isSuccess}>
              {isPending ? "Tworzenie konta..." : isSuccess ? "Konto utworzone" : "Załóż konto"}
            </Button>
          </form>
        </Form>

        <div className="text-center space-y-2 mt-6">
          <p className="text-sm text-muted-foreground">
            Masz już konto?{" "}
            <a href="/auth/login" className="text-primary hover:underline font-medium">
              Zaloguj się
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Zapomniałeś hasła?{" "}
            <a href="/auth/forgot-password" className="text-primary hover:underline font-medium">
              Resetuj hasło
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
