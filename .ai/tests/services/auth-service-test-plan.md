# AuthService Unit Test Scenarios

## Overview

This document defines comprehensive unit test scenarios for the `AuthService` class. The service handles user authentication operations through Supabase Auth, including login, registration, logout, password reset, and token verification.

## Service Methods

The AuthService has 7 public methods to test:

1. `login()` - Authenticate user with email and password
2. `register()` - Create new user account with email and password
3. `logout()` - Sign out current user and clear session
4. `forgotPassword()` - Initiate password reset by sending reset email
5. `resetPassword()` - Update user password with reset token
6. `updatePassword()` - Update user password in recovery flow (delegates to resetPassword)
7. `verifyResetToken()` - Verify password reset token and return user data

---

## Test Scenarios by Method

### 1. login()

#### 1.1 Success Scenarios

**1.1.1 Login - Successful Authentication**

- **Scenario**: User successfully signs in with valid credentials
- **Prerequisites**:
  - Mock `supabase.auth.signInWithPassword()` to return `{ data: { user: {...} }, error: null }`
  - Provide valid email and password
- **Expected Output**:
  - Method completes without throwing error
  - `signInWithPassword()` is called once with correct email and password
  - Session is established (handled by Supabase)

#### 1.2 Error Scenarios

**1.2.1 Login - Invalid Credentials Error**

- **Scenario**: Supabase returns "Invalid login credentials" error
- **Prerequisites**:
  - Mock `supabase.auth.signInWithPassword()` to return error with message "Invalid login credentials"
  - Provide email/password credentials
- **Expected Output**:
  - Throws `AuthenticationError` with message "Invalid email or password"

**1.2.2 Login - Email Not Confirmed Error**

- **Scenario**: User exists but email is not verified
- **Prerequisites**:
  - Mock `supabase.auth.signInWithPassword()` to return error with message "Email not confirmed"
  - Provide email/password
- **Expected Output**:
  - Throws `AuthenticationError` with message "Invalid email or password"

**1.2.3 Login - User Not Found Error**

- **Scenario**: User account does not exist
- **Prerequisites**:
  - Mock `supabase.auth.signInWithPassword()` to return error with message "User not found"
  - Provide email/password
- **Expected Output**:
  - Throws `AuthenticationError` with message "Invalid email or password"

**1.2.4 Login - Rate Limit Exceeded Error**

- **Scenario**: Too many login attempts from this account/IP
- **Prerequisites**:
  - Mock `supabase.auth.signInWithPassword()` to return error with message "Email rate limit exceeded"
  - Provide email/password
- **Expected Output**:
  - Throws `AuthenticationError` with message "Too many login attempts. Please try again later."

**1.2.5 Login - Generic Auth Error**

- **Scenario**: Supabase returns an unhandled auth error
- **Prerequisites**:
  - Mock `supabase.auth.signInWithPassword()` to return error with generic message (e.g., "Service unavailable")
  - Provide email/password
- **Expected Output**:
  - Throws `AuthenticationError` with message "Authentication failed. Please try again."

**1.2.6 Login - Unexpected Exception**

- **Scenario**: Non-auth error occurs during login (network issue, etc.)
- **Prerequisites**:
  - Mock `supabase.auth.signInWithPassword()` to throw unexpected error (not an auth error)
  - Provide email/password
- **Expected Output**:
  - Logs error to console
  - Throws generic `Error` with message "An unexpected error occurred during authentication. Please try again."

---

### 2. register()

#### 2.1 Success Scenarios

**2.1.1 Register - Successful Registration**

- **Scenario**: New user account is created successfully
- **Prerequisites**:
  - Mock `supabase.auth.signUp()` to return `{ data: { user: {...} }, error: null }`
  - Provide valid email and password
- **Expected Output**:
  - Method completes without throwing error
  - `signUp()` is called once with correct email and password
  - Verification email is sent automatically by Supabase

#### 2.2 Error Scenarios

**2.2.1 Register - User Already Registered (Variation 1)**

- **Scenario**: User exists with message "User already registered"
- **Prerequisites**:
  - Mock `supabase.auth.signUp()` to return error with message "User already registered"
  - Provide email/password
