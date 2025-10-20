# Tag Service Unit Test Plan

## Overview

This document outlines comprehensive unit test scenarios for the `TagService` class. The service is responsible for retrieving user tags with optional search filtering from the Supabase database.

## Service Methods

The TagService has 1 public method to test:

1. `getTags()` - Retrieve all tags for a user with optional search filtering

---

## Test Scenarios by Method

### 1. getTags()

#### 1.1 Success Scenarios - No Search Query

**1.1.1 Retrieve All Tags for User (Multiple Tags)**

- **Scenario Name**: Successfully retrieve all tags for a user when no search query is provided
- **Prerequisites**:
  - Mock Supabase `from()`, `select()`, `eq()`, `order()` chain
  - Return 5 tags: [
    { id: "tag-1", name: "Vegetarian" },
    { id: "tag-2", name: "Vegan" },
    { id: "tag-3", name: "Gluten-Free" },
    { id: "tag-4", name: "Quick" },
    { id: "tag-5", name: "Dessert" }
    ]
  - User ID: "user-123"
  - No query parameter
- **Expected Output**:
  - Returns array of 5 TagDto objects in alphabetical order
  - Each TagDto contains `id` and `name` properties
  - Supabase methods called in order: from("tags") → select("id, name") → eq("user_id", "user-123") → order("name", {ascending: true})
  - `ilike()` filter NOT called (no search query)

**1.1.2 Retrieve Single Tag for User**

- **Scenario Name**: Successfully retrieve a single tag for a user
- **Prerequisites**:
  - Mock Supabase to return 1 tag: { id: "tag-1", name: "Italian" }
  - User ID: "user-456"
  - No query parameter
- **Expected Output**:
  - Returns array with 1 TagDto
  - Tag correctly mapped with id and name

**1.1.3 Retrieve No Tags for User (Empty Result)**

- **Scenario Name**: Return empty array when user has no tags
- **Prerequisites**:
  - Mock Supabase to return null data
  - User ID: "user-789"
  - No query parameter
- **Expected Output**:
  - Returns empty array: []
  - No errors thrown
  - Data mapping handles null gracefully

**1.1.4 Retrieve Tags Ordered Alphabetically**

- **Scenario Name**: Verify tags are returned in alphabetical order by name
- **Prerequisites**:
  - Mock Supabase to return tags not in alphabetical order initially
  - Return: [
    { id: "tag-1", name: "Zebra" },
    { id: "tag-2", name: "Apple" },
    { id: "tag-3", name: "Mango" }
    ]
  - User ID: "user-123"
- **Expected Output**:
  - Returns tags sorted alphabetically: Apple, Mango, Zebra
  - Verify `order("name", {ascending: true})` is called with correct parameters

#### 1.2 Success Scenarios - With Search Query

**1.2.1 Search Tags with Matching Results**

- **Scenario Name**: Successfully search tags and return filtered results
- **Prerequisites**:
  - Mock Supabase to return 2 matching tags for "Pasta" query
  - Return: [
    { id: "tag-1", name: "Pasta Primavera" },
    { id: "tag-2", name: "Pasta Carbonara" }
    ]
  - User ID: "user-123"
  - Query: "Pasta"
- **Expected Output**:
  - Returns 2 TagDto objects
  - `ilike("name", "Pasta%")` filter called (case-insensitive prefix match)
  - Only tags matching search query returned

**1.2.2 Search Tags Case-Insensitive**

- **Scenario Name**: Verify search is case-insensitive
- **Prerequisites**:
  - Mock Supabase with ilike query to match "pasta", "PASTA", "Pasta"
  - Return matching tag: { id: "tag-1", name: "Pasta" }
  - Query: "pAsTa"
- **Expected Output**:
  - Returns tag with name "Pasta"
  - Verify ilike() is used (not exact match)

**1.2.3 Search Tags with Partial Match (Prefix)**

- **Scenario Name**: Search returns only tags that start with the query (prefix match)
- **Prerequisites**:
  - Tags exist: "Italian", "Italy", "Intelligent"
  - Only "Italian" and "Italy" match query "Ital"
  - Mock Supabase with ilike("name", "Ital%")
  - Query: "Ital"
- **Expected Output**:
  - Returns 2 tags: "Italian" and "Italy"
  - Tags that contain "Ital" but don't start with it are not returned
  - Verify query string is trimmed and "%" appended: `${query.trim()}%`

**1.2.4 Search Tags No Matching Results**

