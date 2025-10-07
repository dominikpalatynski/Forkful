
# Final PostgreSQL Database Schema for Forkful MVP

## 1. Tables Schema

### `recipes`
Stores the main recipe data linked to a user.

| Column      | Type        | Constraints                               | Description                  |
|-------------|-------------|-------------------------------------------|------------------------------|
| `id`          | `uuid`      | `PRIMARY KEY`, `default gen_random_uuid()`| Unique identifier for the recipe. |
| `user_id`     | `uuid`      | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Foreign key to the user who owns the recipe. |

| `name`        | `varchar(255)`      | `NOT NULL`                                | The name of the recipe.      |
| `description` | `text`      | `NULLABLE`                                | An optional description for the recipe. |
| `generation_id`| `uuid`      | `NULLABLE`, `REFERENCES generation(id) ON DELETE SET NULL` | Foreign key to the generation event that created this recipe. |
| `created_at`  | `timestamptz` | `NOT NULL`, `default now()`               | Timestamp of when the recipe was created. |
| `updated_at`  | `timestamptz` | `NOT NULL`, `default now()`               | Timestamp of the last update. |

### `ingredients`
Stores the ingredients for a specific recipe.

| Column      | Type        | Constraints                               | Description                  |
|-------------|-------------|-------------------------------------------|------------------------------|
| `id`          | `uuid`      | `PRIMARY KEY`, `default gen_random_uuid()`| Unique identifier for the ingredient. |
| `recipe_id`   | `uuid`      | `NOT NULL`, `REFERENCES recipes(id) ON DELETE CASCADE` | Foreign key to the recipe this ingredient belongs to. |
| `content`     | `varchar(255)`      | `NOT NULL`                                | The text content of the ingredient. |
| `position`    | `integer`   | `NOT NULL`                                | The order of the ingredient in the list. |

### `steps`
Stores the preparation steps for a specific recipe.

| Column      | Type        | Constraints                               | Description                  |
|-------------|-------------|-------------------------------------------|------------------------------|
| `id`          | `uuid`      | `PRIMARY KEY`, `default gen_random_uuid()`| Unique identifier for the step. |
| `recipe_id`   | `uuid`      | `NOT NULL`, `REFERENCES recipes(id) ON DELETE CASCADE` | Foreign key to the recipe this step belongs to. |
| `content`     | `text`      | `NOT NULL`                                | The text content of the step. |
| `position`    | `integer`   | `NOT NULL`                                | The order of the step in the list. |

### `tags`
Stores user-defined tags for organizing recipes.

| Column      | Type        | Constraints                               | Description                  |
|-------------|-------------|-------------------------------------------|------------------------------|
| `id`          | `uuid`      | `PRIMARY KEY`, `default gen_random_uuid()`| Unique identifier for the tag. |
| `user_id`     | `uuid`      | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Foreign key to the user who owns the tag. |
| `name`        | `varchar(50)`      | `NOT NULL`                                | The name of the tag.         |
| `created_at`  | `timestamptz` | `NOT NULL`, `default now()`               | Timestamp of when the tag was created. |
| `updated_at`  | `timestamptz` | `NOT NULL`, `default now()`               | Timestamp of the last update. |

### `recipe_tags`
A join table for the many-to-many relationship between recipes and tags.

| Column      | Type   | Constraints                               | Description                  |
|-------------|--------|-------------------------------------------|------------------------------|
| `recipe_id`   | `uuid` | `PRIMARY KEY`, `REFERENCES recipes(id) ON DELETE CASCADE` | Foreign key to the recipe. |
| `tag_id`      | `uuid` | `PRIMARY KEY`, `REFERENCES tags(id) ON DELETE CASCADE` | Foreign key to the tag. |

### `generation`
An analytics table to track the quality and usage of the AI generation feature.

