alter table public.recipes
  add column if not exists is_public boolean not null default false;

grant select on public.recipes to anon;

drop policy if exists "Public can view shared recipes" on public.recipes;

create policy "Public can view shared recipes"
  on public.recipes
  for select
  to anon
  using (is_public = true);
