import { z } from "zod";

/**
 * Schema for validating ingredients in recipe creation/update commands.
 * Each ingredient must have content and position.
 */
export const RecipeIngredientCommandSchema = z.object({
  content: z.string().min(1, "Ingredient content cannot be empty"),
  position: z.number().int().positive("Position must be a positive integer"),
});

/**
 * Schema for validating steps in recipe creation/update commands.
 * Each step must have content and position.
 */
export const RecipeStepCommandSchema = z.object({
  content: z.string().min(1, "Step content cannot be empty"),
  position: z.number().int().positive("Position must be a positive integer"),
});

/**
 * Schema for validating the POST /api/recipes request body.
 * Used to create a new recipe with ingredients, steps, and tags.
 */
export const CreateRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(255, "Recipe name is too long"),
  description: z.string().nullable().optional(),
  generationId: z.string().uuid("Invalid generation ID format").optional(),
  ingredients: z.array(RecipeIngredientCommandSchema).default([]),
  steps: z.array(RecipeStepCommandSchema).default([]),
  tags: z.array(z.string().min(1, "Tag name cannot be empty")).default([]),
});

/**
 * Type inference for CreateRecipeSchema
 */
export type CreateRecipeSchemaType = z.infer<typeof CreateRecipeSchema>;

/**
 * Schema for validating Supabase query result when fetching a recipe with joins.
 * This validates the raw structure returned by Supabase before transforming it to DTO.
 */
export const SupabaseRecipeWithJoinsSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  ingredients: z.array(z.object({
    id: z.string().uuid(),
    content: z.string(),
    position: z.number(),
  })).nullable(),
  steps: z.array(z.object({
    id: z.string().uuid(),
    content: z.string(),
    position: z.number(),
  })).nullable(),
  recipe_tags: z.array(z.object({
    tags: z.object({
      name: z.string(),
    }).nullable(),
  })).nullable(),
});

/**
 * Type inference for SupabaseRecipeWithJoinsSchema
 */
export type SupabaseRecipeWithJoins = z.infer<typeof SupabaseRecipeWithJoinsSchema>;

