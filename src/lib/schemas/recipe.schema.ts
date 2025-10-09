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
  description: z.string().optional(),
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
 * Schema for validating Supabase query result when fetching a recipe with joins.
 * This validates the raw structure returned by Supabase before transforming it to DTO.
 */
export const RecipeListResultSchema = z.array(z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  recipe_tags: z.array(z.object({
    tags: z.object({
      name: z.string(),
    }).nullable(),
  })).nullable(),
}));

/**
 * Schema for validating GET /api/recipes query parameters.
 * Used for paginated, sortable and filterable recipe listing.
 */
export const GetRecipesSchema = z.object({
  page: z.coerce.number().int().positive("Page must be a positive integer").default(1),
  pageSize: z
    .coerce
    .number()
    .int()
    .positive("Page size must be a positive integer")
    .max(100, "Page size cannot exceed 100")
    .default(10),
  sortBy: z.enum(["name", "created_at"], {
    errorMap: () => ({ message: "Sort by must be either 'name' or 'created_at'" })
  }).default("created_at"),
  order: z.enum(["asc", "desc"], {
    errorMap: () => ({ message: "Order must be either 'asc' or 'desc'" })
  }).default("desc"),
  tag: z.string().min(1, "Tag name cannot be empty").optional(),
});

/**
 * Type inference for GetRecipesSchema
 */
export type GetRecipesSchemaType = z.infer<typeof GetRecipesSchema>;

/**
 * Schema for validating the recipe ID parameter from URL path.
 * Ensures the ID is a valid UUID format for GET/PUT/DELETE /api/recipes/{id}.
 */
export const RecipeIdParamsSchema = z.object({
  id: z.string().uuid("Invalid recipe ID format. Must be a valid UUID."),
});

/**
 * @deprecated Use RecipeIdParamsSchema instead
 */
export const GetRecipeByIdParamsSchema = RecipeIdParamsSchema;

/**
 * Type inference for GetRecipeByIdParamsSchema
 */
export type GetRecipeByIdParamsType = z.infer<typeof GetRecipeByIdParamsSchema>;

/**
 * Schema for validating ingredients in update recipe commands.
 * Each ingredient can have an optional ID (for existing items) and must have content and position.
 */
export const UpdateRecipeIngredientCommandSchema = z.object({
  id: z.string().uuid("Invalid ingredient ID format").optional(),
  content: z.string().min(1, "Ingredient content cannot be empty"),
  position: z.number().int().positive("Position must be a positive integer"),
});

/**
 * Schema for validating steps in update recipe commands.
 * Each step can have an optional ID (for existing items) and must have content and position.
 */
export const UpdateRecipeStepCommandSchema = z.object({
  id: z.string().uuid("Invalid step ID format").optional(),
  content: z.string().min(1, "Step content cannot be empty"),
  position: z.number().int().positive("Position must be a positive integer"),
});

/**
 * Schema for validating the PUT /api/recipes/{id} request body.
 * Used to update an existing recipe with ingredients, steps, and tags.
 */
export const UpdateRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(255, "Recipe name is too long"),
  description: z.string().nullable(),
  ingredients: z.array(UpdateRecipeIngredientCommandSchema),
  steps: z.array(UpdateRecipeStepCommandSchema),
  tags: z.array(z.string().min(1, "Tag name cannot be empty")),
});

/**
 * Type inference for UpdateRecipeSchema
 */
export type UpdateRecipeSchemaType = z.infer<typeof UpdateRecipeSchema>;

/**
 * Schema for validating the POST /api/recipes/generate request body.
 * Used to validate input text for AI recipe generation.
 */
export const GenerateRecipeSchema = z.object({
  inputText: z.string()
    .min(20, { message: "Input text must be at least 20 characters long." })
    .max(10000, { message: "Input text cannot exceed 10,000 characters." })
});

/**
 * Type inference for GenerateRecipeSchema
 */
export type GenerateRecipeSchemaType = z.infer<typeof GenerateRecipeSchema>;

/**
 * Type inference for SupabaseRecipeWithJoinsSchema
 */
export type SupabaseRecipeWithJoins = z.infer<typeof SupabaseRecipeWithJoinsSchema>;

