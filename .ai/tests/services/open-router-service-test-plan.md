# OpenRouterService Unit Test Plan

## Overview

This document outlines comprehensive unit test scenarios for the `OpenRouterService` class. The service handles API communication with OpenRouter AI models, including request building, HTTP communication with timeout handling, response validation, and JSON schema validation.

---

## Constructor & Initialization Tests

### 1. Valid Initialization with Complete Config

**Scenario Name:** Constructor initializes successfully with all required config

**Prerequisites:**

- Valid config object with: `apiKey`, `model`, `systemPrompt`, `jsonSchema`

**Expected Output:**

- Service instance is created successfully
- `baseUrl` defaults to "https://openrouter.ai/api/v1"
- `validator` (Ajv instance) is initialized
- No errors thrown

---

### 2. Missing API Key

**Scenario Name:** Constructor throws error when apiKey is missing

**Prerequisites:**

- Config object without `apiKey` property

**Expected Output:**

- `OpenRouterError` is thrown
- Error message: "OpenRouterService: apiKey is required"
- Service instance is not created

---

### 3. Missing Model

**Scenario Name:** Constructor throws error when model is missing

**Prerequisites:**

- Config object without `model` property (but with `apiKey` and `systemPrompt`)

**Expected Output:**

- `OpenRouterError` is thrown
- Error message: "OpenRouterService: model is required"
- Service instance is not created

---

### 4. Missing System Prompt

**Scenario Name:** Constructor throws error when systemPrompt is missing

**Prerequisites:**

- Config object without `systemPrompt` property (but with `apiKey` and `model`)

**Expected Output:**

- `OpenRouterError` is thrown
- Error message: "OpenRouterService: systemPrompt is required"
- Service instance is not created

---

### 5. Custom Base URL is Preserved

**Scenario Name:** Constructor uses custom baseUrl when provided

**Prerequisites:**

- Config object with custom `baseUrl: "https://custom-api.example.com/v1"`

**Expected Output:**

- Service initializes with custom baseUrl
- Trailing slash is removed from baseUrl

---

### 6. Custom Fetch Implementation

**Scenario Name:** Constructor accepts custom fetchImpl dependency

**Prerequisites:**

- Mock fetch function passed as second parameter
- Valid config object

**Expected Output:**

- Service instance is created
- Custom fetchImpl is used instead of global fetch

---

## Request Building Tests

### 7. Payload Structure is Correct

**Scenario Name:** buildPayload creates correctly formatted request payload

**Prerequisites:**

- Service initialized with standard config
- User message provided: "Make pasta"

**Expected Output:**

- Payload contains:
  - `model`: from config
  - `messages`: array with system and user messages
  - `stream: false`
  - `response_format`: with json_schema config
  - `json_schema.strict: true` (default)

---

### 8. Model Parameters are Included in Payload

**Scenario Name:** buildPayload includes custom model parameters

**Prerequisites:**

- Config with `modelParameters: { temperature: 0.7, max_tokens: 1000 }`
- User message provided

**Expected Output:**

- Payload includes temperature and max_tokens at root level
- All parameters properly spread into payload

---

### 9. JSON Schema with Custom Strict Mode

**Scenario Name:** buildPayload respects custom strict mode setting

**Prerequisites:**

- Config with `jsonSchema.strict: false`

**Expected Output:**

- Payload `response_format.json_schema.strict` is set to `false`

---

### 10. JSON Schema Default Strict Mode is True

**Scenario Name:** buildPayload defaults strict mode to true

**Prerequisites:**

- Config with `jsonSchema` but no `strict` property specified

**Expected Output:**

- Payload `response_format.json_schema.strict` defaults to `true`

---

## HTTP Request & Network Tests

### 11. Correct URL and HTTP Method

**Scenario Name:** send() calls the correct endpoint with POST method

**Prerequisites:**

- Mock fetch function
- Valid payload

