import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useMemo } from "react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";
import type { FieldArrayWithId, Control } from "react-hook-form";
import type { UpdateRecipeCommand } from "@/types";

/**
 * DraggableIngredientItem Component
 *
 * Individual ingredient item with drag-and-drop capability using dnd-kit.
 * Manages the draggable state and provides visual feedback during drag operations.
 *
 * @param field - The field object from useFieldArray
 * @param index - The current index in the ingredients array
 * @param control - React Hook Form control object
 * @param onRemove - Callback when ingredient is removed
 * @param isDisabledRemove - Whether remove button should be disabled
 */
interface DraggableIngredientItemProps {
  field: FieldArrayWithId<UpdateRecipeCommand, "ingredients", "id">;
  index: number;
  control: Control<UpdateRecipeCommand>;
  onRemove: () => void;
  isDisabledRemove: boolean;
}

export function DraggableIngredientItem({
  field,
  index,
  control,
  onRemove,
  isDisabledRemove,
}: DraggableIngredientItemProps) {
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
      className={`flex items-start gap-3 rounded-md transition-colors ${
        isOver ? "bg-accent/50" : ""
      } ${isDragging ? "opacity-50" : ""}`}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className="flex-shrink-0 mt-3 p-1 cursor-grab active:cursor-grabbing hover:text-primary transition-colors text-muted-foreground touch-none select-none"
        aria-label={`Drag to reorder ingredient ${index + 1}`}
        title="Drag to reorder"
        {...dragHandleAttrs}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Input Field */}
      <div className="flex-1">
        <FormField
          control={control}
          name={`ingredients.${index}.content`}
          render={({ field: inputField }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  placeholder={`Składnik ${index + 1}`}
                  autoComplete="off"
                  {...inputField}
                  disabled={isDragging}
                  className={isDragging ? "opacity-50" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleRemoveClick}
        className="flex-shrink-0 mt-2 flex items-center gap-2 text-destructive hover:text-destructive"
        disabled={isDisabledRemove}
        title={isDisabledRemove ? "Cannot remove the only ingredient" : "Remove ingredient"}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
