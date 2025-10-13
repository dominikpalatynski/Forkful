import type { APIRoute } from "astro";
import { z } from "zod";
import { ResetPasswordSchema } from "../../../lib/schemas/auth.schema";
import { AuthService, AuthenticationError, ValidationError } from "../../../lib/services/auth.service";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * POST /api/auth/reset-password
 * Updates the user's password using a valid reset token obtained through the password recovery flow.
 *
 * Request body:
 * {
 *   "password": "newsecurepassword123",
 *   "confirmPassword": "newsecurepassword123"
 * }
 *
 * Returns 200 OK on success (empty response body).
 * Returns 400 Bad Request for validation errors.
 * Returns 401 Unauthorized for invalid or expired reset token.
 */
export const POST: APIRoute = async ({ request, locals }) => {
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
      validatedData = ResetPasswordSchema.parse(requestBody);
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

    // Attempt password reset
    try {
      await authService.resetPassword(validatedData);
    } catch (authError) {
      // Handle authentication-specific errors (invalid/expired token)
      if (authError instanceof AuthenticationError) {
        return new Response(
          JSON.stringify({
            error: "Authentication failed",
            message: authError.message,
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

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
      console.error("Failed to reset password:", authError);
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

    // Return success response - empty body as specified in requirements
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in POST /api/auth/reset-password:", error);
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
