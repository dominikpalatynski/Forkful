import { test as teardown } from "playwright/test";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import type { Database } from "../src/db/database.types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load integration environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.integration") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const E2E_USERNAME_ID = process.env.E2E_USERNAME_ID;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_KEY must be set in .env.integration");
}

if (!E2E_USERNAME_ID) {
  throw new Error("E2E_USERNAME_ID must be set in .env.integration");
}

// Create Supabase client for teardown operations
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

teardown("cleanup database", async () => {
  // 1. Delete recipe_tags (junction table with foreign keys to recipes and tags)
  await supabase.from("recipe_tags").delete().neq("recipe_id", "").eq("user_id", E2E_USERNAME_ID);

  // 2. Delete ingredients (has foreign key to recipes)
  await supabase.from("ingredients").delete().neq("id", "").eq("user_id", E2E_USERNAME_ID);

  // 3. Delete steps (has foreign key to recipes)
  await supabase.from("steps").delete().neq("id", "").eq("user_id", E2E_USERNAME_ID);

  // 4. Delete recipes (has foreign key to generation)
  await supabase.from("recipes").delete().neq("id", "").eq("user_id", E2E_USERNAME_ID);

  // 5. Delete tags (standalone table)
  await supabase.from("tags").delete().neq("id", "").eq("user_id", E2E_USERNAME_ID);

  // 6. Delete generation (standalone table)
  await supabase.from("generation").delete().neq("id", "").eq("user_id", E2E_USERNAME_ID);

  // 7. Delete generation_errors (standalone table)
  await supabase.from("generation_errors").delete().neq("id", "").eq("user_id", E2E_USERNAME_ID);
});
