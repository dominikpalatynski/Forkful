You need to create an implementation plan for an UpdatePasswordForm container component in Astro. You will be provided with documentation that should guide your implementation approach.

Here is the authentication specification documentation:
<auth_spec>
{{AUTH_SPEC}}
</auth_spec>

Here is the form implementation documentation:
<form_mdc>
{{FORM_MDC}}
</form_mdc>

Here is the API hooks documentation:
<api_hooks_mdc>
{{API_HOOKS_MDC}}
</api_hooks_mdc>

## API Endpoint Specification

The update password functionality uses this API endpoint:

#### Reset password
- **Method**: `POST`
- **URL**: `/api/auth/reset-password`
- **Description**: Updates the user's password using a valid reset token obtained through the password recovery flow.
- **Request Body**:
  ```json
  {
    "password": "newsecurepassword123",
    "confirmPassword": "newsecurepassword123"
  }
  ```
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: Empty response body
- **Error Responses**:
  - **Code**: `400 Bad Request` (Validation error, e.g., password mismatch, weak password)
  - **Code**: `401 Unauthorized` (Invalid or expired reset token)

## Implementation Requirements

Your implementation plan must include:

1. **UpdatePasswordForm container component** - The main component that will be used in @update-password.astro
2. **Separate API hook** - A dedicated hook for the update-password API request
3. **Token verification** - Before showing the form, there should be a request to verify-reset-token using the use-verify-reset-token hook
4. **Proper error handling** - Error printing in UpdatePasswordForm using isError and error variables exported from hooks
5. **Child components** - Any additional child components needed for the form

Follow the patterns and conventions described in the form documentation and API hooks documentation. The implementation should handle all the specified error cases and provide a good user experience.

<scratchpad>
Let me think through what components and hooks are needed:

1. I need to analyze the requirements and create a comprehensive plan
2. The main component is UpdatePasswordForm 
3. I need hooks for both token verification and password update
4. Error handling should be consistent with the documentation patterns
5. The form should follow the form documentation guidelines
6. I should list out all components and hooks that need to be implemented
</scratchpad>

Create a detailed implementation plan in markdown format that lists all the components and hooks that need to be implemented. Your plan should be structured with clear sections for components and hooks, including their responsibilities and key features.

Your final answer should be formatted as a markdown document with clear headings and bullet points listing each component and hook that needs to be created, along with their specific responsibilities and implementation details.