- **Expected Output**:
  - Throws `AuthenticationError` with message "A user with this email already exists"

**2.2.2 Register - User Already Registered (Variation 2)**

- **Scenario**: User exists with message containing "already been registered"
- **Prerequisites**:
  - Mock `supabase.auth.signUp()` to return error with message "This email has already been registered"
  - Provide email/password
- **Expected Output**:
  - Throws `AuthenticationError` with message "A user with this email already exists"

**2.2.3 Register - Password Too Weak**

- **Scenario**: Password does not meet minimum requirements
- **Prerequisites**:
  - Mock `supabase.auth.signUp()` to return error with message "Password should be at least 16 characters"
  - Provide weak password
- **Expected Output**:
  - Throws `ValidationError` with message "Password does not meet requirements"

**2.2.4 Register - Invalid Email Format**

- **Scenario**: Email address has invalid format
- **Prerequisites**:
  - Mock `supabase.auth.signUp()` to return error with message "Invalid email"
  - Provide invalid email
- **Expected Output**:
  - Throws `ValidationError` with message "Invalid email format"

**2.2.5 Register - Signup Disabled**

- **Scenario**: Registration feature is disabled
- **Prerequisites**:
  - Mock `supabase.auth.signUp()` to return error with message "Signup is disabled"
  - Provide valid email/password
- **Expected Output**:
  - Throws `AuthenticationError` with message "Registration is currently disabled"

**2.2.6 Register - Generic Auth Error**

- **Scenario**: Supabase returns unhandled registration error
- **Prerequisites**:
  - Mock `supabase.auth.signUp()` to return error with generic message (e.g., "Database error")
  - Provide valid email/password
- **Expected Output**:
  - Throws `AuthenticationError` with message "Registration failed. Please try again."

**2.2.7 Register - Unexpected Exception**

- **Scenario**: Non-auth error occurs during registration
- **Prerequisites**:
  - Mock `supabase.auth.signUp()` to throw unexpected error
  - Provide valid email/password
- **Expected Output**:
  - Logs error to console
  - Throws generic `Error` with message "An unexpected error occurred during registration. Please try again."

---

### 3. logout()

#### 3.1 Success Scenarios

**3.1.1 Logout - Successful Logout**

- **Scenario**: User is successfully signed out
- **Prerequisites**:
  - Mock `supabase.auth.signOut()` to return `{ error: null }`
  - User is currently authenticated
- **Expected Output**:
  - Method completes without throwing error
  - `signOut()` is called once
  - Session is cleared

#### 3.2 Error Scenarios

**3.2.1 Logout - Supabase Error**

- **Scenario**: Supabase returns error during logout
- **Prerequisites**:
  - Mock `supabase.auth.signOut()` to return error with message "Failed to sign out"
  - User is currently authenticated
- **Expected Output**:
  - Throws `Error` with message starting with "Logout failed:"

**3.2.2 Logout - Unexpected Exception**

- **Scenario**: Non-auth error occurs during logout
- **Prerequisites**:
  - Mock `supabase.auth.signOut()` to throw unexpected error
- **Expected Output**:
  - Logs error to console
  - Throws generic `Error` with message "An unexpected error occurred during logout. Please try again."

---

### 4. forgotPassword()

#### 4.1 Success Scenarios

**4.1.1 Forgot Password - Successful Reset Email Sent**

- **Scenario**: Password reset email is sent successfully
- **Prerequisites**:
  - Mock `supabase.auth.resetPasswordForEmail()` to return `{ error: null }`
  - Provide valid email
  - Provide valid redirect URL
- **Expected Output**:
  - Method completes without throwing error
  - `resetPasswordForEmail()` is called once with email and redirect URL
  - Reset email is sent (or would be sent to prevent email enumeration)

#### 4.2 Error Scenarios

**4.2.1 Forgot Password - Invalid Email Format**

- **Scenario**: Email validation fails
- **Prerequisites**:
  - Mock `supabase.auth.resetPasswordForEmail()` to return error with message "Invalid email"
  - Provide invalid email format
- **Expected Output**:
  - Throws `ValidationError` with message "Invalid email format"

**4.2.2 Forgot Password - Rate Limit Exceeded**

