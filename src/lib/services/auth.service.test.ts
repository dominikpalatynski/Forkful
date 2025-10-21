import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService, AuthenticationError, ValidationError } from "./auth.service";
import type { SupabaseClientType } from "../../db/supabase.client";

// Create reusable mock functions for Supabase auth API
const createAuthMocks = () => {
  const mockSignInWithPassword = vi.fn();
  const mockSignUp = vi.fn();
  const mockSignOut = vi.fn();
  const mockResetPasswordForEmail = vi.fn();
  const mockUpdateUser = vi.fn();
  const mockVerifyOtp = vi.fn();

  // Create mock auth object
  const mockAuth = {
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    signOut: mockSignOut,
    resetPasswordForEmail: mockResetPasswordForEmail,
    updateUser: mockUpdateUser,
    verifyOtp: mockVerifyOtp,
  };

  return {
    auth: mockAuth,
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    signOut: mockSignOut,
    resetPasswordForEmail: mockResetPasswordForEmail,
    updateUser: mockUpdateUser,
    verifyOtp: mockVerifyOtp,
  };
};

describe("AuthService", () => {
  let authService: AuthService;
  let authMocks: ReturnType<typeof createAuthMocks>;

  beforeEach(() => {
    vi.resetAllMocks();
    authMocks = createAuthMocks();

    // Create mock Supabase client with auth methods
    const mockSupabaseClient = {
      auth: authMocks.auth,
    } as unknown as SupabaseClientType;

    authService = new AuthService(mockSupabaseClient);
  });

  describe("login", () => {
    describe("Success Scenarios", () => {
      it("should successfully authenticate user with valid credentials", async () => {
        // Arrange
        const validCredentials = {
          email: "test@example.com",
          password: "validpassword123",
        };

        const mockUser = {
          id: "user-123",
          email: "test@example.com",
        };

        authMocks.signInWithPassword.mockResolvedValueOnce({
          data: { user: mockUser },
          error: null,
        });

        // Act & Assert
        await expect(authService.login(validCredentials)).resolves.not.toThrow();

        // Assert
        expect(authMocks.signInWithPassword).toHaveBeenCalledTimes(1);
        expect(authMocks.signInWithPassword).toHaveBeenCalledWith({
          email: validCredentials.email,
          password: validCredentials.password,
        });
      });
    });

    describe("Error Scenarios", () => {
      it("should throw AuthenticationError for invalid credentials", async () => {
        // Arrange
        const credentials = {
          email: "test@example.com",
          password: "wrongpassword",
        };

        authMocks.signInWithPassword.mockResolvedValue({
          data: null,
          error: { message: "Invalid login credentials" },
        });

        // Act & Assert
        await expect(authService.login(credentials)).rejects.toThrow(AuthenticationError);
        await expect(authService.login(credentials)).rejects.toThrow("Invalid email or password");

        expect(authMocks.signInWithPassword).toHaveBeenCalledTimes(2);
        expect(authMocks.signInWithPassword).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
        });
      });

      it("should throw AuthenticationError for email not confirmed", async () => {
        // Arrange
        const credentials = {
          email: "test@example.com",
          password: "password123",
        };

        authMocks.signInWithPassword.mockResolvedValue({
          data: null,
          error: { message: "Email not confirmed" },
        });

        // Act & Assert
        await expect(authService.login(credentials)).rejects.toThrow(AuthenticationError);
        await expect(authService.login(credentials)).rejects.toThrow("Invalid email or password");

        expect(authMocks.signInWithPassword).toHaveBeenCalledTimes(2);
        expect(authMocks.signInWithPassword).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
        });
      });

      it("should throw AuthenticationError for user not found", async () => {
        // Arrange
        const credentials = {
          email: "test@example.com",
          password: "password123",
        };

        authMocks.signInWithPassword.mockResolvedValue({
          data: null,
          error: { message: "User not found" },
        });

        // Act & Assert
        await expect(authService.login(credentials)).rejects.toThrow(AuthenticationError);
        await expect(authService.login(credentials)).rejects.toThrow("Invalid email or password");

        expect(authMocks.signInWithPassword).toHaveBeenCalledTimes(2);
        expect(authMocks.signInWithPassword).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
        });
      });

      it("should throw AuthenticationError for rate limit exceeded", async () => {
        // Arrange
        const credentials = {
          email: "test@example.com",
          password: "password123",
        };

        authMocks.signInWithPassword.mockResolvedValue({
          data: null,
          error: { message: "Email rate limit exceeded" },
        });

        // Act & Assert
        await expect(authService.login(credentials)).rejects.toThrow(AuthenticationError);
        await expect(authService.login(credentials)).rejects.toThrow(
          "Too many login attempts. Please try again later."
        );

        expect(authMocks.signInWithPassword).toHaveBeenCalledTimes(2);
        expect(authMocks.signInWithPassword).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
        });
      });

      it("should throw AuthenticationError for generic auth error", async () => {
        // Arrange
        const credentials = {
          email: "test@example.com",
          password: "password123",
        };

        authMocks.signInWithPassword.mockResolvedValue({
          data: null,
          error: { message: "Service unavailable" },
        });

        // Act & Assert
        await expect(authService.login(credentials)).rejects.toThrow(AuthenticationError);
        await expect(authService.login(credentials)).rejects.toThrow("Authentication failed. Please try again.");

        expect(authMocks.signInWithPassword).toHaveBeenCalledTimes(2);
        expect(authMocks.signInWithPassword).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
        });
      });

      it("should log error and throw generic Error for unexpected exception", async () => {
        // Arrange
        const credentials = {
          email: "test@example.com",
          password: "password123",
        };

        authMocks.signInWithPassword.mockRejectedValue(new Error("Network error"));

        // Act & Assert
        await expect(authService.login(credentials)).rejects.toThrow(Error);
        await expect(authService.login(credentials)).rejects.toThrow(
          "An unexpected error occurred during authentication. Please try again."
        );

        expect(authMocks.signInWithPassword).toHaveBeenCalledTimes(2);
        expect(authMocks.signInWithPassword).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
        });
      });
    });
  });

  describe("register", () => {
    describe("Success Scenarios", () => {
      it("should successfully create new user account", async () => {
        // Arrange
        const validCredentials = {
          email: "newuser@example.com",
          password: "validpassword123",
          confirmPassword: "validpassword123",
        };
        const url = "https://example.com";

        const mockUser = {
          id: "user-123",
          email: "newuser@example.com",
        };

        authMocks.signUp.mockResolvedValueOnce({
          data: { user: mockUser },
          error: null,
        });

        // Act & Assert
        await expect(authService.register(validCredentials, url)).resolves.not.toThrow();

        // Assert
        expect(authMocks.signUp).toHaveBeenCalledTimes(1);
        expect(authMocks.signUp).toHaveBeenCalledWith({
          email: validCredentials.email,
          password: validCredentials.password,
          options: {
            emailRedirectTo: `${url}/auth/login`,
          },
        });
      });
    });

    describe("Error Scenarios", () => {
      it("should throw AuthenticationError when user already registered (variation 1)", async () => {
        // Arrange
        const credentials = {
          email: "existing@example.com",
          password: "password123",
          confirmPassword: "password123",
        };
        const url = "https://example.com";

        authMocks.signUp.mockResolvedValue({
          data: null,
          error: { message: "User already registered" },
        });

        // Act & Assert
        await expect(authService.register(credentials, url)).rejects.toThrow(AuthenticationError);
        await expect(authService.register(credentials, url)).rejects.toThrow("A user with this email already exists");

        expect(authMocks.signUp).toHaveBeenCalledTimes(2);
        expect(authMocks.signUp).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
          options: {
            emailRedirectTo: `${url}/auth/login`,
          },
        });
      });

      it("should throw AuthenticationError when user already registered (variation 2)", async () => {
        // Arrange
        const credentials = {
          email: "existing@example.com",
          password: "password123",
          confirmPassword: "password123",
        };
        const url = "https://example.com";

        authMocks.signUp.mockResolvedValue({
          data: null,
          error: { message: "This email has already been registered" },
        });

        // Act & Assert
        await expect(authService.register(credentials, url)).rejects.toThrow(AuthenticationError);
        await expect(authService.register(credentials, url)).rejects.toThrow("A user with this email already exists");

        expect(authMocks.signUp).toHaveBeenCalledTimes(2);
        expect(authMocks.signUp).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
          options: {
            emailRedirectTo: `${url}/auth/login`,
          },
        });
      });

      it("should throw ValidationError when password is too weak", async () => {
        // Arrange
        const credentials = {
          email: "test@example.com",
          password: "weak",
          confirmPassword: "weak",
        };
        const url = "https://example.com";

        authMocks.signUp.mockResolvedValue({
          data: null,
          error: { message: "Password should be at least 16 characters" },
        });

        // Act & Assert
        await expect(authService.register(credentials, url)).rejects.toThrow(ValidationError);
        await expect(authService.register(credentials, url)).rejects.toThrow("Password does not meet requirements");

        expect(authMocks.signUp).toHaveBeenCalledTimes(2);
        expect(authMocks.signUp).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
          options: {
            emailRedirectTo: `${url}/auth/login`,
          },
        });
      });

      it("should throw ValidationError when email format is invalid", async () => {
        // Arrange
        const credentials = {
          email: "invalid-email",
          password: "validpassword123",
          confirmPassword: "validpassword123",
        };
        const url = "https://example.com";

        authMocks.signUp.mockResolvedValue({
          data: null,
          error: { message: "Invalid email" },
        });

        // Act & Assert
        await expect(authService.register(credentials, url)).rejects.toThrow(ValidationError);
        await expect(authService.register(credentials, url)).rejects.toThrow("Invalid email format");

        expect(authMocks.signUp).toHaveBeenCalledTimes(2);
        expect(authMocks.signUp).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
          options: {
            emailRedirectTo: `${url}/auth/login`,
          },
        });
      });

      it("should throw AuthenticationError when signup is disabled", async () => {
        // Arrange
        const credentials = {
          email: "test@example.com",
          password: "validpassword123",
          confirmPassword: "validpassword123",
        };
        const url = "https://example.com";

        authMocks.signUp.mockResolvedValue({
          data: null,
          error: { message: "Signup is disabled" },
        });

        // Act & Assert
        await expect(authService.register(credentials, url)).rejects.toThrow(AuthenticationError);
        await expect(authService.register(credentials, url)).rejects.toThrow("Registration is currently disabled");

        expect(authMocks.signUp).toHaveBeenCalledTimes(2);
        expect(authMocks.signUp).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
          options: {
            emailRedirectTo: `${url}/auth/login`,
          },
        });
      });

      it("should throw AuthenticationError for generic auth error", async () => {
        // Arrange
        const credentials = {
          email: "test@example.com",
          password: "validpassword123",
          confirmPassword: "validpassword123",
        };
        const url = "https://example.com";

        authMocks.signUp.mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        });

        // Act & Assert
        await expect(authService.register(credentials, url)).rejects.toThrow(AuthenticationError);
        await expect(authService.register(credentials, url)).rejects.toThrow("Registration failed. Please try again.");

        expect(authMocks.signUp).toHaveBeenCalledTimes(2);
        expect(authMocks.signUp).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
          options: {
            emailRedirectTo: `${url}/auth/login`,
          },
        });
      });

      it("should log error and throw generic Error for unexpected exception", async () => {
        // Arrange
        const credentials = {
          email: "test@example.com",
          password: "validpassword123",
          confirmPassword: "validpassword123",
        };
        const url = "https://example.com";

        authMocks.signUp.mockRejectedValue(new Error("Network error"));

        // Act & Assert
        await expect(authService.register(credentials, url)).rejects.toThrow(Error);
        await expect(authService.register(credentials, url)).rejects.toThrow(
          "An unexpected error occurred during registration. Please try again."
        );

        expect(authMocks.signUp).toHaveBeenCalledTimes(2);
        expect(authMocks.signUp).toHaveBeenCalledWith({
          email: credentials.email,
          password: credentials.password,
          options: {
            emailRedirectTo: `${url}/auth/login`,
          },
        });
      });
    });
  });

  describe("logout", () => {
    describe("Success Scenarios", () => {
      it("should successfully sign out user", async () => {
        // Arrange
        authMocks.signOut.mockResolvedValueOnce({
          error: null,
        });

        // Act & Assert
        await expect(authService.logout()).resolves.not.toThrow();

        // Assert
        expect(authMocks.signOut).toHaveBeenCalledTimes(1);
      });
    });

    describe("Error Scenarios", () => {
      it("should throw error when Supabase returns error during logout", async () => {
        // Arrange
        const errorMessage = "Failed to sign out";
        authMocks.signOut.mockResolvedValueOnce({
          error: { message: errorMessage },
        });

        // Act & Assert
        await expect(authService.logout()).rejects.toThrow(`Logout failed: ${errorMessage}`);
      });

      it("should handle unexpected exception during logout", async () => {
        // Arrange
        const unexpectedError = new Error("Network error");
        authMocks.signOut.mockRejectedValueOnce(unexpectedError);

        // Act & Assert
        await expect(authService.logout()).rejects.toThrow(Error);
        await expect(authService.logout()).rejects.toThrow(
          "An unexpected error occurred during logout. Please try again."
        );
      });
    });

    describe("forgotPassword", () => {
      it("should send password reset email successfully", async () => {
        // Arrange
        const emailData = { email: "user@example.com" };
        const url = "https://example.com";
        authMocks.resetPasswordForEmail.mockResolvedValueOnce({ error: null });

        // Act
        await expect(authService.forgotPassword(emailData, url)).resolves.toBeUndefined();

        // Assert
        expect(authMocks.resetPasswordForEmail).toHaveBeenCalledTimes(1);
        expect(authMocks.resetPasswordForEmail).toHaveBeenCalledWith(emailData.email, {
          redirectTo: `${url}/auth/update-password`,
        });
      });

      it("should throw ValidationError for invalid email format", async () => {
        // Arrange
        const emailData = { email: "invalid-email" };
        const url = "https://example.com";
        authMocks.resetPasswordForEmail.mockResolvedValue({
          error: { message: "Invalid email" },
        });

        // Act & Assert
        await expect(authService.forgotPassword(emailData, url)).rejects.toThrow(ValidationError);
        await expect(authService.forgotPassword(emailData, url)).rejects.toThrow("Invalid email format");
      });

      it("should throw ValidationError when rate limit is exceeded", async () => {
        // Arrange
        const emailData = { email: "user@example.com" };
        const url = "https://example.com";
        authMocks.resetPasswordForEmail.mockResolvedValue({
          error: { message: "Email rate limit exceeded" },
        });

        // Act & Assert
        await expect(authService.forgotPassword(emailData, url)).rejects.toThrow(ValidationError);
        await expect(authService.forgotPassword(emailData, url)).rejects.toThrow(
          "Too many password reset requests. Please try again later."
        );
      });

      it("should throw ValidationError for generic auth error", async () => {
        // Arrange
        const emailData = { email: "user@example.com" };
        const url = "https://example.com";
        authMocks.resetPasswordForEmail.mockResolvedValue({
          error: { message: "Some other auth error" },
        });

        // Act & Assert
        await expect(authService.forgotPassword(emailData, url)).rejects.toThrow(ValidationError);
        await expect(authService.forgotPassword(emailData, url)).rejects.toThrow(
          "Unable to process password reset request. Please try again."
        );
      });

      it("should handle unexpected exception during password reset", async () => {
        // Arrange
        const emailData = { email: "user@example.com" };
        const url = "https://example.com";
        const unexpectedError = new Error("Network error");
        authMocks.resetPasswordForEmail.mockRejectedValueOnce(unexpectedError);

        // Act & Assert
        await expect(authService.forgotPassword(emailData, url)).rejects.toThrow(Error);
        await expect(authService.forgotPassword(emailData, url)).rejects.toThrow(
          "An unexpected error occurred while processing your password reset request. Please try again."
        );
      });

      it("should properly encode redirect URL with special characters", async () => {
        // Arrange
        const emailData = { email: "user@example.com" };
        const url = "https://example.com:3000";
        authMocks.resetPasswordForEmail.mockResolvedValueOnce({ error: null });

        // Act
        await expect(authService.forgotPassword(emailData, url)).resolves.toBeUndefined();

        // Assert
        expect(authMocks.resetPasswordForEmail).toHaveBeenCalledTimes(1);
        expect(authMocks.resetPasswordForEmail).toHaveBeenCalledWith(emailData.email, {
          redirectTo: `${url}/auth/update-password`,
        });
      });
    });
  });

  describe("resetPassword", () => {
    describe("Success Scenarios", () => {
      it("should successfully update user password with reset token", async () => {
        // Arrange
        const passwordData = {
          password: "newpassword123",
          confirmPassword: "newpassword123",
        };

        const mockUser = {
          id: "user-123",
          email: "test@example.com",
        };

        authMocks.updateUser.mockResolvedValueOnce({
          data: { user: mockUser },
          error: null,
        });

        // Act & Assert
        await expect(authService.resetPassword(passwordData)).resolves.not.toThrow();

        // Assert
        expect(authMocks.updateUser).toHaveBeenCalledTimes(1);
        expect(authMocks.updateUser).toHaveBeenCalledWith({
          password: passwordData.password,
        });
      });
    });

    describe("Error Scenarios", () => {
      it("should throw AuthenticationError for invalid refresh token", async () => {
        // Arrange
        const passwordData = {
          password: "newpassword123",
          confirmPassword: "newpassword123",
        };

        authMocks.updateUser.mockResolvedValue({
          data: null,
          error: { message: "Invalid refresh token" },
        });

        // Act & Assert
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(AuthenticationError);
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(
          "Your password reset link has expired. Please request a new one."
        );

        expect(authMocks.updateUser).toHaveBeenCalledTimes(2);
        expect(authMocks.updateUser).toHaveBeenCalledWith({
          password: passwordData.password,
        });
      });

      it("should throw AuthenticationError when token has expired (variation 1)", async () => {
        // Arrange
        const passwordData = {
          password: "newpassword123",
          confirmPassword: "newpassword123",
        };

        authMocks.updateUser.mockResolvedValue({
          data: null,
          error: { message: "Token has expired" },
        });

        // Act & Assert
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(AuthenticationError);
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(
          "Your password reset link has expired. Please request a new one."
        );

        expect(authMocks.updateUser).toHaveBeenCalledTimes(2);
        expect(authMocks.updateUser).toHaveBeenCalledWith({
          password: passwordData.password,
        });
      });

      it("should throw AuthenticationError when token has expired (variation 2)", async () => {
        // Arrange
        const passwordData = {
          password: "newpassword123",
          confirmPassword: "newpassword123",
        };

        authMocks.updateUser.mockResolvedValue({
          data: null,
          error: { message: "JWT expired" },
        });

        // Act & Assert
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(AuthenticationError);
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(
          "Your password reset link has expired. Please request a new one."
        );

        expect(authMocks.updateUser).toHaveBeenCalledTimes(2);
        expect(authMocks.updateUser).toHaveBeenCalledWith({
          password: passwordData.password,
        });
      });

      it("should throw ValidationError when password is too weak", async () => {
        // Arrange
        const passwordData = {
          password: "weak",
          confirmPassword: "weak",
        };

        authMocks.updateUser.mockResolvedValue({
          data: null,
          error: { message: "Password should be at least 16 characters" },
        });

        // Act & Assert
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(ValidationError);
        await expect(authService.resetPassword(passwordData)).rejects.toThrow("Password does not meet requirements");

        expect(authMocks.updateUser).toHaveBeenCalledTimes(2);
        expect(authMocks.updateUser).toHaveBeenCalledWith({
          password: passwordData.password,
        });
      });

      it("should throw ValidationError when new password is same as current", async () => {
        // Arrange
        const passwordData = {
          password: "samepassword123",
          confirmPassword: "samepassword123",
        };

        authMocks.updateUser.mockResolvedValue({
          data: null,
          error: { message: "New password should be different from your current password" },
        });

        // Act & Assert
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(ValidationError);
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(
          "New password must be different from your current password"
        );

        expect(authMocks.updateUser).toHaveBeenCalledTimes(2);
        expect(authMocks.updateUser).toHaveBeenCalledWith({
          password: passwordData.password,
        });
      });

      it("should throw AuthenticationError for generic auth error", async () => {
        // Arrange
        const passwordData = {
          password: "newpassword123",
          confirmPassword: "newpassword123",
        };

        authMocks.updateUser.mockResolvedValue({
          data: null,
          error: { message: "Some other auth error" },
        });

        // Act & Assert
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(AuthenticationError);
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(
          "Unable to update password. Please try again."
        );

        expect(authMocks.updateUser).toHaveBeenCalledTimes(2);
        expect(authMocks.updateUser).toHaveBeenCalledWith({
          password: passwordData.password,
        });
      });

      it("should log error and throw generic Error for unexpected exception", async () => {
        // Arrange
        const passwordData = {
          password: "newpassword123",
          confirmPassword: "newpassword123",
        };

        authMocks.updateUser.mockRejectedValue(new Error("Network error"));

        // Act & Assert
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(Error);
        await expect(authService.resetPassword(passwordData)).rejects.toThrow(
          "An unexpected error occurred while updating your password. Please try again."
        );

        expect(authMocks.updateUser).toHaveBeenCalledTimes(2);
        expect(authMocks.updateUser).toHaveBeenCalledWith({
          password: passwordData.password,
        });
      });
    });
  });

  describe("updatePassword", () => {
    describe("Success Scenarios", () => {
      it("should successfully update password through update flow", async () => {
        // Arrange
        const passwordData = {
          password: "newpassword123",
          confirmPassword: "newpassword123",
        };

        const mockUser = {
          id: "user-123",
          email: "test@example.com",
        };

        authMocks.updateUser.mockResolvedValueOnce({
          data: { user: mockUser },
          error: null,
        });

        // Act & Assert
        await expect(authService.updatePassword(passwordData)).resolves.not.toThrow();

        // Assert
        expect(authMocks.updateUser).toHaveBeenCalledTimes(1);
        expect(authMocks.updateUser).toHaveBeenCalledWith({
          password: passwordData.password,
        });
      });
    });

    describe("Error Scenarios", () => {
      it("should delegate error from resetPassword method", async () => {
        // Arrange
        const passwordData = {
          password: "newpassword123",
          confirmPassword: "newpassword123",
        };

        authMocks.updateUser.mockResolvedValue({
          data: null,
          error: { message: "Invalid refresh token" },
        });

        // Act & Assert
        await expect(authService.updatePassword(passwordData)).rejects.toThrow(AuthenticationError);
        await expect(authService.updatePassword(passwordData)).rejects.toThrow(
          "Your password reset link has expired. Please request a new one."
        );

        expect(authMocks.updateUser).toHaveBeenCalledTimes(2);
        expect(authMocks.updateUser).toHaveBeenCalledWith({
          password: passwordData.password,
        });
      });
    });
  });

  describe("verifyResetToken", () => {
    describe("Success Scenarios", () => {
      it("should verify reset token and return user data when token is valid", async () => {
        // Arrange
        const tokenData = {
          token_hash: "valid-token-hash",
        };

        const mockUser = {
          id: "user-123",
          email: "user@example.com",
        };

        authMocks.verifyOtp.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        // Act
        const result = await authService.verifyResetToken(tokenData);

        // Assert
        expect(result).toEqual({
          id: "user-123",
          email: "user@example.com",
        });

        expect(authMocks.verifyOtp).toHaveBeenCalledTimes(1);
        expect(authMocks.verifyOtp).toHaveBeenCalledWith({
          token_hash: "valid-token-hash",
          type: "recovery",
        });
      });
    });

    describe("Error Scenarios", () => {
      it('should throw AuthenticationError when token has expired - "Token has expired" message', async () => {
        // Arrange
        const tokenData = {
          token_hash: "expired-token-hash",
        };

        authMocks.verifyOtp.mockResolvedValue({
          data: null,
          error: { message: "Token has expired" },
        });

        // Act & Assert
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(AuthenticationError);
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(
          "Your password reset link has expired or is invalid. Please request a new one."
        );
      });

      it('should throw AuthenticationError when token has expired - "JWT expired" message', async () => {
        // Arrange
        const tokenData = {
          token_hash: "expired-token-hash",
        };

        authMocks.verifyOtp.mockResolvedValue({
          data: null,
          error: { message: "JWT expired" },
        });

        // Act & Assert
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(AuthenticationError);
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(
          "Your password reset link has expired or is invalid. Please request a new one."
        );
      });

      it('should throw AuthenticationError when token is invalid - "Invalid token" message', async () => {
        // Arrange
        const tokenData = {
          token_hash: "invalid-token-hash",
        };

        authMocks.verifyOtp.mockResolvedValue({
          data: null,
          error: { message: "Invalid token" },
        });

        // Act & Assert
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(AuthenticationError);
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(
          "Your password reset link has expired or is invalid. Please request a new one."
        );
      });

      it("should throw AuthenticationError when invalid refresh token provided", async () => {
        // Arrange
        const tokenData = {
          token_hash: "invalid-refresh-token-hash",
        };

        authMocks.verifyOtp.mockResolvedValue({
          data: null,
          error: { message: "Invalid refresh token" },
        });

        // Act & Assert
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(AuthenticationError);
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(
          "Invalid password reset token. Please request a new one."
        );
      });

      it("should throw AuthenticationError when Supabase returns unhandled token verification error", async () => {
        // Arrange
        const tokenData = {
          token_hash: "some-token-hash",
        };

        authMocks.verifyOtp.mockResolvedValue({
          data: null,
          error: { message: "Some other auth error" },
        });

        // Act & Assert
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(AuthenticationError);
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(
          "Unable to verify password reset token. Please try again."
        );
      });

      it("should throw AuthenticationError when token verified but no user data in response", async () => {
        // Arrange
        const tokenData = {
          token_hash: "valid-token-hash",
        };

        authMocks.verifyOtp.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        // Act & Assert
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(AuthenticationError);
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(
          "Unable to verify password reset token. Please try again."
        );
      });

      it("should return user data with empty email string when email is null", async () => {
        // Arrange
        const tokenData = {
          token_hash: "valid-token-hash",
        };

        authMocks.verifyOtp.mockResolvedValue({
          data: {
            user: {
              id: "user-123",
              email: null,
            },
          },
          error: null,
        });

        // Act
        const result = await authService.verifyResetToken(tokenData);

        // Assert
        expect(result).toEqual({
          id: "user-123",
          email: "",
        });
      });

      it("should log error and throw generic Error when unexpected exception occurs", async () => {
        // Arrange
        const tokenData = {
          token_hash: "some-token-hash",
        };

        const unexpectedError = new Error("Network error");

        authMocks.verifyOtp.mockRejectedValue(unexpectedError);

        // Act & Assert
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(Error);
        await expect(authService.verifyResetToken(tokenData)).rejects.toThrow(
          "An unexpected error occurred while verifying your password reset token. Please try again."
        );
      });
    });
  });
});
