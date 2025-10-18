# Recipe Service Unit Test Plan

## Overview

This document outlines comprehensive unit test scenarios for the `RecipeService` class. The service is responsible for managing recipe operations including creation, retrieval, updating, and deletion with proper authorization checks and transactional rollback capabilities.

## Service Methods

The RecipeService has 5 public methods to test:
1. `createRecipe()` - Create a new recipe with related data
2. `getRecipeById()` - Retrieve a single recipe
3. `getRecipesForUser()` - Retrieve paginated list of recipes
4. `updateRecipe()` - Update an existing recipe
5. `deleteRecipe()` - Delete a recipe

---

## Test Scenarios by Method

### 1. createRecipe()

#### 1.1 Success Scenarios

**1.1.1 Create Recipe with Full Data**
- **Scenario Name**: Successfully create recipe with all fields (name, description, ingredients, steps, tags)
- **Prerequisites**:
  - Mock Supabase with successful responses for all operations
  - Provide CreateRecipeCommand with: name, description, generationId, ingredients (3 items), steps (2 items), tags (2 items)
  - User ID: "user-123"
- **Expected Output**:
  - Recipe created in recipes table
  - All ingredients inserted
  - All steps inserted
  - New tags created (if not existing)
  - Recipe-tag associations created
  - Generation record marked as accepted (if generationId provided)
  - Returns RecipeDetailDto with all related data

**1.1.2 Create Minimal Recipe (Name Only)**
- **Scenario Name**: Successfully create recipe with only required name field
- **Prerequisites**:
  - Mock Supabase with successful responses
  - Provide CreateRecipeCommand with: name only
  - Optional fields: description, generationId, ingredients, steps, tags (all omitted)
- **Expected Output**:
  - Recipe created with null description
  - Empty arrays for ingredients, steps, tags in returned DTO
  - No database calls for ingredients/steps/tags
  - Returns valid RecipeDetailDto

**1.1.3 Create Recipe with Existing Tags**
- **Scenario Name**: Create recipe with tags that already exist for the user
- **Prerequisites**:
  - Mock Supabase with:
    - Recipe insert succeeds
    - Tag select returns existing tags for both provided tag names
    - No tag inserts needed, only recipe-tag associations
  - Provide: name, tags: ["Vegetarian", "Quick"]
- **Expected Output**:
  - Recipe created
  - No new tags inserted
  - Recipe-tag associations created with existing tag IDs
  - Returns recipe with correct tags

**1.1.4 Create Recipe with Mixed New and Existing Tags**
- **Scenario Name**: Create recipe where some tags exist and some are new
- **Prerequisites**:
  - Mock Supabase with:
    - First tag select returns existing tag for "Vegetarian"
    - Second tag select returns null, requiring new tag creation for "Experimental"
  - Provide: tags: ["Vegetarian", "Experimental"]
- **Expected Output**:
  - "Vegetarian" tag linked via existing ID
  - "Experimental" tag created with new ID
  - Both tags associated with recipe
  - Returns recipe with both tags

**1.1.5 Create Recipe without Generation ID**
- **Scenario Name**: Create recipe without linking to a generation record
- **Prerequisites**:
  - Mock Supabase (all operations except generation update)
  - Provide CreateRecipeCommand with: name, description, ingredients, steps, tags
  - generationId: undefined or omitted
- **Expected Output**:
  - Recipe created with null generation_id
  - No database call to generation table
  - Returns complete recipe DTO

#### 1.2 Error Scenarios

**1.2.1 Recipe Insert Fails**
- **Scenario Name**: Fail when initial recipe insert fails
- **Prerequisites**:
  - Mock Supabase recipe insert to return error
  - recipeError: { message: "UNIQUE violation" }
- **Expected Output**:
  - Error thrown: "Failed to create recipe: UNIQUE violation"
  - No rollback needed (recipeId is null)
  - All subsequent operations skipped

**1.2.2 Ingredient Insert Fails - Rollback Triggered**
- **Scenario Name**: Rollback recipe creation when ingredient insert fails
- **Prerequisites**:
  - Mock Supabase with:
    - Recipe insert succeeds with id "recipe-123"
    - Ingredient insert fails with error: { message: "Column content cannot be null" }
  - Provide: name, ingredients: [{ content: "", position: 1 }]
