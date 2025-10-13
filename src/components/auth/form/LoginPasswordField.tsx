import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Control } from "react-hook-form";
import type { LoginSchemaType } from "@/lib/schemas/auth.schema";

interface LoginPasswordFieldProps {
  control: Control<LoginSchemaType>;
}

/**
 * Password input field component for the login form.
 * Follows the established form structure pattern with proper validation.
 */
export function LoginPasswordField({ control }: LoginPasswordFieldProps) {
  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Password *</FormLabel>
          <FormControl>
            <Input
              className="w-full"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
