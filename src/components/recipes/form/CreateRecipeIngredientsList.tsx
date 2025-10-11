import { useFieldArray } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EditableSectionHeader } from "./EditableSectionHeader";
import { Trash2, Plus } from "lucide-react";
import type { CreateRecipeIngredientsListProps } from "../types";

/**
 * CreateRecipeIngredientsList Component
 *
 * Manages a dynamic list of recipe ingredients with add/remove functionality for new recipe creation.
 * Uses useFieldArray from react-hook-form to handle array operations.
 * This is a separate component from EditableIngredientsList because it uses CreateRecipeCommand
 * type instead of UpdateRecipeCommand.
 *
 * @param control - React Hook Form control object for managing form state (CreateRecipeCommand)
 */
export function CreateRecipeIngredientsList({ control }: CreateRecipeIngredientsListProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const handleAddIngredient = () => {
    append({ content: " ", position: fields.length + 1 });
  };

  const handleRemoveIngredient = (index: number) => {
    remove(index);
  };

  return (
    <div className="space-y-4">
      <EditableSectionHeader
        title="Składniki"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddIngredient}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Dodaj składnik
          </Button>
        }
      />

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-3">
            <div className="flex-1">
              <FormField
                control={control}
                name={`ingredients.${index}.content`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="text" placeholder={`Składnik ${index + 1}`} autoComplete="off" {...inputField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRemoveIngredient(index)}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
              disabled={fields.length === 1}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Brak składników. Dodaj pierwszy składnik, aby rozpocząć.</p>
        </div>
      )}
    </div>
  );
}
