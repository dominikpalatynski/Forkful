import type { SupabaseClientType } from "../../db/supabase.client";
import type { LoginSchemaType, RegisterSchemaType, ForgotPasswordSchemaType, ResetPasswordSchemaType } from "../schemas/auth.schema";

/**
 * Custom error classes for authentication service operations
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Service for handling user authentication operations.
 * Encapsulates authentication logic and provides clean API for auth endpoints.
 */
export class AuthService {
  constructor(private supabase: SupabaseClientType) {}

  /**
   * Authenticates a user with email and password credentials.
   * Calls Supabase Auth to sign in the user and establish a session.
   *
   * @param credentials - The user's email and password
   * @returns Promise that resolves on successful authentication
   * @throws AuthenticationError when credentials are invalid
   * @throws ValidationError when input validation fails
   * @throws Error for other unexpected authentication errors
   */
  async login(credentials: LoginSchemaType): Promise<void> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        // Handle different types of authentication errors
        if (error.message.includes("Invalid login credentials") ||
            error.message.includes("Email not confirmed") ||
            error.message.includes("User not found")) {
          throw new AuthenticationError("Invalid email or password");
        }

        if (error.message.includes("Email rate limit exceeded")) {
          throw new AuthenticationError("Too many login attempts. Please try again later.");
        }

        // For other Supabase auth errors, throw a generic authentication error
        throw new AuthenticationError("Authentication failed. Please try again.");
      }

      // Success - Supabase automatically manages the session and cookies
      // No need to return data as the session is handled by Supabase middleware
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof AuthenticationError || error instanceof ValidationError) {
        throw error;
      }

      // Handle unexpected errors
      console.error("Unexpected error during login:", error);
      throw new Error("An unexpected error occurred during authentication. Please try again.");
    }
  }

  /**
   * Registers a new user with email and password.
   * Calls Supabase Auth to create a new user account and sends a verification email.
   *
   * @param credentials - The user's email and password
   * @returns Promise that resolves on successful registration
   * @throws ValidationError when input validation fails
   * @throws AuthenticationError when user already exists or other auth errors
   * @throws Error for other unexpected registration errors
   */
  async register(credentials: RegisterSchemaType): Promise<void> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        // Handle different types of registration errors
        if (error.message.includes("User already registered") ||
            error.message.includes("already been registered")) {
          throw new AuthenticationError("A user with this email already exists");
        }

        if (error.message.includes("Password should be at least")) {
          throw new ValidationError("Password does not meet requirements");
        }

        if (error.message.includes("Invalid email")) {
          throw new ValidationError("Invalid email format");
        }

        if (error.message.includes("Signup is disabled")) {
          throw new AuthenticationError("Registration is currently disabled");
        }

        // For other Supabase auth errors, throw a generic authentication error
        throw new AuthenticationError("Registration failed. Please try again.");
      }

      // Success - verification email is sent automatically by Supabase
      // No need to return data as the verification process is handled by Supabase
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof AuthenticationError || error instanceof ValidationError) {
        throw error;
      }

      // Handle unexpected errors
      console.error("Unexpected error during registration:", error);
      throw new Error("An unexpected error occurred during registration. Please try again.");
    }
  }

  /**
   * Signs out the current user and clears the session.
   * Calls Supabase Auth to sign out the user and invalidate the session.
   *
   * @returns Promise that resolves on successful logout
   * @throws Error if logout operation fails
   */
  async logout(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        throw new Error(`Logout failed: ${error.message}`);
      }

      // Success - session is cleared
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      throw new Error("An unexpected error occurred during logout. Please try again.");
    }
  }

  /**
   * Initiates the password reset process by sending a reset link to the user's email.
   * Calls Supabase Auth to send a password reset email.
   *
   * @param emailData - The user's email address
   * @returns Promise that resolves when reset email is sent (or would be sent)
   * @throws ValidationError when input validation fails
   * @throws Error for other unexpected password reset errors
   */
  async forgotPassword(emailData: ForgotPasswordSchemaType): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(
        emailData.email,
        {
          redirectTo: `${process.env.PUBLIC_APP_URL || 'http://localhost:4321'}/auth/reset-password`,
        }
      );

      if (error) {
        // Handle different types of password reset errors
        if (error.message.includes("Invalid email")) {
          throw new ValidationError("Invalid email format");
        }

        if (error.message.includes("Email rate limit exceeded")) {
          throw new ValidationError("Too many password reset requests. Please try again later.");
        }

        // For other Supabase auth errors, throw a generic validation error
        // We don't want to reveal if the email exists or not for security reasons
        throw new ValidationError("Unable to process password reset request. Please try again.");
      }

      // Success - reset email is sent (or would be sent to prevent email enumeration)
      // We always return success to avoid revealing whether an email exists
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof ValidationError) {
        throw error;
      }

      // Handle unexpected errors
      console.error("Unexpected error during password reset:", error);
      throw new Error("An unexpected error occurred while processing your password reset request. Please try again.");
    }
  }

  /**
   * Updates the user's password using a valid reset token.
   * Calls Supabase Auth to update the user's password with the new value.
   *
   * @param passwordData - The new password and confirmation
   * @returns Promise that resolves on successful password update
   * @throws ValidationError when input validation fails
   * @throws AuthenticationError when reset token is invalid or expired
   * @throws Error for other unexpected password update errors
   */
  async resetPassword(passwordData: ResetPasswordSchemaType): Promise<void> {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password: passwordData.password,
      });

      if (error) {
        // Handle different types of password update errors
        if (error.message.includes("Invalid refresh token") ||
            error.message.includes("Token has expired") ||
            error.message.includes("JWT expired")) {
          throw new AuthenticationError("Your password reset link has expired. Please request a new one.");
        }

        if (error.message.includes("Password should be at least")) {
          throw new ValidationError("Password does not meet requirements");
        }

        if (error.message.includes("New password should be different")) {
          throw new ValidationError("New password must be different from your current password");
        }

        // For other Supabase auth errors, throw a generic authentication error
        throw new AuthenticationError("Unable to update password. Please try again.");
      }

      // Success - password has been updated
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof AuthenticationError || error instanceof ValidationError) {
        throw error;
      }

      // Handle unexpected errors
      console.error("Unexpected error during password reset:", error);
      throw new Error("An unexpected error occurred while updating your password. Please try again.");
    }
  }
}
