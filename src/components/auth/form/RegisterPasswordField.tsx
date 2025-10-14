import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Control } from "react-hook-form";
import type { RegisterSchemaType } from "@/lib/schemas/auth.schema";

interface RegisterPasswordFieldProps {
  control: Control<RegisterSchemaType>;
}

/**
 * Password input field component for the registration form.
 * Follows the established form structure pattern with proper validation.
 */
export function RegisterPasswordField({ control }: RegisterPasswordFieldProps) {
  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Hasło *</FormLabel>
          <FormControl>
            <Input
              className="w-full"
              type="password"
              placeholder="Minimum 8 znaków"
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

