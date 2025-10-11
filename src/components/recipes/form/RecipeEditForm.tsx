import { useState } from "react";
import { Form } from "@/components/ui/form";
import { useForm as useCustomForm } from "@/hooks/use-form";
import { UpdateRecipeSchema } from "@/lib/schemas/recipe.schema";
import type { UpdateRecipeCommand } from "@/types";
import { useUpdateRecipe } from "../hooks/useUpdateRecipe";
import { RecipeBasicInfoSection } from "./RecipeBasicInfoSection";
import { EditableIngredientsList } from "./EditableIngredientsList";
import { EditableStepsList } from "./EditableStepsList";
import { TagInput } from "./TagInput";
import { FormActionButtons } from "./FormActionButtons";
import type { RecipeEditFormProps } from "../types";
import { Separator } from "@/components/ui/separator";
import { CancelRecipeEditDialog } from "./CancelRecipeEditDialog";
/**
 * RecipeEditForm Component
 *
 * Main form component for editing recipes. Manages form state using react-hook-form,
 * coordinates all form sections, and handles submission with position recalculation.
 *
 * @param initialData - The initial recipe data to populate the form
 * @param recipeId - The ID of the recipe being edited
 */
export function RecipeEditForm({ initialData, recipeId }: RecipeEditFormProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Initialize form with custom useForm hook that integrates zodResolver
  const form = useCustomForm({
    schema: UpdateRecipeSchema,
    defaultValues: {
      name: initialData.name,
      description: initialData.description || "",
      ingredients: initialData.ingredients.map((ing, index) => ({
        id: ing.id,
        content: ing.content,
        position: index + 1,
      })),
      steps: initialData.steps.map((step, index) => ({
        id: step.id,
        content: step.content,
        position: index + 1,
      })),
      tags: initialData.tags,
    },
  });

  // Initialize mutation hook for updating recipes
  const updateMutation = useUpdateRecipe(recipeId);

  // Handle form submission
  const onSubmit = (data: UpdateRecipeCommand) => {
    console.log("onSubmit", data);
    if (updateMutation.isPending) return;

    // Recalculate positions before sending to API
    const payload = {
      ...data,
      ingredients: data.ingredients.map((ing, index) => ({
        ...ing,
        position: index + 1,
      })),
      steps: data.steps.map((step, index) => ({
        ...step,
        position: index + 1,
      })),
    };

    updateMutation.mutate(payload);
  };

  // Handle cancel button click
  const handleCancel = () => {
    if (form.formState.isDirty) {
      // Show confirmation dialog if form has unsaved changes
      setShowCancelDialog(true);
    } else {
      // Navigate back immediately if no changes
      window.location.href = `/recipes/${recipeId}`;
    }
  };

  // Handle cancel confirmation
  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    window.location.href = `/recipes/${recipeId}`;
  };

  const isSubmitting = updateMutation.isPending || form.formState.isSubmitting;
  const isDirty = form.formState.isDirty;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <RecipeBasicInfoSection control={form.control} />

          <TagInput control={form.control} suggestions={[]} />

          <Separator />

          <EditableIngredientsList control={form.control} />
          
          <Separator />

          <EditableStepsList control={form.control} />

          <FormActionButtons onCancel={handleCancel} isSubmitting={isSubmitting} isDirty={isDirty} />
        </form>
      </Form>

      {/* Cancel confirmation dialog */}
      <CancelRecipeEditDialog
        isOpen={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelConfirm}
      />
    </>
  );
}
