import type { APIRoute } from "astro";
import { z } from "zod";
import { LoginSchema } from "../../../lib/schemas/auth.schema";
import { AuthService, AuthenticationError, ValidationError } from "../../../lib/services/auth.service";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticates a user with email and password credentials.
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "securepassword123"
 * }
 *
 * Returns 200 OK on success (session managed via cookies).
 * Returns 400 Bad Request for validation errors.
 * Returns 401 Unauthorized for invalid credentials.
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
      validatedData = LoginSchema.parse(requestBody);
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

    // Attempt login
    try {
      await authService.login(validatedData);
    } catch (authError) {
      // Handle authentication-specific errors
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

      // Handle validation errors (though these should be caught above)
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
      return new Response(
        JSON.stringify({
          error: "Authentication failed",
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

    // Return success response - empty body as session is managed via cookies
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    // Catch-all for unexpected errors
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
