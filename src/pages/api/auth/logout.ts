import type { APIRoute } from "astro";
import { AuthService } from "../../../lib/services/auth.service";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * POST /api/auth/logout
 * Terminates the current user session and clears session cookies.
 *
 * Request body: None
 *
 * Returns 200 OK on success (session cleared, empty response body).
 * Logout should always succeed for authenticated users.
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    // Initialize auth service
    const authService = new AuthService(locals.supabase);

    // Attempt logout - this should always succeed for authenticated users
    try {
      await authService.logout();
    } catch (logoutError) {
      // Log the error for debugging but don't fail the request
      // as per requirements, logout should always succeed
      return new Response(
        JSON.stringify({
          error: "Logout failed",
          message: "An unexpected error occurred while processing your request",
          details: logoutError instanceof Error ? logoutError.message : "Unknown error",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // Continue with success response since logout should not fail
    }

    // Return success response - empty body as session is cleared
    return new Response(null, {
      status: 200,
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
