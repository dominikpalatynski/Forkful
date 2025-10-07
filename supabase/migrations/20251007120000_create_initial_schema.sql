-- migration: 20251007120000_create_initial_schema.sql
-- description: creates the initial database schema for the forkful mvp.
-- tables created: recipes, ingredients, steps, tags, recipe_tags, generation, generation_errors

-- generation analytics table
create table generation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  input_text text not null,
  generated_output jsonb not null,
  is_accepted boolean not null default false,
  created_at timestamptz not null default now()
);

-- generation_errors analytics table
create table generation_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  input_text text not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- create tables
-- recipes table
create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid references generation(id) on delete set null,
  name varchar(255) not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ingredients table
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  content varchar(255) not null,
  "position" integer not null
);

-- steps table
create table steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  content text not null,
  "position" integer not null
);

-- tags table
create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(50) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- recipe_tags join table
create table recipe_tags (
  recipe_id uuid not null references recipes(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (recipe_id, tag_id)
);

-- create indexes for foreign keys and common query patterns
create index on recipes (user_id);
create index on recipes (generation_id);
create index on ingredients (recipe_id);
create index on steps (recipe_id);
create index on tags (user_id);
create unique index on tags (user_id, lower(name));
create index on recipe_tags (recipe_id);
create index on recipe_tags (tag_id);
create index on generation (user_id);
create index on generation_errors (user_id);

-- enable row level security (rls) for all tables
alter table recipes enable row level security;
alter table ingredients enable row level security;
alter table steps enable row level security;
alter table tags enable row level security;
alter table recipe_tags enable row level security;
alter table generation enable row level security;
alter table generation_errors enable row level security;

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

-- create rls policies for analytics tables
-- these tables are not directly accessible by users via the public api.
-- insert operations will be performed using the service_role key from the backend.
create policy "analytics tables are not accessible by users" on generation for all using (false);
create policy "analytics tables are not accessible by users" on generation_errors for all using (false);

-- create function to update the 'updated_at' timestamp
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- create triggers to automatically update 'updated_at' on recipes and tags table updates
create trigger on_recipes_update
  before update on recipes
  for each row
  execute procedure handle_updated_at();

create trigger on_tags_update
  before update on tags
  for each row
  execute procedure handle_updated_at();

-- create function to delete orphaned tags
create or replace function delete_orphaned_tags()
returns trigger as $$
begin
  delete from tags
  where id = old.tag_id and not exists (
    select 1 from recipe_tags where tag_id = old.tag_id
  );
  return old;
end;
$$ language plpgsql;

-- create trigger to delete orphaned tags after a recipe_tags row is deleted
create trigger on_recipe_tags_delete
  after delete on recipe_tags
  for each row
  execute procedure delete_orphaned_tags();
