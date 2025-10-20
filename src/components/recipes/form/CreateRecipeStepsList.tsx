import { useCallback, useMemo } from "react";
import { useFieldArray } from "react-hook-form";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EditableSectionHeader } from "./EditableSectionHeader";
import { DraggableCreateStepItem } from "./DraggableCreateStepItem";
import type { CreateRecipeStepsListProps } from "../types/form.types";

/**
 * CreateRecipeStepsList Component
 *
 * Manages a dynamic list of recipe preparation steps with add/remove and drag-to-reorder functionality for new recipe creation.
 * Uses useFieldArray from react-hook-form to handle array operations and dnd-kit for drag-and-drop.
 * Each step uses a Textarea for longer text content.
 *
 * @param control - React Hook Form control object for managing form state (CreateRecipeCommand)
 */
export function CreateRecipeStepsList({ control }: CreateRecipeStepsListProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps",
  });

  // Configure sensors for drag interactions (mouse + keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag is triggered
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Memoize the step IDs for the SortableContext
  const stepIds = useMemo(() => fields.map((f) => f.id), [fields]);

  /**
   * Handles the end of a drag operation.
   * Reorders the steps in the form state and recalculates positions.
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // If dropped over nothing or same position, do nothing
      if (!over || active.id === over.id) {
        return;
      }

      // Find the indices of the active and over items
      const activeIndex = fields.findIndex((f) => f.id === active.id);
      const overIndex = fields.findIndex((f) => f.id === over.id);

      if (activeIndex === -1 || overIndex === -1) {
        return;
      }

      // Reorder the fields in the form state
      move(activeIndex, overIndex);

      // Note: Positions will be recalculated on form submit based on new order
      // This ensures consistency with the server-side validation
    },
    [fields, move]
  );

  const handleAddStep = useCallback(() => {
    append({ content: "", position: fields.length + 1 });
  }, [fields.length, append]);

  const handleRemoveStep = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove]
  );

  const isRemoveDisabled = fields.length === 1;

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

      {fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Brak kroków. Dodaj pierwszy krok przygotowania.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <DraggableCreateStepItem
                  key={field.id}
                  field={field}
                  index={index}
                  control={control}
                  onRemove={() => handleRemoveStep(index)}
                  isDisabledRemove={isRemoveDisabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