- **Expected Output**:
  - Error thrown: "Failed to insert ingredients: Column content cannot be null"
  - Rollback executed: recipe deleted
  - recipe_tags deleted (if any)
  - All related data cleaned up

**1.2.3 Step Insert Fails - Rollback Triggered**
- **Scenario Name**: Rollback recipe creation when step insert fails
- **Prerequisites**:
  - Mock Supabase with:
    - Recipe insert succeeds
    - Ingredients insert succeeds
    - Steps insert fails with error: { message: "Invalid position value" }
  - Provide: name, steps: [{ content: "...", position: -1 }]
- **Expected Output**:
  - Error thrown: "Failed to insert steps: Invalid position value"
  - Rollback executed: all data deleted
  - No recipe or related data left

**1.2.4 Tag Creation Fails - Rollback Triggered**
- **Scenario Name**: Rollback when creating new tag fails
- **Prerequisites**:
  - Mock Supabase with:
    - Recipe and ingredients insert succeed
    - Tag select returns null (tag doesn't exist)
    - Tag insert fails with error: { message: "Database connection lost" }
  - Provide: tags: ["NewTag"]
- **Expected Output**:
  - Error thrown: "Failed to create tag 'NewTag': Database connection lost"
  - Complete rollback executed
  - Recipe and all related data deleted

**1.2.5 Tag Linking Fails - Rollback Triggered**
- **Scenario Name**: Rollback when linking tags to recipe fails
- **Prerequisites**:
  - Mock Supabase with:
    - Recipe, ingredients, steps inserts succeed
    - Tag operations succeed
    - recipe_tags insert fails: { message: "Foreign key constraint violated" }
- **Expected Output**:
  - Error thrown: "Failed to link tags to recipe: Foreign key constraint violated"
  - Complete rollback executed

**1.2.6 Generation Update Fails - Rollback Triggered**
- **Scenario Name**: Rollback when updating generation record fails
- **Prerequisites**:
  - Mock Supabase with:
    - All recipe/ingredient/step/tag operations succeed
    - Generation update fails: { message: "Generation record not found" }
  - Provide: generationId: "gen-123"
- **Expected Output**:
  - Error thrown: "Failed to update generation record: Generation record not found"
  - Complete rollback executed

**1.2.7 GetRecipeById Fails After Successful Creation**
- **Scenario Name**: Fail when fetching created recipe returns error
- **Prerequisites**:
  - Mock Supabase with:
    - All insert operations succeed, recipeId: "recipe-123"
    - Final getRecipeById call fails with error
- **Expected Output**:
  - Error thrown during fetch phase
  - Rollback executed to clean up orphaned recipe

**1.2.8 Schema Validation Fails on Created Recipe**
- **Scenario Name**: Invalid recipe structure returned from database
- **Prerequisites**:
  - Mock Supabase to return malformed recipe data (missing required fields)
  - During final fetch, response doesn't match SupabaseRecipeWithJoinsSchema
- **Expected Output**:
  - Error thrown: "Invalid recipe data structure: ..."
  - Rollback executed

---

### 2. getRecipeById()

#### 2.1 Success Scenarios

**2.1.1 Get Recipe - User Owns Recipe**
- **Scenario Name**: Successfully retrieve full recipe details when user is authorized
- **Prerequisites**:
  - Mock Supabase with:
    - Existence check returns: { id: "recipe-123", user_id: "user-123" }
    - Full fetch returns valid recipe with ingredients, steps, tags
  - Recipe ID: "recipe-123", User ID: "user-123"
- **Expected Output**:
  - Query executes without errors
  - Returns RecipeDetailDto with all fields
  - Ingredients and steps sorted by position
  - Tags correctly mapped from nested structure
  - No authorization error

**2.1.2 Get Recipe with No Ingredients**
- **Scenario Name**: Successfully retrieve recipe with null/empty ingredients array
- **Prerequisites**:
  - Mock Supabase to return recipe with ingredients: null
  - User owns the recipe
- **Expected Output**:
  - Returns RecipeDetailDto with empty ingredients array
  - Steps and tags included normally
  - No errors

**2.1.3 Get Recipe with No Steps**
- **Scenario Name**: Successfully retrieve recipe with null/empty steps array
- **Prerequisites**:
  - Mock Supabase to return recipe with steps: null
- **Expected Output**:
  - Returns RecipeDetailDto with empty steps array
  - Ingredients and tags included normally

**2.1.4 Get Recipe with No Tags**
- **Scenario Name**: Successfully retrieve recipe with null/empty tags array
- **Prerequisites**:
  - Mock Supabase to return recipe with recipe_tags: null or []
- **Expected Output**:
  - Returns RecipeDetailDto with empty tags array
  - Other fields included normally

**2.1.5 Get Recipe - Ingredients/Steps Sorted Correctly**
- **Scenario Name**: Verify ingredients and steps are sorted by position
- **Prerequisites**:
  - Mock Supabase to return:
    - Ingredients with positions: [3, 1, 2]
    - Steps with positions: [2, 1, 3]
- **Expected Output**:
  - Returned DTO has ingredients sorted: [1, 2, 3]
  - Returned DTO has steps sorted: [1, 2, 3]

#### 2.2 Authorization Error Scenarios

**2.2.1 Recipe Not Found**
- **Scenario Name**: Throw NotFoundError when recipe doesn't exist
- **Prerequisites**:
  - Mock Supabase existence check to return PGRST116 error (no rows)
  - Recipe ID: "non-existent-id"
- **Expected Output**:
  - NotFoundError thrown with message: "Recipe with ID 'non-existent-id' not found"
  - No second database query executed

**2.2.2 Recipe Not Found - Null Response**
- **Scenario Name**: Throw NotFoundError when recipe query returns null
- **Prerequisites**:
  - Mock Supabase to return no error but data: null
- **Expected Output**:
  - NotFoundError thrown: "Recipe with ID '...' not found"

**2.2.3 Access Denied - User Doesn't Own Recipe**
- **Scenario Name**: Throw ForbiddenError when user doesn't own recipe
- **Prerequisites**:
  - Mock Supabase existence check returns: { id: "recipe-123", user_id: "owner-user-123" }
  - Accessing user: "different-user-456"
- **Expected Output**:
  - ForbiddenError thrown: "Access denied. You don't have permission to view this recipe"
  - No full recipe fetch executed

#### 2.3 Database Error Scenarios

**2.3.1 Existence Check Database Error**
- **Scenario Name**: Fail when checking recipe existence encounters database error
- **Prerequisites**:
  - Mock Supabase existence check to return error (not PGRST116): { message: "Connection timeout" }
- **Expected Output**:
  - Error thrown: "Failed to check recipe existence: Connection timeout"
  - No authorization check performed

**2.3.2 Recipe Fetch Database Error**
- **Scenario Name**: Fail when fetching full recipe details encounters database error
- **Prerequisites**:
  - Mock existence check to succeed
  - Mock full fetch to return error: { message: "Query failed" }
- **Expected Output**:
  - Error thrown: "Failed to fetch recipe details: Query failed"

**2.3.3 Schema Validation Fails**
- **Scenario Name**: Fail when fetched recipe data doesn't match schema
- **Prerequisites**:
  - Mock Supabase to return recipe with invalid structure (missing id, malformed nested data)
- **Expected Output**:
  - Error thrown: "Invalid recipe data structure: ..."

---

### 3. getRecipesForUser()

#### 3.1 Success Scenarios

**3.1.1 Get Recipes - Default Options (Page 1, No Filter)**
- **Scenario Name**: Retrieve first page of recipes with default sort (created_at, desc)
- **Prerequisites**:
  - Mock Supabase with recipes count and data
  - Options: { page: 1, pageSize: 10, sortBy: "created_at", order: "desc", tag: undefined }
  - Return 8 recipes, count: 8
  - User ID: "user-123"
- **Expected Output**:
  - Returns PaginatedRecipesDto with:
    - data: RecipeListItemDto[] (8 items)
    - pagination: { page: 1, pageSize: 10, totalItems: 8, totalPages: 1 }
  - Query uses baseSelect (not tagFilteredSelect)

**3.1.2 Get Recipes - With Tag Filter**
- **Scenario Name**: Retrieve recipes filtered by specific tag
- **Prerequisites**:
  - Mock Supabase with:
    - Using tagFilteredSelect (inner joins)
    - Return 3 recipes tagged with "Vegetarian"
    - count: 3
  - Options: { page: 1, pageSize: 10, tag: "Vegetarian" }
- **Expected Output**:
  - Query uses inner joins for tag filtering
  - Returns 3 recipes with Vegetarian tag
  - Pagination shows totalPages: 1

**3.1.3 Get Recipes - Sort by Name Ascending**
- **Scenario Name**: Retrieve recipes sorted by name in ascending order
- **Prerequisites**:
  - Mock Supabase to sort by name, ascending
  - Return recipes: [{ name: "Apple Pie" }, { name: "Bread" }, { name: "Cake" }]
  - Options: { sortBy: "name", order: "asc" }
- **Expected Output**:
  - Recipes in DTO appear in name ascending order
  - Query called with order(sortBy, { ascending: true })

**3.1.4 Get Recipes - Sort by Created_At Ascending**
- **Scenario Name**: Retrieve recipes sorted by created_at in ascending order
- **Prerequisites**:
  - Options: { sortBy: "created_at", order: "asc" }
  - Return oldest recipes first
- **Expected Output**:
  - Recipes sorted by creation date (oldest first)
  - Query called with correct ascending flag

**3.1.5 Get Recipes - Pagination Multiple Pages**
- **Scenario Name**: Retrieve different pages of recipes
- **Prerequisites**:
  - Mock Supabase with 25 total recipes, pageSize: 10
  - Request: page: 2
- **Expected Output**:
  - Query range: from (1)*10 = 10, to 19
  - Pagination shows: page: 2, totalPages: 3, totalItems: 25
  - data: 10 items (recipes 11-20)

**3.1.6 Get Recipes - Last Page with Partial Results**
- **Scenario Name**: Retrieve last page with fewer items than pageSize
- **Prerequisites**:
  - Total recipes: 25, pageSize: 10
  - Request: page: 3
- **Expected Output**:
  - Query range: from 20, to 29
  - Returns 5 recipes
  - Pagination shows: totalPages: 3, data.length: 5

**3.1.7 Get Recipes - Empty Results**
- **Scenario Name**: Return empty list when no recipes exist
- **Prerequisites**:
  - Mock Supabase to return: data: [], count: 0
  - Options: { page: 1, pageSize: 10 }
- **Expected Output**:
  - Returns PaginatedRecipesDto with:
    - data: []
    - pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 }

