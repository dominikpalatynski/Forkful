import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateRecipeBasicInfoSectionProps } from "../types/form.types";

/**
 * CreateRecipeBasicInfoSection Component
 *
 * Renders the basic information fields for recipe creation: name and description.
 * Uses FormField components to integrate with react-hook-form and provide proper validation.
 * This is a separate component from RecipeBasicInfoSection because it uses CreateRecipeCommand
 * type instead of UpdateRecipeCommand.
 *
 * @param control - React Hook Form control object for managing form state (CreateRecipeCommand)
 */
export function CreateRecipeBasicInfoSection({ control }: CreateRecipeBasicInfoSectionProps) {
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
                data-testid="recipe-input-name"
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
              <Textarea
                placeholder="Dodaj opcjonalny opis przepisu"
                rows={4}
                className="resize-none"
                {...field}
                value={field.value ?? ""}
                data-testid="recipe-input-description"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
