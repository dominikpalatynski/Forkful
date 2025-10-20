import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useMemo } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";
import type { FieldArrayWithId, Control } from "react-hook-form";
import type { CreateRecipeCommand } from "@/types";

/**
 * DraggableCreateStepItem Component
 *
 * Individual recipe step item with drag-and-drop capability for recipe creation.
 * Uses dnd-kit sortable functionality with CreateRecipeCommand type.
 *
 * @param field - The field object from useFieldArray
 * @param index - The current index in the steps array
 * @param control - React Hook Form control object
 * @param onRemove - Callback when step is removed
 * @param isDisabledRemove - Whether remove button should be disabled
 */
interface DraggableCreateStepItemProps {
  field: FieldArrayWithId<CreateRecipeCommand, "steps", "id">;
  index: number;
  control: Control<CreateRecipeCommand>;
  onRemove: () => void;
  isDisabledRemove: boolean;
}

export function DraggableCreateStepItem({
  field,
  index,
  control,
  onRemove,
  isDisabledRemove,
}: DraggableCreateStepItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: field.id,
  });

  // Compute the transform style for smooth animations
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }),
    [transform, transition, isDragging]
  );

  // Memoize the drag handle attributes to prevent unnecessary re-renders
  const dragHandleAttrs = useMemo(
    () => ({
      ...attributes,
      ...listeners,
    }),
    [attributes, listeners]
  );

  const handleRemoveClick = useCallback(() => {
    onRemove();
  }, [onRemove]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`space-y-2 rounded-md p-3 transition-colors ${
        isOver ? "bg-accent/50" : ""
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <button
            type="button"
            className="p-1 cursor-grab active:cursor-grabbing hover:text-primary transition-colors text-muted-foreground"
            aria-label={`Drag to reorder step ${index + 1}`}
            title="Drag to reorder"
            {...dragHandleAttrs}
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Step Label */}
          <FormLabel className="text-sm font-medium">Krok {index + 1}</FormLabel>
        </div>

        {/* Remove Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRemoveClick}
          className="flex items-center gap-2 text-destructive hover:text-destructive"
          disabled={isDisabledRemove}
          title={isDisabledRemove ? "Cannot remove the only step" : "Remove step"}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Textarea Field */}
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
                disabled={isDragging}
                {...textareaField}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
