import { test as teardown } from 'playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Database } from '../src/db/database.types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load integration environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.integration') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const E2E_USERNAME_ID = process.env.E2E_USERNAME_ID;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY must be set in .env.integration');
}

if (!E2E_USERNAME_ID) {
  throw new Error('E2E_USERNAME_ID must be set in .env.integration');
}

// Create Supabase client for teardown operations
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

teardown('cleanup database', async () => {
  console.log('🧹 Starting database cleanup...');

  try {
    // Delete data in order to respect foreign key constraints
    // 1. Delete recipe_tags (junction table with foreign keys to recipes and tags)
    const { error: recipeTagsError } = await supabase
      .from('recipe_tags')
      .delete()
      .neq('recipe_id', '')
      .eq('user_id', E2E_USERNAME_ID);
    if (recipeTagsError) {
      console.error('Error deleting recipe_tags:', recipeTagsError);
    } else {
      console.log('✓ Deleted all recipe_tags');
    }

    // 2. Delete ingredients (has foreign key to recipes)
    const { error: ingredientsError } = await supabase
      .from('ingredients')
      .delete()
      .neq('id', '')
      .eq('user_id', E2E_USERNAME_ID);
    if (ingredientsError) {
      console.error('Error deleting ingredients:', ingredientsError);
    } else {
      console.log('✓ Deleted all ingredients');
    }

    // 3. Delete steps (has foreign key to recipes)
    const { error: stepsError } = await supabase
      .from('steps')
      .delete()
      .neq('id', '')
      .eq('user_id', E2E_USERNAME_ID);
    if (stepsError) {
      console.error('Error deleting steps:', stepsError);
    } else {
      console.log('✓ Deleted all steps');
    }

    // 4. Delete recipes (has foreign key to generation)
    const { error: recipesError } = await supabase
      .from('recipes')
      .delete()
      .neq('id', '')
      .eq('user_id', E2E_USERNAME_ID);
    if (recipesError) {
      console.error('Error deleting recipes:', recipesError);
    } else {
      console.log('✓ Deleted all recipes');
    }

    // 5. Delete tags (standalone table)
    const { error: tagsError } = await supabase
      .from('tags')
      .delete()
      .neq('id', '')
      .eq('user_id', E2E_USERNAME_ID);
    if (tagsError) {
      console.error('Error deleting tags:', tagsError);
    } else {
      console.log('✓ Deleted all tags');
    }

    // 6. Delete generation (standalone table)
    const { error: generationError } = await supabase
      .from('generation')
      .delete()
      .neq('id', '')
      .eq('user_id', E2E_USERNAME_ID);
    if (generationError) {
      console.error('Error deleting generation:', generationError);
    } else {
      console.log('✓ Deleted all generation records');
    }

    // 7. Delete generation_errors (standalone table)
    const { error: generationErrorsError } = await supabase
      .from('generation_errors')
      .delete()
      .neq('id', '')
      .eq('user_id', E2E_USERNAME_ID);
    if (generationErrorsError) {
      console.error('Error deleting generation_errors:', generationErrorsError);
    } else {
      console.log('✓ Deleted all generation_errors');
    }

    console.log('✅ Database cleanup completed successfully');
  } catch (error) {
    console.error('❌ Unexpected error during database cleanup:', error);
    throw error;
  }
});