**Expected Output:**

- Fetch is called with URL: `${baseUrl}/chat/completions`
- HTTP method is `POST`
- Request is made exactly once

---

### 12. Authorization Header is Set Correctly

**Scenario Name:** send() includes proper Authorization header

**Prerequisites:**

- Mock fetch function
- Config with `apiKey: "test-key-123"`

**Expected Output:**

- Request headers include `Authorization: Bearer test-key-123`

---

### 13. Content-Type Header is Set

**Scenario Name:** send() includes Content-Type header

**Prerequisites:**

- Mock fetch function

**Expected Output:**

- Request headers include `Content-Type: application/json`

---

### 14. Request Body is Serialized JSON

**Scenario Name:** send() sends payload as JSON string in body

**Prerequisites:**

- Mock fetch function
- Payload object

**Expected Output:**

- Request body is `JSON.stringify(payload)`
- Body can be parsed back to original payload

---

### 15. Abort Signal is Passed to Fetch

**Scenario Name:** send() includes AbortSignal with 30-second timeout

**Prerequisites:**

- Mock fetch function

**Expected Output:**

- Request includes `signal: controller.signal`
- Timeout is set to 30 seconds (30,000 ms)
- Timeout callback aborts controller after 30 seconds

---

### 16. Timeout Clears Properly on Success

**Scenario Name:** send() clears timeout after successful response

**Prerequisites:**

- Mock fetch that returns successful response
- Mock setTimeout/clearTimeout or spy

**Expected Output:**

- `clearTimeout()` is called in finally block
- Timeout is cleared even if fetch succeeds

---

## HTTP Error Handling Tests

### 17. HTTP 401 Unauthorized Response

**Scenario Name:** send() throws error for 401 response

**Prerequisites:**

- Mock fetch returning: `{ ok: false, status: 401, statusText: "Unauthorized", text: () => "Invalid API key" }`

**Expected Output:**

- `OpenRouterError` is thrown
- Error message includes: "HTTP 401 Unauthorized"
- Context includes: `{ status: 401, body: "Invalid API key" }`

---

### 18. HTTP 403 Forbidden Response

**Scenario Name:** send() throws error for 403 response

**Prerequisites:**

- Mock fetch returning: `{ ok: false, status: 403, statusText: "Forbidden", text: () => "Access denied" }`

**Expected Output:**

- `OpenRouterError` is thrown
- Error message includes: "HTTP 403 Forbidden"

---

### 19. HTTP 500 Server Error Response

**Scenario Name:** send() throws error for 500 response

**Prerequisites:**

- Mock fetch returning: `{ ok: false, status: 500, statusText: "Internal Server Error", text: () => "" }`

**Expected Output:**

- `OpenRouterError` is thrown
- Error message includes: "HTTP 500 Internal Server Error"

---

### 20. Network Request Timeout (AbortError)

**Scenario Name:** send() converts AbortError to timeout OpenRouterError

**Prerequisites:**

- Mock fetch that rejects with `DOMException('Aborted', 'AbortError')`

**Expected Output:**

- `OpenRouterError` is thrown
- Error message: "OpenRouterService: request timed out"
- Context includes: `{ code: "ETIMEDOUT" }`

---

### 21. Error Response Text Read Failure Handling

**Scenario Name:** send() handles text() rejection gracefully

**Prerequisites:**

- Mock fetch returning `{ ok: false, status: 500, text: () => Promise.reject() }`

**Expected Output:**

- Error is still thrown
- Body in context is empty string ""
- Error message is still constructed with available info

---

### 22. Non-AbortError Exceptions are Re-thrown

**Scenario Name:** send() re-throws non-timeout errors

**Prerequisites:**

- Mock fetch that rejects with non-AbortError (e.g., `new Error("Network unavailable")`)

**Expected Output:**

- Original error is re-thrown as-is (not wrapped)

---

## Response Validation Tests