**3.1.8 Get Recipes - Tag Filter Returns Empty**
- **Scenario Name**: Return empty list when tag filter matches no recipes
- **Prerequisites**:
  - Tag filter: "NonexistentTag"
  - Mock Supabase to return: data: [], count: 0
- **Expected Output**:
  - data: []
  - totalItems: 0, totalPages: 0

**3.1.9 Get Recipes - Large Page Size**
- **Scenario Name**: Retrieve all recipes in single page with pageSize > total count
- **Prerequisites**:
  - Total recipes: 5, pageSize: 100
- **Expected Output**:
  - Returns all 5 recipes
  - pagination: { page: 1, pageSize: 100, totalItems: 5, totalPages: 1 }

**3.1.10 Get Recipes - Recipes with Mixed Tags**
- **Scenario Name**: Return recipes with correctly mapped tags
- **Prerequisites**:
  - Mock Supabase to return recipes with varying numbers of tags
  - Recipe 1: tags: ["Vegetarian", "Quick"]
  - Recipe 2: tags: ["Pasta"]
  - Recipe 3: tags: [] (no tags)
- **Expected Output**:
  - Each recipe has correct tags array in DTO
  - Tags correctly extracted from nested structure

#### 3.2 Error Scenarios

**3.2.1 Database Query Fails**
- **Scenario Name**: Fail when database query encounters error
- **Prerequisites**:
  - Mock Supabase to return error: { message: "Database connection lost" }
