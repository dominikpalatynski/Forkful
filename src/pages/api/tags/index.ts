import type { APIRoute } from "astro";
import { z } from "zod";
import { GetTagsQuerySchema } from "../../../lib/schemas/tag.schema";
import { TagService } from "../../../lib/services/tag.service";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * GET /api/tags
 * Retrieves all unique tags belonging to the authenticated user.
 * Optionally filters tags by name using case-insensitive search.
 *
 * Query parameters:
 * - q (optional): Filter tags by name (case-insensitive, starts with search)
 *
 * Returns 200 OK with TagDto[] or appropriate error codes.
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // TODO: In production, get userId from authenticated session
    // For development, use a default user ID
    const DEFAULT_DEV_USER_ID = "ba120fed-a207-4eb6-85ec-934467468eaf";
    const userId = DEFAULT_DEV_USER_ID;

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    let validatedParams;
    try {
      validatedParams = GetTagsQuerySchema.parse(queryParams);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            details: validationError.errors,
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      throw validationError;
    }

    // Initialize tag service
    const tagService = new TagService(locals.supabase);

    // Get tags for user
    let tags;
    try {
      tags = await tagService.getTags(userId, validatedParams.q);
    } catch (serviceError) {
      console.error("Failed to get tags:", serviceError);
      return new Response(
        JSON.stringify({
          error: "Failed to get tags",
          message: serviceError instanceof Error ? serviceError.message : "An unexpected error occurred",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return success response
    return new Response(JSON.stringify(tags), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in GET /api/tags:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred while processing your request",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
