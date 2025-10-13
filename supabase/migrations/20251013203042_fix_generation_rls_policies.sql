-- migration: 20251013203042_fix_generation_rls_policies.sql
-- description: adds proper row level security policies for the generation table to allow authenticated users to manage their generation records

-- create rls policies for generation table
create policy "users can view their own generation records" on generation for select using (auth.uid() = user_id);
create policy "users can insert their own generation records" on generation for insert with check (auth.uid() = user_id);
create policy "users can update their own generation records" on generation for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
