-- migration: 20251013203426_reenable_rls_policies.sql
-- description: re-enables row level security policies for all tables that were dropped in the disable_all_policies migration

-- create rls policies for recipes table
create policy "users can view their own recipes" on recipes for select using (auth.uid() = user_id);
create policy "users can insert their own recipes" on recipes for insert with check (auth.uid() = user_id);
create policy "users can update their own recipes" on recipes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete their own recipes" on recipes for delete using (auth.uid() = user_id);

-- create rls policies for ingredients table
create policy "users can view ingredients for their own recipes" on ingredients for select using (exists (select 1 from recipes where id = ingredients.recipe_id and user_id = auth.uid()));
create policy "users can insert ingredients for their own recipes" on ingredients for insert with check (exists (select 1 from recipes where id = ingredients.recipe_id and user_id = auth.uid()));
create policy "users can update ingredients for their own recipes" on ingredients for update using (exists (select 1 from recipes where id = ingredients.recipe_id and user_id = auth.uid()));
create policy "users can delete ingredients for their own recipes" on ingredients for delete using (exists (select 1 from recipes where id = ingredients.recipe_id and user_id = auth.uid()));

-- create rls policies for steps table
create policy "users can view steps for their own recipes" on steps for select using (exists (select 1 from recipes where id = steps.recipe_id and user_id = auth.uid()));
create policy "users can insert steps for their own recipes" on steps for insert with check (exists (select 1 from recipes where id = steps.recipe_id and user_id = auth.uid()));
create policy "users can update steps for their own recipes" on steps for update using (exists (select 1 from recipes where id = steps.recipe_id and user_id = auth.uid()));
create policy "users can delete steps for their own recipes" on steps for delete using (exists (select 1 from recipes where id = steps.recipe_id and user_id = auth.uid()));

-- create rls policies for tags table
create policy "users can view their own tags" on tags for select using (auth.uid() = user_id);
create policy "users can insert their own tags" on tags for insert with check (auth.uid() = user_id);
create policy "users can update their own tags" on tags for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete their own tags" on tags for delete using (auth.uid() = user_id);

-- create rls policies for recipe_tags join table
create policy "users can view recipe_tags for their own recipes" on recipe_tags for select using ((select user_id from recipes where id = recipe_tags.recipe_id) = auth.uid());
create policy "users can insert recipe_tags for their own recipes and tags" on recipe_tags for insert with check (((select user_id from recipes where id = recipe_tags.recipe_id) = auth.uid()) and ((select user_id from tags where id = recipe_tags.tag_id) = auth.uid()));
create policy "users can delete recipe_tags for their own recipes" on recipe_tags for delete using ((select user_id from recipes where id = recipe_tags.recipe_id) = auth.uid());

-- create rls policies for generation_errors table
-- allow users to view their own generation errors for debugging purposes
create policy "users can view their own generation errors" on generation_errors for select using (auth.uid() = user_id);
create policy "users can insert their own generation errors" on generation_errors for insert with check (auth.uid() = user_id);