- **Expected Output**:
  - Error thrown: "Failed to get recipes for user: Failed to fetch recipes: Database connection lost"

**3.2.2 Schema Validation Fails**
- **Scenario Name**: Fail when recipe data doesn't match schema
- **Prerequisites**:
  - Mock Supabase to return recipes with invalid structure (missing id)
- **Expected Output**:
  - Error thrown: "Failed to get recipes for user: Invalid recipe data structure: ..."

**3.2.3 Count is Null**
- **Scenario Name**: Handle null count from Supabase gracefully
- **Prerequisites**:
  - Mock Supabase to return: count: null, data: [recipes...]
- **Expected Output**:
  - totalItems calculated as 0 (null coalesced)
  - totalPages: 0
  - Returns successfully (no error)

---

### 4. updateRecipe()

#### 4.1 Success Scenarios

**4.1.1 Update Recipe - All Fields**
- **Scenario Name**: Successfully update recipe name, description, ingredients, steps, and tags
- **Prerequisites**:
  - Mock Supabase with:
    - Recipe exists and user owns it
    - All update operations succeed
  - Recipe ID: "recipe-123", User ID: "user-123"
  - UpdateRecipeCommand: name, description, ingredients (add, update, delete), steps (add, update, delete), tags (new set)
- **Expected Output**:
  - Recipe fields updated
  - Ingredients: old deleted, existing updated, new inserted
  - Steps: old deleted, existing updated, new inserted
  - Tags: all associations deleted, new tags created/linked
  - Returns updated RecipeDetailDto

