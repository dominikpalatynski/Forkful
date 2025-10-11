import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RecipeBasicInfoSectionProps } from "../types";

/**
 * RecipeBasicInfoSection Component
 *
 * Renders the basic information fields for recipe editing: name and description.
 * Uses FormField components to integrate with react-hook-form and provide proper validation.
 *
 * @param control - React Hook Form control object for managing form state
 */
export function RecipeBasicInfoSection({ control }: RecipeBasicInfoSectionProps) {
  return (
    <div className="space-y-6">
      {/* Recipe Name Field */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nazwa przepisu *</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="Wpisz nazwę przepisu"
                autoComplete="off"
                className="text-lg font-medium"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Recipe Description Field */}
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Opis</FormLabel>
            <FormControl>
              <Textarea placeholder="Dodaj opcjonalny opis przepisu" rows={4} className="resize-none" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
