import type { APIRoute } from "astro";
import { z } from "zod";
import { VerifyResetTokenSchema } from "../../../lib/schemas/auth.schema";
import { AuthService, AuthenticationError, ValidationError } from "../../../lib/services/auth.service";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * POST /api/auth/verify-reset-token
 * Verifies a password reset token hash sent via email link. Used in the password recovery flow
 * to validate the reset token before allowing password change.
 *
 * Request body:
 * {
 *   "token_hash": "hash-from-email-link"
 * }
 *
 * Returns 200 OK with user data on successful verification.
 * Returns 400 Bad Request for missing token_hash, invalid or expired token.
 * Returns 500 Internal Server Error for unexpected server errors.
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
      validatedData = VerifyResetTokenSchema.parse(requestBody);
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

    // Attempt to verify the reset token
    let userData;
    try {
      userData = await authService.verifyResetToken(validatedData);
    } catch (authError) {
      // Handle authentication errors (invalid/expired tokens)
      if (authError instanceof AuthenticationError) {
        return new Response(
          JSON.stringify({
            error: "Token verification failed",
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
      console.error("Failed to verify reset token:", authError);
      return new Response(
        JSON.stringify({
          error: "Token verification failed",
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

    // Return success response with user data
    return new Response(
      JSON.stringify({
        user: userData,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in POST /api/auth/verify-reset-token:", error);
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
