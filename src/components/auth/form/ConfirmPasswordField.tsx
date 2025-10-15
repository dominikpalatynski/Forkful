import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Control } from "react-hook-form";
import type { UpdatePasswordSchemaType } from "@/lib/schemas/auth.schema";

interface ConfirmPasswordFieldProps {
  control: Control<UpdatePasswordSchemaType>;
}

/**
 * Password confirmation input field component for the update password form.
 * Follows the established form structure pattern with proper validation.
 */
export function ConfirmPasswordField({ control }: ConfirmPasswordFieldProps) {
  return (
    <FormField
      control={control}
      name="confirmPassword"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Confirm New Password *</FormLabel>
          <FormControl>
            <Input
              className="w-full"
              type="password"
              placeholder="Confirm your new password"
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

