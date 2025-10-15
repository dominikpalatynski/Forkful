# REST API Plan

## 1. Resources

- **Recipes**: Manages recipes, including their ingredients, steps, and tags. Corresponds to `recipes`, `ingredients`, `steps`, `tags`, and `recipe_tags` tables.
- **Tags**: Manages user-specific tags for autocompletion. Corresponds to the `tags` table.
- **Generation**: Handles the AI-powered recipe generation from raw text. Corresponds to the `generation` and `generation_errors` tables.

## 2. Endpoints

### Recipes Resource

#### Create a new recipe

- **Method**: `POST`
- **URL**: `/api/recipes`
- **Description**: Creates a new recipe. This endpoint handles the creation of the recipe, its ingredients, steps, and the association with tags in a single transaction.
- **Request Body**:
  ```json
  {
    "name": "Spaghetti Carbonara",
    "description": "A classic Italian pasta dish.",
    "generationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "ingredients": [
      { "content": "200g spaghetti", "position": 1 },
      { "content": "100g pancetta", "position": 2 },
      { "content": "2 large eggs", "position": 3 }
    ],
    "steps": [
      { "content": "Boil the pasta.", "position": 1 },
      { "content": "Fry the pancetta.", "position": 2 }
    ],
    "tags": ["pasta", "italian", "quick"]
  }
  ```
- **Success Response**:
  - **Code**: `201 Created`
  - **Content**: The full recipe object including ingredients, steps, and tags.
    ```json
    {
      "id": "uuid-goes-here",
      "name": "Spaghetti Carbonara",
      "description": "A classic Italian pasta dish.",
      "ingredients": [
        { "id": "uuid", "content": "200g spaghetti", "position": 1 },
        { "id": "uuid", "content": "100g pancetta", "position": 2 },
        { "id": "uuid", "content": "2 large eggs", "position": 3 }
      ],
      "steps": [
        { "id": "uuid", "content": "Boil the pasta.", "position": 1 },
        { "id": "uuid", "content": "Fry the pancetta.", "position": 2 }
      ],
      "tags": ["pasta", "italian", "quick"]
    }
    ```
- **Error Responses**:
  - **Code**: `400 Bad Request` (Validation error, e.g., missing name)
  - **Code**: `401 Unauthorized` (User not authenticated)

#### Get all user's recipes

