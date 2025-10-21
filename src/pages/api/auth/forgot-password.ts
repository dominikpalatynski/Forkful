import type { APIRoute } from "astro";
import { z } from "zod";
import { ForgotPasswordSchema } from "../../../lib/schemas/auth.schema";
import { AuthService, ValidationError } from "../../../lib/services/auth.service";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * POST /api/auth/forgot-password
 * Initiates the password reset process by sending a reset link to the user's email address.
 *
 * Request body:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Returns 200 OK on success (email sent if account exists).
 * Returns 400 Bad Request for validation errors.
 */
export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          message: parseError instanceof Error ? parseError.message : "Unknown error",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate request body against schema
    let validatedData;
    try {
      validatedData = ForgotPasswordSchema.parse(requestBody);
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

    // Initialize auth service
    const authService = new AuthService(locals.supabase);

    // Attempt to initiate password reset
    try {
      await authService.forgotPassword(validatedData, url.origin);
    } catch (authError) {
      // Handle validation errors
      if (authError instanceof ValidationError) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            message: authError.message,
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Handle other service errors
      console.error("Failed to initiate password reset:", authError);
      return new Response(
        JSON.stringify({
          error: "Password reset failed",
          message: authError instanceof Error ? authError.message : "An unexpected error occurred",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return success response - empty body as per requirements
    // We always return 200 to avoid revealing whether an email exists
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in POST /api/auth/forgot-password:", error);
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