- **Scenario**: Too many password reset requests
- **Prerequisites**:
  - Mock `supabase.auth.resetPasswordForEmail()` to return error with message "Email rate limit exceeded"
  - Provide valid email
- **Expected Output**:
  - Throws `ValidationError` with message "Too many password reset requests. Please try again later."

**4.2.3 Forgot Password - Generic Auth Error**

- **Scenario**: Supabase returns unhandled password reset error
- **Prerequisites**:
  - Mock `supabase.auth.resetPasswordForEmail()` to return error with generic message
  - Provide valid email
- **Expected Output**:
  - Throws `ValidationError` with message "Unable to process password reset request. Please try again."
  - Note: No email existence revealed for security reasons

**4.2.4 Forgot Password - Unexpected Exception**

- **Scenario**: Non-auth error occurs during password reset
- **Prerequisites**:
  - Mock `supabase.auth.resetPasswordForEmail()` to throw unexpected error
  - Provide valid email
- **Expected Output**:
  - Logs error to console
  - Throws generic `Error` with message "An unexpected error occurred while processing your password reset request. Please try again."

**4.2.5 Forgot Password - URL Encoding**

- **Scenario**: Redirect URL is properly passed to Supabase
- **Prerequisites**:
  - Mock `supabase.auth.resetPasswordForEmail()` to return `{ error: null }`
  - Provide URL with special characters (e.g., "https://example.com:3000/auth/reset-password")
- **Expected Output**:
  - Method completes successfully
  - `resetPasswordForEmail()` is called with full redirect URL: `${url}/auth/reset-password`

---

### 5. resetPassword()

#### 5.1 Success Scenarios

**5.1.1 Reset Password - Successful Password Update**

- **Scenario**: User password is successfully updated with reset token
- **Prerequisites**:
  - Mock `supabase.auth.updateUser()` to return `{ data: { user: {...} }, error: null }`
  - Provide new password
- **Expected Output**:
  - Method completes without throwing error
  - `updateUser()` is called once with new password
  - Password is updated in Supabase

#### 5.2 Error Scenarios

**5.2.1 Reset Password - Invalid Refresh Token**

- **Scenario**: Reset token is invalid
- **Prerequisites**:
  - Mock `supabase.auth.updateUser()` to return error with message "Invalid refresh token"
  - Provide new password
- **Expected Output**:
  - Throws `AuthenticationError` with message "Your password reset link has expired. Please request a new one."

**5.2.2 Reset Password - Token Expired (Variation 1)**

- **Scenario**: Reset token has expired - "Token has expired" message
- **Prerequisites**:
  - Mock `supabase.auth.updateUser()` to return error with message "Token has expired"
  - Provide new password
- **Expected Output**:
  - Throws `AuthenticationError` with message "Your password reset link has expired. Please request a new one."

**5.2.3 Reset Password - Token Expired (Variation 2)**

- **Scenario**: Reset token has expired - "JWT expired" message
- **Prerequisites**:
  - Mock `supabase.auth.updateUser()` to return error with message "JWT expired"
  - Provide new password
- **Expected Output**:
  - Throws `AuthenticationError` with message "Your password reset link has expired. Please request a new one."

**5.2.4 Reset Password - Password Too Weak**

- **Scenario**: New password does not meet requirements
- **Prerequisites**:
  - Mock `supabase.auth.updateUser()` to return error with message "Password should be at least 16 characters"
  - Provide weak password
- **Expected Output**:
  - Throws `ValidationError` with message "Password does not meet requirements"

**5.2.5 Reset Password - Password Same As Current**

- **Scenario**: User tries to set new password identical to current password
- **Prerequisites**:
  - Mock `supabase.auth.updateUser()` to return error with message "New password should be different from your current password"
  - Provide password same as current
- **Expected Output**:
  - Throws `ValidationError` with message "New password must be different from your current password"

**5.2.6 Reset Password - Generic Auth Error**

- **Scenario**: Supabase returns unhandled password update error
- **Prerequisites**:
  - Mock `supabase.auth.updateUser()` to return error with generic message
  - Provide new password
- **Expected Output**:
  - Throws `AuthenticationError` with message "Unable to update password. Please try again."

