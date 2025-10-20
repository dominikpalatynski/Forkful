import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import type { Control } from "react-hook-form";
import type { UpdatePasswordSchemaType } from "@/lib/schemas/auth.schema";
import { useState } from "react";

interface UpdatePasswordFieldProps {
  control: Control<UpdatePasswordSchemaType>;
}

/**
 * Password input field component for the update password form.
 * Includes show/hide password toggle functionality for better UX.
 * Follows the established form structure pattern with proper validation.
 */
export function UpdatePasswordField({ control }: UpdatePasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>New Password *</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                className="w-full pr-10"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                autoComplete="new-password"
                {...field}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
