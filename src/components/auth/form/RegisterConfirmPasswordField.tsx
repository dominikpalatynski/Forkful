import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Control } from "react-hook-form";
import type { RegisterSchemaType } from "@/lib/schemas/auth.schema";

interface RegisterConfirmPasswordFieldProps {
  control: Control<RegisterSchemaType>;
}

/**
 * Confirm password input field component for the registration form.
 * Follows the established form structure pattern with proper validation.
 */
export function RegisterConfirmPasswordField({ control }: RegisterConfirmPasswordFieldProps) {
  return (
    <FormField
      control={control}
      name="confirmPassword"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Potwierdź hasło *</FormLabel>
          <FormControl>
            <Input
              className="w-full"
              type="password"
              placeholder="Powtórz hasło"
              autoComplete="new-password"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