**5.2.7 Reset Password - Unexpected Exception**

- **Scenario**: Non-auth error occurs during password reset
- **Prerequisites**:
  - Mock `supabase.auth.updateUser()` to throw unexpected error
  - Provide new password
- **Expected Output**:
  - Logs error to console
  - Throws generic `Error` with message "An unexpected error occurred while updating your password. Please try again."

---

### 6. updatePassword()

#### 6.1 Success Scenarios

**6.1.1 Update Password - Successful Password Update**

- **Scenario**: User password is successfully updated through update flow
- **Prerequisites**:
  - Mock `supabase.auth.updateUser()` to return `{ data: { user: {...} }, error: null }`
  - Provide new password data
- **Expected Output**:
  - Method completes without throwing error
  - Internally delegates to `resetPassword()` method
  - Password is updated

#### 6.2 Error Scenarios

**6.2.1 Update Password - Delegates Error from Reset Password**

- **Scenario**: Error from resetPassword is properly propagated
- **Prerequisites**:
  - Mock `supabase.auth.updateUser()` to return error with message "Invalid refresh token"
  - Provide new password data
- **Expected Output**:
  - Throws `AuthenticationError` from `resetPassword()` method
  - Error message: "Your password reset link has expired. Please request a new one."

---

### 7. verifyResetToken()

#### 7.1 Success Scenarios

**7.1.1 Verify Reset Token - Successful Token Verification**

- **Scenario**: Reset token is valid and user data is returned
- **Prerequisites**:
  - Mock `supabase.auth.verifyOtp()` to return `{ data: { user: { id: 'user-123', email: 'user@example.com' } }, error: null }`
  - Provide valid token hash
- **Expected Output**:
  - Method returns object with `{ id: 'user-123', email: 'user@example.com' }`
  - `verifyOtp()` is called with token_hash and type 'recovery'

#### 7.2 Error Scenarios

**7.2.1 Verify Reset Token - Token Expired (Variation 1)**

- **Scenario**: Reset token has expired - "Token has expired" message
- **Prerequisites**:
  - Mock `supabase.auth.verifyOtp()` to return error with message "Token has expired"
  - Provide expired token
- **Expected Output**:
  - Throws `AuthenticationError` with message "Your password reset link has expired or is invalid. Please request a new one."

**7.2.2 Verify Reset Token - Token Expired (Variation 2)**

- **Scenario**: Reset token has expired - "JWT expired" message
- **Prerequisites**:
  - Mock `supabase.auth.verifyOtp()` to return error with message "JWT expired"
  - Provide expired token
- **Expected Output**:
  - Throws `AuthenticationError` with message "Your password reset link has expired or is invalid. Please request a new one."

**7.2.3 Verify Reset Token - Invalid Token (Variation 1)**

- **Scenario**: Reset token is invalid - "Invalid token" message
- **Prerequisites**:
  - Mock `supabase.auth.verifyOtp()` to return error with message "Invalid token"
  - Provide invalid token
- **Expected Output**:
  - Throws `AuthenticationError` with message "Your password reset link has expired or is invalid. Please request a new one."

**7.2.4 Verify Reset Token - Invalid Refresh Token**

- **Scenario**: Invalid refresh token provided
- **Prerequisites**:
  - Mock `supabase.auth.verifyOtp()` to return error with message "Invalid refresh token"
  - Provide invalid refresh token
- **Expected Output**:
  - Throws `AuthenticationError` with message "Invalid password reset token. Please request a new one."

**7.2.5 Verify Reset Token - Generic Auth Error**

- **Scenario**: Supabase returns unhandled token verification error
- **Prerequisites**:
  - Mock `supabase.auth.verifyOtp()` to return error with generic message
  - Provide token
- **Expected Output**:
  - Throws `AuthenticationError` with message "Unable to verify password reset token. Please try again."

**7.2.6 Verify Reset Token - No User Data Returned**

- **Scenario**: Token verified but no user data in response
- **Prerequisites**:
  - Mock `supabase.auth.verifyOtp()` to return `{ data: { user: null }, error: null }`
  - Provide valid token hash