**4.1.2 Update Recipe - Name and Description Only**
- **Scenario Name**: Update only recipe metadata without changing ingredients/steps/tags
- **Prerequisites**:
  - UpdateRecipeCommand with:
    - name: "New Name"
    - description: "New description"
    - ingredients: [] (keep existing)
    - steps: [] (keep existing)
    - tags: [] (keep existing)
- **Expected Output**:
  - Only recipe name/description updated
  - No ingredient/step/tag operations performed
  - Returns recipe with new metadata but same related data

**4.1.3 Update Recipe - Add Ingredients**
- **Scenario Name**: Add new ingredients to existing recipe
- **Prerequisites**:
  - Recipe has 2 existing ingredients
  - UpdateRecipeCommand with: ingredients: [existing-1, existing-2, new-1, new-2]
- **Expected Output**:
  - Existing ingredients updated with new positions
  - New ingredients inserted
  - No ingredients deleted
  - Returns recipe with 4 ingredients

**4.1.4 Update Recipe - Remove Ingredients**
- **Scenario Name**: Delete ingredients from recipe
- **Prerequisites**:
  - Recipe has 3 ingredients (IDs: ing-1, ing-2, ing-3)
  - UpdateRecipeCommand with: ingredients: [ing-1, ing-3] (ing-2 removed)
- **Expected Output**:
  - ing-1 and ing-3 updated
  - ing-2 deleted from database
  - Returns recipe with 2 ingredients

**4.1.5 Update Recipe - Replace All Ingredients**
- **Scenario Name**: Remove all existing ingredients and add new ones
- **Prerequisites**:
  - Recipe has 2 ingredients
  - UpdateRecipeCommand with: ingredients: [new-1, new-2, new-3]
- **Expected Output**:
  - All old ingredients deleted
  - New ingredients inserted
  - Returns recipe with 3 new ingredients

**4.1.6 Update Recipe - Clear All Ingredients**
- **Scenario Name**: Remove all ingredients from recipe
- **Prerequisites**:
  - Recipe has 2 ingredients
  - UpdateRecipeCommand with: ingredients: []
- **Expected Output**:
  - All ingredients deleted
  - Returns recipe with empty ingredients array

**4.1.7 Update Recipe - Add/Remove/Update Tags**
- **Scenario Name**: Update tags: add new, keep some, remove some
- **Prerequisites**:
  - Recipe has tags: ["Vegetarian", "Quick"]
  - UpdateRecipeCommand with tags: ["Vegetarian", "Easy", "New"]
- **Expected Output**:
  - All recipe_tags deleted
  - "Vegetarian" tag re-linked
  - "Easy" tag created/linked
  - "New" tag created/linked
  - "Quick" tag removed
  - Returns recipe with ["Vegetarian", "Easy", "New"]

**4.1.8 Update Recipe - Clear All Tags**
- **Scenario Name**: Remove all tags from recipe
- **Prerequisites**:
  - UpdateRecipeCommand with: tags: []
