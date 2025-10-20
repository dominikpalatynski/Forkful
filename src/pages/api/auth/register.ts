import type { APIRoute } from "astro";
import { z } from "zod";
import { RegisterSchema } from "../../../lib/schemas/auth.schema";
import { AuthService, AuthenticationError, ValidationError } from "../../../lib/services/auth.service";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * POST /api/auth/register
 * Creates a new user account with email and password. Sends a verification email.
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "securepassword123",
 *   "confirmPassword": "securepassword123"
 * }
 *
 * Returns 201 Created on success (verification email sent).
 * Returns 400 Bad Request for validation errors.
 * Returns 409 Conflict when user already exists.
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
      validatedData = RegisterSchema.parse(requestBody);
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

    // Attempt registration
    try {
      await authService.register(validatedData);
    } catch (authError) {
      // Handle authentication-specific errors (user already exists)
      if (authError instanceof AuthenticationError) {
        const isUserExists = authError.message.includes("already exists");
        return new Response(
          JSON.stringify({
            error: isUserExists ? "User already exists" : "Registration failed",
            message: authError.message,
          }),
          {
            status: isUserExists ? 409 : 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Handle validation errors (password requirements, etc.)
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

      return new Response(
        JSON.stringify({
          error: "Registration failed",
          message: authError instanceof Error ? authError.message : "An unexpected error occurred",
          details: authError instanceof Error ? authError.message : "Unknown error",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return success response - empty body as verification email is sent
    return new Response(null, {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred while processing your request",
        details: error instanceof Error ? error.message : "Unknown error",
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