### 23. Valid Response with Complete Structure

**Scenario Name:** validateResponse processes valid API response successfully

**Prerequisites:**

- Response with correct structure:
  ```json
  {
    "choices": [
      {
        "message": {
          "content": "{\"name\": \"Test\", \"description\": \"Test recipe\"}"
        }
      }
    ]
  }
  ```
- JSON schema that validates the parsed content

**Expected Output:**

- Returns: `{ raw: responseJson, json: parsedContent }`
- `raw` contains the full API response
- `json` contains the parsed and validated object

---

### 24. Missing Choices Array

**Scenario Name:** validateResponse throws error when choices is missing

**Prerequisites:**

- Response without `choices` property

**Expected Output:**

- `OpenRouterError` is thrown
- Error message: "OpenRouterService: invalid response shape (missing choices)"

---

### 25. Empty Choices Array

**Scenario Name:** validateResponse throws error when choices array is empty

**Prerequisites:**

- Response with `choices: []`

**Expected Output:**

- `OpenRouterError` is thrown
- Error message: "OpenRouterService: invalid response shape (missing choices)"

---

### 26. Missing Message in First Choice

**Scenario Name:** validateResponse throws error when message is missing

**Prerequisites:**

- Response with `choices[0]` but no `message` property

**Expected Output:**

- `OpenRouterError` is thrown
- Error message: "OpenRouterService: invalid response shape (missing content)"

---

### 27. Missing Content in Message

**Scenario Name:** validateResponse throws error when content is missing

**Prerequisites:**

- Response with `choices[0].message` but no `content` property

**Expected Output:**

- `OpenRouterError` is thrown
- Error message: "OpenRouterService: invalid response shape (missing content)"

---

### 28. Null Content Value

**Scenario Name:** validateResponse throws error when content is null

**Prerequisites:**

- Response with `choices[0].message.content: null`

**Expected Output:**

- `OpenRouterError` is thrown
- Error message: "OpenRouterService: invalid response shape (missing content)"

---

### 29. Undefined Content Value

**Scenario Name:** validateResponse throws error when content is undefined

**Prerequisites:**

- Response with `choices[0].message.content: undefined`

**Expected Output:**

- `OpenRouterError` is thrown
- Error message: "OpenRouterService: invalid response shape (missing content)"

---

## JSON Parsing Tests

### 30. Content as Valid JSON String

**Scenario Name:** validateResponse parses string content as JSON

**Prerequisites:**

- Content: `"{\"name\": \"Pasta\"}"`
- Valid schema for the parsed object

**Expected Output:**

- Content is parsed from string to object
- Parsed object is validated
- Returns: `{ raw, json: { name: "Pasta" } }`

---

### 31. Content as Already-Parsed Object

**Scenario Name:** validateResponse handles non-string content (already parsed)

**Prerequisites:**

- Content is an object (not string): `{ name: "Pasta" }`

**Expected Output:**

- Content is used directly without re-parsing
- Validation proceeds on the object

---

### 32. Invalid JSON String

**Scenario Name:** validateResponse throws error for malformed JSON

**Prerequisites:**

- Content: `"{invalid json}"`

**Expected Output:**

- `OpenRouterError` is thrown
- Error message: "OpenRouterService: content is not valid JSON"
- Context includes the invalid content

---

### 33. Empty JSON String

**Scenario Name:** validateResponse throws error for empty JSON string

**Prerequisites:**

- Content: `""`

**Expected Output:**

- `OpenRouterError` is thrown
- Error message: "OpenRouterService: content is not valid JSON"

---

## Schema Validation Tests

### 34. Response Matches Schema Requirements

**Scenario Name:** validateResponse accepts response matching schema

**Prerequisites:**

- Schema requires: `{ type: "object", properties: { name: { type: "string" } }, required: ["name"] }`
- Parsed content: `{ name: "Pasta" }`

**Expected Output:**