- **Expected Output**:
  - All recipe_tags associations deleted
  - Returns recipe with empty tags array

**4.1.9 Update Recipe - With Existing User Tags**
- **Scenario Name**: Link recipe to tags that already exist for user
- **Prerequisites**:
  - Mock tag queries to return existing tags for "Vegetarian" and "Quick"
  - No new tag creation needed
- **Expected Output**:
  - Only recipe_tags insertions executed
  - Correct existing tag IDs linked
  - Returns recipe with correct tags

#### 4.2 Error Scenarios - Authorization

**4.2.1 Recipe Not Found**
- **Scenario Name**: Fail when recipe doesn't exist
- **Prerequisites**:
  - Mock existence check to return PGRST116 error
  - Recipe ID: "non-existent"
- **Expected Output**:
  - NotFoundError thrown: "Recipe with ID 'non-existent' not found"
  - No update operations executed
  - No rollback

**4.2.2 Access Denied - Different User**
- **Scenario Name**: Fail when user doesn't own recipe
- **Prerequisites**:
  - Recipe owner: "user-123"
  - Requesting user: "user-456"
- **Expected Output**:
  - ForbiddenError thrown: "Access denied. You don't have permission to update this recipe"
  - No updates executed

#### 4.3 Error Scenarios - Update Operations

**4.3.1 Recipe Update Fails - Rollback Triggered**
- **Scenario Name**: Rollback when main recipe update fails
- **Prerequisites**:
  - Mock Supabase with:
    - Existence check succeeds
    - Recipe update fails: { message: "Column name cannot be null" }
- **Expected Output**:
  - Error thrown: "Failed to update recipe: ..."
  - Rollback executed: recipe restored to original name/description
  - No ingredient/step/tag updates attempted

**4.3.2 Ingredient Update Fails - Rollback Triggered**
- **Scenario Name**: Rollback all changes when ingredient update fails
- **Prerequisites**:
  - Recipe update succeeds
  - Ingredient update fails during loop
- **Expected Output**:
  - Error thrown: "Failed to update ingredient ..."
  - Rollback executes: recipe name/description restored
  - Returns to original state

**4.3.3 Ingredient Delete Fails - Rollback Triggered**
- **Scenario Name**: Rollback when deleting old ingredients fails
- **Prerequisites**:
  - Mock ingredient delete to fail: { message: "Foreign key constraint" }
- **Expected Output**:
  - Error thrown
  - Rollback executed

**4.3.4 Step Update Fails - Rollback Triggered**
- **Scenario Name**: Rollback when step operations fail
- **Prerequisites**:
  - Recipe and ingredient updates succeed
  - Step insert fails
- **Expected Output**:
  - Complete rollback executed

**4.3.5 Tag Creation Fails During Update - Rollback Triggered**
- **Scenario Name**: Rollback when creating new tag during update fails
- **Prerequisites**:
  - All recipe/ingredient/step updates succeed
  - New tag creation fails: { message: "Database error" }
- **Expected Output**:
  - Complete rollback executed

**4.3.6 Tag Linking Fails - Rollback Triggered**
- **Scenario Name**: Rollback when recipe_tags insertion fails
- **Prerequisites**:
  - Tag creation succeeds
  - recipe_tags insert fails
- **Expected Output**:
  - Complete rollback executed

**4.3.7 GetRecipeById Fails After Update - Rollback Triggered**
- **Scenario Name**: Rollback when fetching updated recipe fails
- **Prerequisites**:
  - All updates succeed
  - Final getRecipeById call fails
- **Expected Output**:
  - Complete rollback executed

---

### 5. deleteRecipe()

#### 5.1 Success Scenarios

**5.1.1 Delete Recipe - User Owns Recipe**
- **Scenario Name**: Successfully delete recipe when user is authorized
- **Prerequisites**:
  - Mock Supabase with:
    - Existence check returns: { id: "recipe-123", user_id: "user-123" }
    - Delete succeeds
  - Recipe ID: "recipe-123", User ID: "user-123"
- **Expected Output**:
  - Recipe deleted from database
  - No error thrown
  - Promise resolves with void
  - Cascade constraints handle related data cleanup

#### 5.2 Authorization Error Scenarios

