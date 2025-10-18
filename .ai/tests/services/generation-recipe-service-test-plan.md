# GenerationRecipeService Unit Test Scenarios

## Overview
This document defines comprehensive unit test scenarios for the `GenerationRecipeService` class. The service handles AI-powered recipe generation from text input, database logging, and error management.

## Key Dependencies
- **SupabaseClientType**: Database client for storing generation records and errors
- **OpenRouterService**: AI service that generates structured recipe data
- **Zod Schema**: Validates AI-generated recipe output against defined structure

---

## Test Scenarios

### 1. Happy Path - Successful Recipe Generation

**Scenario Name**: Successfully generate recipe from text with all required fields

**Prerequisites**:
- Mock `OpenRouterService.generate()` to return valid recipe JSON
- Mock `Supabase.insert()` for generation record (returns `{ id: "gen-123" }`)
- Valid `inputText` containing recipe information
- Valid `userId` string

**Expected Output**:
- Returns `GeneratedRecipeDto` with:
  - `generationId` matching the inserted database record ID ("gen-123")
  - `name` from generated recipe
  - `description` from generated recipe
  - `ingredients` array with valid structure
  - `steps` array with valid structure
- No errors thrown
- Database insertion called exactly once with correct parameters

---

### 2. OpenRouter Service Failure - Network Error

**Scenario Name**: Handle OpenRouter service network/connection errors

**Prerequisites**:
- Mock `OpenRouterService.generate()` to throw `OpenRouterError` with message "OpenRouterService: HTTP 500 Server Error"
- Mock `Supabase.insert()` for error logging (returns success)
- Valid inputs

**Expected Output**:
- Error should be re-thrown to caller
- Error logging to `generation_errors` table should be called with:
  - `user_id`: provided userId
  - `input_text`: provided inputText
  - `error_message`: "OpenRouterService: HTTP 500 Server Error"
  - `error_code`: "OpenRouterError"
- No generation record should be created in database

---

### 3. OpenRouter Service Failure - Timeout

**Scenario Name**: Handle OpenRouter service timeout (30-second limit)

**Prerequisites**:
- Mock `OpenRouterService.generate()` to throw `OpenRouterError` with message "OpenRouterService: request timed out"
- Mock `Supabase.insert()` for error logging (returns success)
- Valid inputs

**Expected Output**:
- Error should be re-thrown to caller
- Error logging called with timeout error details
- `error_code` should be "OpenRouterError"

---

### 4. Recipe Validation Failure - Invalid Schema

**Scenario Name**: Validate returned recipe against Zod schema and reject invalid data

**Prerequisites**:
- Mock `OpenRouterService.generate()` to return JSON with missing required field (e.g., missing `description`)
- Mock `Supabase.insert()` for error logging (returns success)
- Valid inputs

**Expected Output**:
- Error thrown with message containing "Failed to validate recipe"
- Error should mention the validation failure (e.g., "Recipe description is required")
- Error logged to `generation_errors` table with validation error message
- No generation record created

---

### 5. Recipe Validation Failure - Empty Ingredients Array

**Scenario Name**: Reject recipe with no ingredients

**Prerequisites**:
- Mock `OpenRouterService.generate()` to return JSON with `ingredients: []`
- Valid other fields
- Mock error logging

**Expected Output**:
- Error thrown with message "Failed to validate recipe: Recipe must have at least one ingredient"
- Error logged with schema validation error details

---

### 6. Recipe Validation Failure - Empty Steps Array

**Scenario Name**: Reject recipe with no steps

**Prerequisites**:
- Mock `OpenRouterService.generate()` to return JSON with `steps: []`
- Valid other fields
- Mock error logging

**Expected Output**:
- Error thrown with message "Failed to validate recipe: Recipe must have at least one step"
- Error logged to database

---

### 7. Recipe Validation Failure - Missing Ingredient Position

**Scenario Name**: Reject ingredient without valid position field

**Prerequisites**:
- Mock `OpenRouterService.generate()` to return JSON with ingredient missing `position` or with invalid position value
- Other ingredients and steps valid
- Mock error logging

**Expected Output**:
- Error thrown indicating position validation failure
- Error message should reference "Position must be a positive integer"

---

### 8. Recipe Validation Failure - Missing Step Position

**Scenario Name**: Reject step without valid position field

**Prerequisites**:
- Mock `OpenRouterService.generate()` to return JSON with step missing `position` or with invalid position value
- Other steps and ingredients valid
- Mock error logging

**Expected Output**:
- Error thrown with position validation error
- Error logged to database

---

### 9. Database Insertion Failure - Generation Record

**Scenario Name**: Handle database failure when inserting generation record

**Prerequisites**:
- Mock `OpenRouterService.generate()` to return valid recipe
- Mock recipe validation to succeed
- Mock `Supabase.insert()` for generation record to return error:
  - `{ error: { message: "Unique violation on user_id" }, data: null }`
- Mock error logging to succeed

**Expected Output**:
- Error thrown with message "Failed to create generation record: Unique violation on user_id"
- Error logged to `generation_errors` table
- Error log should include original input and error message

