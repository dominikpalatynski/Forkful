import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Control } from "react-hook-form";
import type { ForgotPasswordSchemaType } from "@/lib/schemas/auth.schema";

interface ForgotPasswordEmailFieldProps {
  control: Control<ForgotPasswordSchemaType>;
}

/**
 * Email input field component for the forgot password form.
 * Follows the established form structure pattern with proper validation.
 */
export function ForgotPasswordEmailField({ control }: ForgotPasswordEmailFieldProps) {
  return (
    <FormField
      control={control}
      name="email"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Email *</FormLabel>
          <FormControl>
            <Input className="w-full" type="email" placeholder="your@email.com" autoComplete="email" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
