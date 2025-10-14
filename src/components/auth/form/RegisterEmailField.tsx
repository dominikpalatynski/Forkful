import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Control } from "react-hook-form";
import type { RegisterSchemaType } from "@/lib/schemas/auth.schema";

interface RegisterEmailFieldProps {
  control: Control<RegisterSchemaType>;
}

/**
 * Email input field component for the registration form.
 * Follows the established form structure pattern with proper validation.
 */
export function RegisterEmailField({ control }: RegisterEmailFieldProps) {
  return (
    <FormField
      control={control}
      name="email"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Email *</FormLabel>
          <FormControl>
            <Input
              className="w-full"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