**5.2.1 Recipe Not Found**
- **Scenario Name**: Throw NotFoundError when recipe doesn't exist
- **Prerequisites**:
  - Mock existence check to return PGRST116 error
  - Recipe ID: "non-existent-id"
- **Expected Output**:
  - NotFoundError thrown: "Recipe with ID 'non-existent-id' not found"
  - No delete operation executed

**5.2.2 Recipe Not Found - Null Response**
- **Scenario Name**: Throw NotFoundError when existence check returns null
- **Prerequisites**:
  - Mock existence check returns no error but data: null
- **Expected Output**:
  - NotFoundError thrown: "Recipe with ID '...' not found"

**5.2.3 Access Denied - Different User**
- **Scenario Name**: Throw ForbiddenError when user doesn't own recipe
- **Prerequisites**:
  - Recipe owner: "owner-123"
  - Requesting user: "different-user-456"
  - Existence check returns recipe owned by "owner-123"
- **Expected Output**:
  - ForbiddenError thrown: "Access denied. You don't have permission to delete this recipe"
  - No delete operation executed

#### 5.3 Database Error Scenarios

**5.3.1 Existence Check Database Error**
- **Scenario Name**: Fail when checking existence encounters database error
- **Prerequisites**:
  - Mock existence check to return error (not PGRST116): { message: "Connection timeout" }
- **Expected Output**:
  - Error thrown: "Failed to check recipe existence: Connection timeout"
  - No delete operation executed

**5.3.2 Delete Operation Database Error**
- **Scenario Name**: Fail when delete operation encounters database error
- **Prerequisites**:
  - Existence check succeeds
  - Mock delete to fail: { message: "Database locked" }
- **Expected Output**:
  - Error thrown: "Failed to delete recipe: Database locked"

---

## Mocking Strategy

### Supabase Client Mock Pattern
All tests should mock the Supabase client using Vitest's `vi.fn()` and `vi.spyOn()`. The mock should support method chaining for Supabase query builder pattern:

```typescript
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: {...}, error: null }),
  // Add more as needed
};
```

### Error Response Pattern
Supabase errors should be mocked with:
```typescript
{ data: null, error: { message: "error message", code: "ERROR_CODE" } }
```

---

## Testing Considerations

### 1. Rollback Testing
- Verify that rollback operations actually delete the created data
- Ensure original error is re-thrown (not masked by rollback errors)
- Test scenarios where rollback itself might fail (should be logged, not thrown)

### 2. Authorization Testing
- Always test both successful authorization and denied access
- Distinguish between NotFoundError and ForbiddenError scenarios
- Verify that authorization checks happen before attempting operations

### 3. Data Transformation
- Test that Supabase nested structures are correctly transformed to DTOs
- Verify sorting of ingredients/steps by position
- Test tag array flattening from nested structure

### 4. Async Operations
- All Supabase calls are async and should be awaited in tests
- Test promise rejection handling
- Verify error propagation through async chains

### 5. Edge Cases
- Empty arrays (ingredients, steps, tags)
- Null vs. empty array in Supabase responses
- Missing optional fields in CreateRecipeCommand
- Duplicate tags in input

---

## Test Organization

Recommended file structure:
```
src/lib/services/__tests__/
  ├── recipe.service.test.ts (main test file)
  ├── recipe.service.createRecipe.test.ts (optionally split by method)
  ├── recipe.service.getRecipeById.test.ts
  ├── recipe.service.getRecipesForUser.test.ts
  ├── recipe.service.updateRecipe.test.ts
  └── recipe.service.deleteRecipe.test.ts
```

Or use a single test file with describe blocks for each method.

---

## Dependencies to Mock

- `SupabaseClientType` - The Supabase client
- Zod schemas (`SupabaseRecipeWithJoinsSchema`, `RecipeListResultSchema`) - Mock successful parse results or test with actual schema

---

## Notes

1. The service implements comprehensive error handling with custom error classes (NotFoundError, ForbiddenError)
2. Transactional behavior is simulated through rollback functions on failure
3. Authorization checks distinguish between "not found" and "not authorized" for security
4. Tag management includes both tag creation and linking to recipes
5. All operations involving multiple database tables include error handling and rollback logic