---

### 10. Database Insertion Failure - Error Logging

**Scenario Name**: Gracefully handle error logging failure without masking original error

**Prerequisites**:
- Mock `OpenRouterService.generate()` to throw an error
- Mock `Supabase.insert()` for error logging to return error
- Valid inputs

**Expected Output**:
- Original error from OpenRouter should be re-thrown
- Should not throw error from failed error logging
- Console.error should be called with "Failed to log generation error" message
- Original error message preserved for caller

---

### 11. Database Insert Returns Null Data

**Scenario Name**: Handle database insert returning null data despite no error

**Prerequisites**:
- Mock `OpenRouterService.generate()` to return valid recipe
- Mock `Supabase.insert().select().single()` to return `{ error: null, data: null }`
- Mock error logging

**Expected Output**:
- Error thrown with message "Failed to create generation record: Unknown error"
- Error logged to database

---

### 12. Multiple Ingredients Validation

**Scenario Name**: Successfully validate and process multiple ingredients with varying positions

**Prerequisites**:
- Mock `OpenRouterService.generate()` to return recipe with 5+ ingredients
- Each ingredient has valid content and sequential position (1-5)
- All other fields valid
- Mock database insert

**Expected Output**:
- Recipe accepted and processed successfully
- All ingredients preserved in exact order
- Returned DTO contains all ingredients with correct positions

---

### 13. Multiple Steps Validation

**Scenario Name**: Successfully validate and process multiple steps with varying positions

**Prerequisites**:
- Mock `OpenRouterService.generate()` to return recipe with 8+ steps
- Each step has valid content and sequential position
- All other fields valid
- Mock database insert

**Expected Output**:
- Recipe accepted successfully
- All steps preserved in exact order
- Returned DTO contains all steps with correct positions

---

### 14. Large Input Text

**Scenario Name**: Handle very large input text (edge case for payload size)

**Prerequisites**:
- `inputText` is 50KB of text
- Mock `OpenRouterService.generate()` accepts and processes large input
- Mock valid recipe generation and database operations

**Expected Output**:
- Service successfully processes large input
- Input text stored correctly in both generation record and error logs
- No truncation or data loss in database

---

### 15. Special Characters in Recipe Name

**Scenario Name**: Validate recipe name with special characters, accents, and unicode

**Prerequisites**:
- Mock `OpenRouterService.generate()` to return recipe with special characters in name
  - Example: "Żurek żytni - Tradycyjny" (Polish characters)
- Valid other fields
- Mock database insert

**Expected Output**:
- Recipe accepted and processed
- Special characters preserved in returned DTO and database
- No encoding errors

---

### 16. Special Characters in Ingredients and Steps

**Scenario Name**: Validate ingredient and step content with special characters and unicode

**Prerequisites**:
- Mock recipe with special characters in ingredient content
  - Example: "1 łyżka oliwy z oliwek" (Polish characters)
- Ingredient and step content with various unicode characters
- Mock database operations

**Expected Output**:
- All special characters preserved correctly
- No encoding errors in database or response

---

### 17. User ID Edge Case - Empty or Invalid

**Scenario Name**: Validate handling of invalid userId (though typically controlled by auth layer)

**Prerequisites**:
- `userId` is empty string or whitespace
- Valid recipe generation from OpenRouter
- Mock database operations

**Expected Output**:
- Service should pass userId as-is to database
- Database operation will determine if it's valid (testing service doesn't validate userId)
- Error logged with provided userId if operation fails

---

### 18. Concurrent Generation Requests

**Scenario Name**: Verify service can handle multiple concurrent generation requests

**Prerequisites**:
- Multiple simultaneous calls to `generateRecipeFromText()` with different userIds
- Mock `OpenRouterService.generate()` to return valid recipes
- Mock `Supabase.insert()` for database operations
- Each request has unique generation ID returned

**Expected Output**:
- All requests complete successfully
- Each returns correct generation ID from their respective database inserts
- No cross-contamination between requests
- No race conditions in database operations

---

## Testing Approach & Considerations

### Mocking Strategy
- **OpenRouterService**: Mock entire service to control success/failure scenarios
- **Supabase Client**: Mock `from()` chain returning `insert()` method with `.select().single()` chain
- **Error Logging**: Verify logging occurs without requiring actual database calls in happy path

### Schema Validation
- Test boundary conditions for Zod validation:
  - Minimum string lengths
  - Array minimums (at least 1 ingredient, 1 step)
  - Position field must be positive integer

### Error Handling Strategy
- Verify original errors are preserved and re-thrown
- Ensure error logging doesn't mask original error
- Test graceful degradation when error logging fails

### Data Integrity
- Verify all recipe data is passed unchanged through validation to DTO
- Ensure generation ID from database is correctly returned
- Test that database insert parameters match inputs exactly

### Database Transaction Concerns
- Test represents non-transactional flow (generation insert happens after validation)
- Error logging happens after main operation fails
- Service allows partial state (error logged even if generation insert fails)

