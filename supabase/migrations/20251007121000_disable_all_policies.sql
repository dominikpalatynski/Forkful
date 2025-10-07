-- migration: 20251007121000_disable_all_policies.sql
-- description: disables all row level security policies created in previous migrations

-- drop policies for recipes table
drop policy if exists "users can view their own recipes" on recipes;
drop policy if exists "users can insert their own recipes" on recipes;
drop policy if exists "users can update their own recipes" on recipes;
drop policy if exists "users can delete their own recipes" on recipes;

-- drop policies for ingredients table
drop policy if exists "users can view ingredients for their own recipes" on ingredients;
drop policy if exists "users can insert ingredients for their own recipes" on ingredients;
drop policy if exists "users can update ingredients for their own recipes" on ingredients;
drop policy if exists "users can delete ingredients for their own recipes" on ingredients;

-- drop policies for steps table
drop policy if exists "users can view steps for their own recipes" on steps;
drop policy if exists "users can insert steps for their own recipes" on steps;
drop policy if exists "users can update steps for their own recipes" on steps;
drop policy if exists "users can delete steps for their own recipes" on steps;

-- drop policies for tags table
drop policy if exists "users can view their own tags" on tags;
drop policy if exists "users can insert their own tags" on tags;
drop policy if exists "users can update their own tags" on tags;
drop policy if exists "users can delete their own tags" on tags;

-- drop policies for recipe_tags table
drop policy if exists "users can view recipe_tags for their own recipes" on recipe_tags;
drop policy if exists "users can insert recipe_tags for their own recipes and tags" on recipe_tags;
drop policy if exists "users can delete recipe_tags for their own recipes" on recipe_tags;

-- drop policies for analytics tables
drop policy if exists "analytics tables are not accessible by users" on generation;
drop policy if exists "analytics tables are not accessible by users" on generation_errors;