- **Scenario Name**: Return empty array when search query matches no tags
- **Prerequisites**:
  - Mock Supabase to return empty array
  - Query: "NonExistentTag"
  - User ID: "user-123"
- **Expected Output**:
  - Returns empty array: []
  - No errors thrown

**1.2.5 Search with Special Characters in Query**

- **Scenario Name**: Handle special characters in search query
- **Prerequisites**:
  - Query: "Spicy & Hot"
  - Mock Supabase ilike call with trimmed query
- **Expected Output**:
  - Query passed to ilike is trimmed correctly
  - Special characters preserved: "Spicy & Hot%"
  - Database handles special character escaping

#### 1.3 Edge Cases - Query Handling

**1.3.1 Search Query is Empty String**

- **Scenario Name**: Treat empty string query as no query
- **Prerequisites**:
  - Query: ""
  - Mock Supabase to return all 3 tags
  - User ID: "user-123"
- **Expected Output**:
  - `ilike()` filter NOT called
  - Returns all tags for user (no filtering)
  - Empty string check handled: `if (query && query.trim())`

**1.3.2 Search Query is Whitespace Only**

- **Scenario Name**: Treat whitespace-only query as no query
- **Prerequisites**:
  - Query: " " (spaces only)
  - Mock Supabase to return all tags
- **Expected Output**:
  - `ilike()` filter NOT called
  - Returns all tags
  - Whitespace check handled correctly

**1.3.3 Search Query with Leading and Trailing Whitespace**

- **Scenario Name**: Trim leading and trailing whitespace from query
- **Prerequisites**:
  - Query: " Vegetarian " (with spaces)
  - Mock Supabase with ilike("name", "Vegetarian%")
- **Expected Output**:
  - Query trimmed before database query
  - Database receives: "Vegetarian%"
  - Spaces not included in search

**1.3.4 Search Query with Single Character**

- **Scenario Name**: Successfully search with single character query
- **Prerequisites**:
  - Query: "A"
  - Mock Supabase to return tags starting with "A": ["Apple", "Asian"]
- **Expected Output**:
  - Returns matching tags
  - Single character queries work correctly

**1.3.5 Search Query with Very Long String**

- **Scenario Name**: Handle very long query strings
- **Prerequisites**:
  - Query: "A very long search query with many words that is unusually long"
  - Mock Supabase with ilike call
- **Expected Output**:
  - Query passed to database with all characters preserved
  - No truncation or errors
  - Supabase handles long string

#### 1.4 Error Scenarios - Supabase Failures

**1.4.1 Database Query Fails - Supabase Error Returned**

- **Scenario Name**: Handle Supabase database error gracefully
- **Prerequisites**:
  - Mock Supabase to return error: { message: "Connection timeout" }
  - User ID: "user-123"
  - No query parameter
- **Expected Output**:
  - Error thrown: "Failed to fetch tags: Connection timeout"
  - Error message contains original database error
  - Service catches and re-throws with context

**1.4.2 Database Query Fails - Permission Denied**

- **Scenario Name**: Handle permission/authorization errors
- **Prerequisites**:
  - Mock Supabase to return error: { message: "row level security violation" }
  - User ID: "unauthorized-user"
- **Expected Output**:
  - Error thrown: "Failed to fetch tags: row level security violation"
  - Proper error message for debugging

**1.4.3 Database Query Fails - Record Not Found**

- **Scenario Name**: Handle case when query succeeds but returns null
- **Prerequisites**:
  - Mock Supabase to return null data (error is null, data is null)
  - User ID: "user-123"
- **Expected Output**:
  - Returns empty array (not error)
  - Handles null data gracefully: `(data || [])`

**1.4.4 Unexpected Error During Query Execution**

- **Scenario Name**: Handle unexpected non-database errors
- **Prerequisites**:
  - Mock Supabase to throw unexpected error: new Error("Out of memory")
  - User ID: "user-123"
- **Expected Output**:
  - Error caught and re-thrown as: "Unexpected error while fetching tags: Out of memory"
  - Distinguishes from database errors (not "Failed to fetch tags:" prefix)

**1.4.5 Unexpected Error with Non-Error Object**

- **Scenario Name**: Handle unexpected errors that are not Error instances
- **Prerequisites**:
  - Mock Supabase to throw non-Error object: { code: 500, message: "Server error" }
  - User ID: "user-123"
- **Expected Output**:
  - Error caught and handled
  - Generic error message: "Unexpected error while fetching tags: Unknown error"
  - No crash from non-Error exception

