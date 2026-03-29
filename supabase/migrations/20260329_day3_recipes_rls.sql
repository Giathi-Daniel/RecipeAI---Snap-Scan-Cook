alter table public.recipes enable row level security;
alter table public.saved_recipes enable row level security;
alter table public.recipes force row level security;
alter table public.saved_recipes force row level security;

alter table public.recipes
  alter column user_id set not null;

alter table public.saved_recipes
  alter column user_id set not null,
  alter column recipe_id set not null;

revoke all on public.recipes from anon, authenticated;
revoke all on public.saved_recipes from anon, authenticated;

grant select, insert, update, delete on public.recipes to authenticated;
grant select, insert, update, delete on public.saved_recipes to authenticated;

create unique index if not exists saved_recipes_user_id_recipe_id_key
  on public.saved_recipes (user_id, recipe_id);

drop policy if exists "Users can view their own recipes" on public.recipes;
drop policy if exists "Users can insert their own recipes" on public.recipes;
drop policy if exists "Users can update their own recipes" on public.recipes;
drop policy if exists "Users can delete their own recipes" on public.recipes;

create policy "Users can view their own recipes"
  on public.recipes
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own recipes"
  on public.recipes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own recipes"
  on public.recipes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own recipes"
  on public.recipes
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own saved recipes" on public.saved_recipes;
drop policy if exists "Users can insert their own saved recipes" on public.saved_recipes;
drop policy if exists "Users can update their own saved recipes" on public.saved_recipes;
drop policy if exists "Users can delete their own saved recipes" on public.saved_recipes;

create policy "Users can view their own saved recipes"
  on public.saved_recipes
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own saved recipes"
  on public.saved_recipes
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.recipes
      where recipes.id = saved_recipes.recipe_id
        and recipes.user_id = auth.uid()
    )
  );

create policy "Users can update their own saved recipes"
  on public.saved_recipes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.recipes
      where recipes.id = saved_recipes.recipe_id
        and recipes.user_id = auth.uid()
    )
  );

create policy "Users can delete their own saved recipes"
  on public.saved_recipes
  for delete
  to authenticated
  using (auth.uid() = user_id);
