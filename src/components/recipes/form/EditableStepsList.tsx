import { useFieldArray } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EditableSectionHeader } from "./EditableSectionHeader";
import { Trash2, Plus } from "lucide-react";
import type { EditableStepsListProps } from "../types";

/**
 * EditableStepsList Component
 *
 * Manages a dynamic list of recipe preparation steps with add/remove functionality.
 * Uses useFieldArray from react-hook-form to handle array operations.
 * Each step uses a Textarea for longer text content.
 *
 * @param control - React Hook Form control object for managing form state
 */
export function EditableStepsList({ control }: EditableStepsListProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps",
  });

  const handleAddStep = () => {
    append({ content: "", position: 0 }); // Position will be recalculated on submit
  };

  const handleRemoveStep = (index: number) => {
    remove(index);
  };

  return (
    <div className="space-y-4">
      <EditableSectionHeader
        title="Kroki przygotowania"
        action={
          <Button type="button" variant="outline" size="sm" onClick={handleAddStep} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Dodaj krok
          </Button>
        }
      />

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel className="text-sm font-medium">Krok {index + 1}</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRemoveStep(index)}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
                disabled={fields.length === 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <FormField
              control={control}
              name={`steps.${index}.content`}
              render={({ field: textareaField }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={`Opisz krok ${index + 1} przygotowania...`}
                      rows={3}
                      className="resize-none"
                      {...textareaField}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Brak kroków. Dodaj pierwszy krok przygotowania.</p>
        </div>
      )}
    </div>
  );
}