#### 1.5 Integration and Dependency Tests

**1.5.1 Supabase Query Builder Chaining**

- **Scenario Name**: Verify correct Supabase query builder method chaining
- **Prerequisites**:
  - Create spy/mock for each Supabase method
  - Call getTags("user-123")
- **Expected Output**:
  - Methods called in exact order: from() → select() → eq() → order()
  - Each method returns chainable object
  - All parameters correct:
    - from("tags")
    - select("id, name")
    - eq("user_id", "user-123")
    - order("name", {ascending: true})

**1.5.2 Supabase Query Builder with Search Filter**

- **Scenario Name**: Verify ilike method is called correctly when query provided
- **Prerequisites**:
  - Create spy for ilike method
  - Call getTags("user-123", "Pasta")
- **Expected Output**:
  - Query builder chain: from() → select() → eq() → order() → ilike()
  - ilike called with correct parameters: ("name", "Pasta%")
  - ilike called after order() for consistency

**1.5.3 Supabase Client Dependency Injection**

- **Scenario Name**: Verify service correctly uses injected Supabase client
- **Prerequisites**:
  - Create mock Supabase client
  - Inject into TagService constructor
  - Call getTags()
- **Expected Output**:
  - Service uses the injected client instance
  - Not creating new client or using static instance

#### 1.6 Data Transformation Tests

**1.6.1 Data Correctly Mapped to TagDto**

- **Scenario Name**: Verify database records are correctly transformed to TagDto
- **Prerequisites**:
  - Mock Supabase to return raw database records:
    - { id: "tag-1", name: "Vegetarian", user_id: "user-123", created_at: "2024-10-01" }
    - { id: "tag-2", name: "Vegan", user_id: "user-123", created_at: "2024-10-02" }
- **Expected Output**:
  - Returned TagDtos contain ONLY id and name:
    - { id: "tag-1", name: "Vegetarian" }
    - { id: "tag-2", name: "Vegan" }
  - user_id and created_at excluded from result
  - Mapping correctly picks only needed fields

**1.6.2 Preserve Tag Order After Mapping**

- **Scenario Name**: Verify tag order is preserved during transformation
- **Prerequisites**:
  - Database returns ordered tags: ["Apple", "Mango", "Zebra"]
  - Perform mapping operation
- **Expected Output**:
  - TagDto array maintains order: ["Apple", "Mango", "Zebra"]
  - Mapping doesn't reorder results

---

## Testing Approach & Important Considerations

### Mocking Strategy

1. **Supabase Client Mock**:
   - Mock the `SupabaseClientType` with query builder methods
   - Use `vi.fn()` for each method in the chain
   - Chain methods should return mocks that support further chaining

2. **Query Builder Chain**:
   - Mock `from()` to return object with `select()` method
   - Mock `select()` to return object with `eq()` method
   - Mock `eq()` to return object with `order()` method
   - Mock `order()` to return object with optional `ilike()` and awaitable promise
   - Mock `ilike()` to return awaitable promise

3. **Async Handling**:
   - All tests must be async
   - Mock the final query builder to return `Promise<{data, error}>`
   - Use `await` when calling getTags()

### Test Data Considerations

1. **User IDs**: Use distinct, recognizable user IDs across scenarios (e.g., "user-123", "user-456")
2. **Tag Names**: Use realistic, varied tag names (e.g., "Vegetarian", "Vegan", "Gluten-Free")
3. **Query Strings**: Use varied search patterns to test prefix matching
4. **Error Messages**: Use realistic database error messages

### Edge Cases to Emphasize

1. **Empty/Null Handling**: Verify null data returns empty array, not error
2. **Whitespace Trimming**: Ensure trimming happens before database call
3. **Case Sensitivity**: ilike() provides case-insensitive matching
4. **Error Context**: Verify error messages distinguish between database errors and unexpected errors
5. **Query Order**: Verify results are always sorted alphabetically regardless of input

### Code Coverage Goals

Ensure all execution paths are covered:

- ✅ Success path with no query
- ✅ Success path with query
- ✅ Error path with database error
- ✅ Error path with unexpected error
- ✅ Edge cases: empty/whitespace queries, null data

---

## Additional Notes

- The service uses `ilike()` for case-insensitive prefix matching (PostgreSQL feature)
- Query trimming is important to prevent unnecessary database calls with whitespace
- Error handling distinguishes between expected database errors and unexpected exceptions
- No null/undefined user ID validation is present; tests should verify behavior with valid IDs
- The service is read-only; no write operations to test