| Column           | Type        | Constraints                               | Description                  |
|------------------|-------------|-------------------------------------------|------------------------------|
| `id`             | `uuid`      | `PRIMARY KEY`, `default gen_random_uuid()`| Unique identifier for the generation log. |
| `user_id`        | `uuid`      | `REFERENCES auth.users(id) ON DELETE SET NULL` | Foreign key to the user who initiated the generation. |
| `input_text`     | `text`      | `NOT NULL`                                | The raw text input provided by the user. |
| `generated_output` | `jsonb`     | `NOT NULL`                                | The structured JSON output from the AI model. |
| `is_accepted`    | `boolean`   | `NOT NULL`, `default false`               | Flag indicating if the user saved the generated recipe. |
| `created_at`     | `timestamptz` | `NOT NULL`, `default now()`               | Timestamp of when the generation was performed. |

### `generation_errors`
An analytics table to log errors that occur during AI generation.

| Column        | Type        | Constraints                               | Description                  |
|---------------|-------------|-------------------------------------------|------------------------------|
| `id`            | `uuid`      | `PRIMARY KEY`, `default gen_random_uuid()`| Unique identifier for the error log. |
| `user_id`       | `uuid`      | `REFERENCES auth.users(id) ON DELETE SET NULL` | Foreign key to the user who encountered the error. |
| `input_text`    | `text`      | `NOT NULL`                                | The raw text input that caused the error. |
| `error_message` | `text`      | `NOT NULL`                                | The error message or details. |
| `created_at`    | `timestamptz` | `NOT NULL`, `default now()`               | Timestamp of when the error occurred. |

---

## 2. Relationships

-   **`auth.users` to `recipes`**: One-to-Many. A user can have many recipes.
-   **`auth.users` to `tags`**: One-to-Many. A user can create many tags.
-   **`recipes` to `ingredients`**: One-to-Many. A recipe consists of many ingredients.
-   **`recipes` to `steps`**: One-to-Many. A recipe consists of many preparation steps.
-   **`recipes` to `tags`**: Many-to-Many, facilitated by the `recipe_tags` join table. A recipe can have multiple tags, and a tag can be applied to multiple recipes.
-   **`generation` to `recipes`**: One-to-One (optional). A generation event can result in one recipe.

---

## 3. Indexes

-   **`recipes`**: An index will be created on the `user_id` column.
-   **`recipes`**: An index will be created on the `generation_id` column.
-   **`ingredients`**: An index will be created on the `recipe_id` column.
-   **`steps`**: An index will be created on the `recipe_id` column.
-   **`tags`**:
    -   An index will be created on the `user_id` column.
    -   A unique, case-insensitive composite index will be created on `(user_id, LOWER(name))` to ensure each user's tags are unique.
-   **`recipe_tags`**: Indexes will be created on both `recipe_id` and `tag_id` columns.
-   **`generation`**: An index will be created on the `user_id` column.
-   **`generation_errors`**: An index will be created on the `user_id` column.

---

## 4. Row-Level Security (RLS) Policies

RLS will be enabled on all user-facing tables to ensure data privacy.

-   **`recipes`, `ingredients`, `steps`, `tags`, `recipe_tags`**:
    -   **`SELECT`**: Users can only view their own data (`user_id = auth.uid()`).
    -   **`INSERT`**: Users can only insert data with their own `user_id` (`user_id = auth.uid()`).
    -   **`UPDATE`**: Users can only update their own data (`user_id = auth.uid()`).
    -   **`DELETE`**: Users can only delete their own data (`user_id = auth.uid()`).

-   **`generation`, `generation_errors`**:
    -   These tables will have RLS enabled and will be inaccessible to users via the public API.
    -   **`INSERT`** operations will be performed using the `service_role` key from the backend to bypass RLS.
    -   No `SELECT`, `UPDATE`, or `DELETE` policies will be defined for client-side users.

---

## 5. Additional Considerations & Triggers

-   **`updated_at` Trigger**: A database function and trigger will be implemented to automatically update the `updated_at` column in the `recipes` and `tags` tables whenever a row is modified.
-   **Orphaned Tag Cleanup**: A database function and trigger will be created to automatically delete tags from the `tags` table that are no longer associated with any recipes in the `recipe_tags` table. This maintains data integrity and prevents unused tags from accumulating.
-   **Cascading Deletes**: `ON DELETE CASCADE` is used to ensure that when a user or a recipe is deleted, all their associated data (ingredients, steps, tag associations) are also cleanly removed from the database.
