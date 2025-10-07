import { z } from "zod";

/**
 * Schema for validating GET /api/tags query parameters.
 * Used for filtering tags by name with optional search query.
 */
export const GetTagsQuerySchema = z.object({
  q: z.string().optional(),
});

/**
 * Type inference for GetTagsQuerySchema
 */
export type GetTagsQuerySchemaType = z.infer<typeof GetTagsQuerySchema>;