- Validation passes
- Returns: `{ raw, json: { name: "Pasta" } }`

---

### 35. Response Missing Required Field

**Scenario Name:** validateResponse rejects response missing required schema field

**Prerequisites:**

- Schema requires: `{ type: "object", required: ["name", "description"] }`
- Parsed content: `{ name: "Pasta" }` (missing `description`)

**Expected Output:**

- `OpenRouterError` is thrown
- Error message includes: "response does not match schema"
- Context includes validation errors

---

### 36. Response Has Wrong Field Type

**Scenario Name:** validateResponse rejects response with incorrect field type

**Prerequisites:**

- Schema requires: `{ properties: { temperature: { type: "number" } } }`
- Parsed content: `{ temperature: "high" }`

**Expected Output:**

- `OpenRouterError` is thrown
- Error message includes: "response does not match schema"

---

### 37. Multiple Schema Validation Errors

**Scenario Name:** validateResponse includes all validation errors in context

**Prerequisites:**

- Schema with multiple field requirements
- Parsed content missing multiple required fields

**Expected Output:**

- `OpenRouterError` is thrown
- Error message includes formatted validation errors
- Context includes `validationErrors` array with all errors

---

## End-to-End Integration Tests

### 38. Complete Success Flow

**Scenario Name:** generate() successfully completes full request-response cycle

**Prerequisites:**

- Mock fetch returning valid response
- Valid config with schema
- User message provided

**Expected Output:**

- `generate()` returns: `{ raw: fullResponse, json: parsedObject }`
- Fetch called exactly once
- Timeout cleared

---

### 39. Error Propagation from send()

**Scenario Name:** generate() propagates HTTP errors from send()

**Prerequisites:**

- Mock fetch returning 401 response

**Expected Output:**

- `generate()` throws `OpenRouterError` from send()
- Error not caught or transformed

---

### 40. Error Propagation from validateResponse()

**Scenario Name:** generate() propagates validation errors from validateResponse()

**Prerequisites:**

- Mock fetch returning valid response but with invalid JSON

**Expected Output:**

- `generate()` throws `OpenRouterError` from validateResponse()

---

---

## Additional Testing Considerations

### Test Environment Setup

- Use `vi.fn()` to mock fetch implementation
- Use `vi.mock('ajv')` if needed to mock schema validation
- Reset all mocks in `beforeEach()` block
- Use `vi.useFakeTimers()` for timeout testing if needed

### Snapshot Testing (Optional)

- Consider using inline snapshots for complex error messages
- Verify exact error format consistency

### Performance Considerations

- Timeout should fire exactly at 30 seconds
- No memory leaks from timers or lingering requests
- Multiple concurrent `generate()` calls should handle independently

### Type Safety

- Verify config type is strictly enforced
- Response type should be `{ raw: unknown; json: unknown }`
- Error context is properly typed as `Record<string, unknown>`

---

## Test File Organization

```
describe('OpenRouterService', () => {
  describe('Constructor', () => { /* Tests 1-6 */ });
  describe('Request Building (buildPayload)', () => { /* Tests 7-10 */ });
  describe('HTTP Communication (send)', () => { /* Tests 11-22 */ });
  describe('Response Validation (validateResponse)', () => { /* Tests 23-37 */ });
  describe('Integration (generate)', () => { /* Tests 38-40 */ });
});
```

---

## Summary

- **Total Test Scenarios:** 40
- **Constructor Tests:** 6
- **Request Building Tests:** 4
- **HTTP Request Tests:** 6
- **HTTP Error Handling Tests:** 6
- **Response Validation Tests:** 8
- **JSON Parsing Tests:** 4
- **Schema Validation Tests:** 4
- **Integration Tests:** 3

This comprehensive test plan ensures all critical paths, error cases, and edge conditions are covered without redundancy. Each test focuses on a specific behavior or error condition to maintain test clarity and maintainability.
