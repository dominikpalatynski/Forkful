import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets the authenticated user ID from Astro locals
 * Throws a 401 Unauthorized response if user is not authenticated
 *
 * @param locals - Astro locals object containing user information
 * @returns The authenticated user's ID
 * @throws Response with 401 status if user is not authenticated
 */
export function getAuthenticatedUserId(locals: App.Locals): string {
  if (!locals.user || !locals.user.id) {
    throw new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Authentication required to access this resource",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  return locals.user.id;
}