- **Method**: `GET`
- **URL**: `/api/recipes`
- **Description**: Retrieves a paginated list of recipes for the authenticated user.
- **Query Parameters**:
  - `page` (integer, default: 1): The page number for pagination.
  - `pageSize` (integer, default: 10): The number of items per page.
  - `sortBy` (string, e.g., "name"): Field to sort by.
  - `order` (string, "asc" or "desc", default: "desc"): Sort order.
  - `tag` (string): Filter recipes by a specific tag name.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    {
      "data": [
        {
          "id": "uuid-1",
          "name": "Recipe 1",
          "description": "...",
          "tags": ["tag1", "tag2"]
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 10,
        "totalItems": 1,
        "totalPages": 1
      }
    }
    ```
- **Error Responses**:
  - **Code**: `401 Unauthorized`

#### Get a single recipe

- **Method**: `GET`
- **URL**: `/api/recipes/{id}`
- **Description**: Retrieves a single recipe by its ID.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: The full recipe object including ingredients, steps, and tags.
    ```json
    {
      "id": "uuid-goes-here",
      "name": "Spaghetti Carbonara",
      "description": "A classic Italian pasta dish.",
      "ingredients": [{ "id": "uuid", "content": "200g spaghetti", "position": 1 }],
      "steps": [{ "id": "uuid", "content": "Boil the pasta.", "position": 1 }],
      "tags": ["pasta", "italian", "quick"]
    }
    ```
- **Error Responses**:
  - **Code**: `401 Unauthorized`
  - **Code**: `403 Forbidden` (User does not own the recipe)
  - **Code**: `404 Not Found`

#### Update a recipe

- **Method**: `PUT`
- **URL**: `/api/recipes/{id}`
- **Description**: Updates an existing recipe. The backend will handle updating, creating, and deleting associated ingredients, steps, and tags.
- **Request Body**: The full updated recipe object.
  ```json
  {
    "name": "Spaghetti Carbonara with a twist",
    "description": "An updated version of the classic.",
    "ingredients": [
      { "id": "existing-uuid", "content": "200g spaghetti", "position": 1 },
      { "content": "50g parmesan cheese", "position": 4 }
    ],
    "steps": [{ "id": "existing-uuid", "content": "Boil the pasta until al dente.", "position": 1 }],
    "tags": ["pasta", "updated"]
  }
  ```
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: The updated recipe object.
- **Error Responses**:
  - **Code**: `400 Bad Request`
  - **Code**: `401 Unauthorized`
  - **Code**: `403 Forbidden`
  - **Code**: `404 Not Found`

#### Delete a recipe

- **Method**: `DELETE`
- **URL**: `/api/recipes/{id}`
- **Description**: Deletes a recipe and all its associated data (ingredients, steps, tag associations).
- **Success Response**:
  - **Code**: `204 No Content`
- **Error Responses**:
  - **Code**: `401 Unauthorized`
  - **Code**: `403 Forbidden`
  - **Code**: `404 Not Found`

### Tags Resource

#### Get all user's tags

- **Method**: `GET`
- **URL**: `/api/tags`
- **Description**: Retrieves a list of all unique tags created by the authenticated user, for use in autocompletion.
- **Query Parameters**:
  - `q` (string, optional): A search term to filter tags that start with this string (case-insensitive).
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    [
      { "id": "uuid-1", "name": "pasta" },
      { "id": "uuid-2", "name": "italian" }
    ]
    ```
- **Error Responses**:
  - **Code**: `401 Unauthorized`

### Generation Resource

#### Generate recipe from text

- **Method**: `POST`
- **URL**: `/api/recipes/generate`
- **Description**: Takes raw text as input, sends it to an AI model for processing, and returns a structured, unsaved recipe object. It also creates a log entry in the `generation` table.
- **Request Body**:
  ```json
  {
    "inputText": "Recipe for pancakes: 1 cup flour, 2 eggs, 1 cup milk. Mix all ingredients. Cook on a hot pan."
  }
  ```
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    {
      "generationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "Pancakes",
      "description": null,
      "ingredients": [
        { "content": "1 cup flour", "position": 1 },
        { "content": "2 eggs", "position": 2 },
        { "content": "1 cup milk", "position": 3 }
      ],
      "steps": [
        { "content": "Mix all ingredients.", "position": 1 },
        { "content": "Cook on a hot pan.", "position": 2 }
      ]
    }
    ```
- **Error Responses**:
  - **Code**: `400 Bad Request` (e.g., input text exceeds 10,000 characters)
  - **Code**: `401 Unauthorized`
  - **Code**: `422 Unprocessable Entity` (e.g., input text is too short, or not related to food/recipes)
  - **Code**: `500 Internal Server Error` (AI model failed to process the text; an entry is logged in `generation_errors`)

### Authentication Resource

#### Login user

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Description**: Authenticates a user with email and password credentials. Upon successful authentication, establishes a session and sets appropriate cookies.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: Empty response body (session is managed via cookies)
- **Error Responses**:
  - **Code**: `400 Bad Request` (Validation error, e.g., invalid email format)
  - **Code**: `401 Unauthorized` (Invalid credentials)

#### Register user

- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Description**: Creates a new user account with email and password. Sends a verification email to confirm the account.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "confirmPassword": "securepassword123"
  }
  ```
- **Success Response**:
  - **Code**: `201 Created`
  - **Content**: Empty response body (verification email sent)
- **Error Responses**:
  - **Code**: `400 Bad Request` (Validation error, e.g., password mismatch, weak password)
  - **Code**: `409 Conflict` (User with this email already exists)

#### Logout user

- **Method**: `POST`
- **URL**: `/api/auth/logout`
- **Description**: Terminates the current user session and clears session cookies.
- **Request Body**: None
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: Empty response body
- **Error Responses**: None (logout should always succeed for authenticated users)

#### Initiate password reset

- **Method**: `POST`
- **URL**: `/api/auth/forgot-password`
- **Description**: Initiates the password reset process by sending a reset link to the user's email address.
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: Empty response body (email sent if account exists)
- **Error Responses**:
  - **Code**: `400 Bad Request` (Invalid email format)

#### Verify password reset token

- **Method**: `POST`
- **URL**: `/api/auth/verify-reset-token`
- **Description**: Verifies a password reset token hash sent via email link. Used in the password recovery flow to validate the reset token before allowing password change.
- **Request Body**:
  ```json
  {
    "token_hash": "hash-from-email-link"
  }
  ```
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    {
      "user": {
        "id": "user-uuid",
        "email": "user@example.com"
      }
    }
    ```
- **Error Responses**:
  - **Code**: `400 Bad Request` (Missing token_hash, invalid or expired token)
  - **Code**: `400 Bad Request` (Invalid request body)
  - **Code**: `500 Internal Server Error` (Unexpected server error)

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

## 3. Authentication and Authorization

- **Mechanism**: The API will use JSON Web Tokens (JWT) for authentication, provided by Supabase Auth.
- **Implementation**:
  1.  The client application will use the Supabase client-side SDK to handle user registration and login.
  2.  Upon successful authentication, Supabase provides a JWT.
  3.  The client must include this JWT in the `Authorization` header for all subsequent API requests: `Authorization: Bearer <SUPABASE_JWT>`.
  4.  The Astro backend will use Supabase's server-side SDK to validate the JWT from the incoming request, thereby identifying and authenticating the user.
  5.  Authorization will be enforced by Supabase's Row-Level Security (RLS) policies, ensuring users can only access or modify their own data. The API business logic will rely on these RLS policies.

## 4. Validation and Business Logic

### Validation

- **Recipes**:
  - `name`: Must be a non-empty string, max 255 characters.
  - `description`: Can be null, must be a string if provided.
  - `ingredients`, `steps`: Must be arrays. Each item must have a non-empty `content` string and a `position` integer.
  - `tags`: Must be an array of strings. Each string max 50 characters.
- **Generation**:
  - `inputText`: Must be a non-empty string, max 10,000 characters.

### Business Logic

- **Transactional Integrity**: Creating and updating recipes (including their ingredients, steps, and tags) will be performed within a database transaction to ensure data consistency. If any part of the operation fails, the entire transaction will be rolled back.
- **On-the-fly Tag Creation**: When a recipe is created or updated, the API will process the `tags` array. For each tag name, it will check if a tag with that name already exists for the user (case-insensitive). If it exists, it will use the existing tag's ID. If not, it will create a new tag.
- **AI Analytics**:
  - The `POST /api/recipes/generate` endpoint will always create a record in the `generation` table.
  - The `POST /api/recipes` endpoint will check for a `generationId` in the payload. If present, it will update the corresponding `generation` record's `is_accepted` flag to `true`. This logic is handled by a dedicated database function.
  - If the AI model fails during generation, the API will catch the error, log the details in the `generation_errors` table, and return a `500` error to the client.
