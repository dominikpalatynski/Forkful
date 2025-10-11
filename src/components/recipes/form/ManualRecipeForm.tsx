import { useState } from "react";
import { Form } from "@/components/ui/form";
import { useForm as useCustomForm } from "@/hooks/use-form";
import { CreateRecipeSchema } from "@/lib/schemas/recipe.schema";
import type { CreateRecipeCommand } from "@/types";
import { useCreateRecipe } from "../hooks/useCreateRecipe";
import { CreateRecipeBasicInfoSection } from "./CreateRecipeBasicInfoSection";
import { CreateRecipeIngredientsList } from "./CreateRecipeIngredientsList";
import { CreateRecipeStepsList } from "./CreateRecipeStepsList";
import { CreateRecipeTagInput } from "./CreateRecipeTagInput";
import { FormActionButtons } from "./FormActionButtons";
import { Separator } from "@/components/ui/separator";
import { CancelRecipeEditDialog } from "./CancelRecipeEditDialog";

/**
 * ManualRecipeForm Component
 *
 * Main form component for creating new recipes manually. Manages form state using react-hook-form,
 * coordinates all form sections, and handles submission with position recalculation.
 *
 * Features:
 * - Form validation with Zod schema
 * - Cancel confirmation dialog for unsaved changes
 * - Position recalculation before submission
 */
export function ManualRecipeForm() {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Initialize form with custom useForm hook that integrates zodResolver
  const form = useCustomForm({
    schema: CreateRecipeSchema,
    defaultValues: {
      name: "",
      ingredients: [{ content: " ", position: 1 }],
      steps: [{ content: " ", position: 1 }],
      tags: [],
    },
  });

  // Initialize mutation hook for creating recipes
  const createMutation = useCreateRecipe();

  // Handle form submission
  const onSubmit = (data: CreateRecipeCommand) => {
    if (createMutation.isPending) return;

    // Recalculate positions before sending to API
    const payload = {
      ...data,
      ingredients: (data.ingredients || []).map((ing, index) => ({
        ...ing,
        position: index + 1,
      })),
      steps: (data.steps || []).map((step, index) => ({
        ...step,
        position: index + 1,
      })),
    };

    createMutation.mutate(payload);
  };

  // Handle cancel button click
  const handleCancel = () => {
    if (form.formState.isDirty) {
      // Show confirmation dialog if form has unsaved changes
      setShowCancelDialog(true);
    } else {
      // Navigate back immediately if no changes
      window.location.href = "/recipes";
    }
  };

  // Handle cancel confirmation
  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    window.location.href = "/recipes";
  };

  const isSubmitting = createMutation.isPending || form.formState.isSubmitting;
  const isDirty = form.formState.isDirty;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <CreateRecipeBasicInfoSection control={form.control} />

          <CreateRecipeTagInput control={form.control} suggestions={[]} />

          <Separator />

          <CreateRecipeIngredientsList control={form.control} />

          <Separator />

          <CreateRecipeStepsList control={form.control} />

          <FormActionButtons
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            isDirty={isDirty}
            submitButtonText="Utwórz przepis"
          />
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