- **Expected Output**:
  - Throws `AuthenticationError` with message "Unable to verify password reset token. Please try again."

**7.2.7 Verify Reset Token - User Data Missing Email**

- **Scenario**: Token verified but email is null/undefined
- **Prerequisites**:
  - Mock `supabase.auth.verifyOtp()` to return `{ data: { user: { id: 'user-123', email: null } }, error: null }`
  - Provide valid token hash
- **Expected Output**:
  - Method returns object with `{ id: 'user-123', email: '' }` (empty string for missing email)

**7.2.8 Verify Reset Token - Unexpected Exception**

- **Scenario**: Non-auth error occurs during token verification
- **Prerequisites**:
  - Mock `supabase.auth.verifyOtp()` to throw unexpected error
  - Provide token
- **Expected Output**:
  - Logs error to console
  - Throws generic `Error` with message "An unexpected error occurred while verifying your password reset token. Please try again."

---

## Mocking Strategy

### Supabase Client Mock Pattern

All tests should mock the Supabase Auth client using Vitest's `vi.fn()` and `vi.spyOn()`:

```typescript
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: {...} },
      error: null
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: {...} },
      error: null
    }),
    signOut: vi.fn().mockResolvedValue({
      error: null
    }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({
      error: null
    }),
    updateUser: vi.fn().mockResolvedValue({
      data: { user: {...} },
      error: null
    }),
    verifyOtp: vi.fn().mockResolvedValue({
      data: { user: {...} },
      error: null
    }),
  }
};
```

### Error Response Pattern

Supabase errors should be mocked with:

```typescript
{ data: null, error: { message: "error message", code: "ERROR_CODE" } }
```

### Throwing Errors

To test unexpected exceptions:

```typescript
vi.fn().mockRejectedValue(new Error("Unexpected error"));
```

---

## Testing Considerations

### 1. Error Class Testing

- Verify `AuthenticationError` and `ValidationError` are properly constructed
- Test that error names and messages are correctly set
- Ensure errors can be caught with instanceof checks

### 2. Custom Error Handling

- Verify that custom errors are re-thrown as-is
- Verify that unexpected errors are caught and wrapped with user-friendly messages
- Ensure console.error is called for unexpected errors

### 3. Error Message Variations

- Test multiple variations of error messages from Supabase
- Some errors have multiple possible message variations (e.g., token expiration)
- Ensure all variations are handled correctly

### 4. Async Operations

- All Supabase calls are async and return promises
- Tests should properly await all async operations
- Verify proper promise rejection handling

### 5. Edge Cases

- Missing or null email addresses in responses
- Special characters in URLs for redirect links
- Different error message patterns from different Supabase versions
- Empty user data in successful responses

### 6. Security Considerations

- Password reset endpoint should not reveal whether email exists (prevent email enumeration)
- Verify generic error messages are used when appropriate
- Test that sensitive information is not logged

---

## Test Organization

Recommended file structure:

```
src/lib/services/__tests__/
  ├── auth.service.test.ts (main test file)
  ├── auth.service.login.test.ts (optionally split by method)
  ├── auth.service.register.test.ts
  ├── auth.service.logout.test.ts
  ├── auth.service.forgotPassword.test.ts
  ├── auth.service.resetPassword.test.ts
  ├── auth.service.updatePassword.test.ts
  └── auth.service.verifyResetToken.test.ts
```

Or use a single test file with `describe` blocks for each method.

---

## Dependencies to Mock

- `SupabaseClientType` - The Supabase Auth client
- All Auth API methods: `signInWithPassword()`, `signUp()`, `signOut()`, `resetPasswordForEmail()`, `updateUser()`, `verifyOtp()`

---

## Notes

1. The service implements comprehensive error handling with custom error classes
2. Distinction between `AuthenticationError` and `ValidationError` is important for error handling
3. Password reset flow includes email enumeration protection (always return success)
4. Token verification uses Supabase's OTP verification with type 'recovery'
5. `updatePassword()` delegates to `resetPassword()` - tests should verify this delegation
6. All async operations must be properly awaited in tests
7. Console.error calls should be mocked and verified for unexpected error scenarios
8. Error messages are user-friendly and don't expose sensitive information
