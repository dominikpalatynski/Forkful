import { defineMiddleware } from "astro:middleware";
import { sequence } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/verify-reset-token',
  '/auth/reset-password',
  '/auth/update-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/forgot-password',
  '/api/auth/verify-reset-token',
];

const validateRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    try {
      const supabase = supabaseClient;

      // Attach supabase client to locals
      locals.supabase = supabase;

      // Get user session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Always set user in locals if available, regardless of path
      if (user) {
        locals.user = {
          email: user.email ?? null,
          id: user.id,
        };
      }

      // Skip auth check for public paths
      if (PUBLIC_PATHS.includes(url.pathname)) {
        return next();
      }

      // For protected routes, check if user exists
      if (!user) {
        // For API routes, return 401 instead of redirecting
        if (url.pathname.startsWith('/api/')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }

        // Redirect to login for protected routes
        return redirect('/auth/login');
      }

      return next();
    } catch (error) {
      console.error('Error in middleware:', error instanceof Error ? error.message : error);
      return next();
    }
  },
);

export const onRequest = sequence(validateRequest);
