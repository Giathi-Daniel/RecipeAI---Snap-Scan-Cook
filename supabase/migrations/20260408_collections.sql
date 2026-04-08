-- Migration: Add collections and recipe_collections tables
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint collections_name_length check (char_length(name) >= 1 and char_length(name) <= 100),
  constraint collections_description_length check (description is null or char_length(description) <= 500),
  constraint collections_user_name_unique unique (user_id, name)
);

create table if not exists recipe_collections (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  added_at timestamptz default now(),
  
  -- Prevent duplicate recipe in same collection
  constraint recipe_collections_unique unique (collection_id, recipe_id)
);

-- Create indexes for performance
create index if not exists idx_collections_user_id on collections(user_id);
create index if not exists idx_collections_created_at on collections(created_at desc);
create index if not exists idx_recipe_collections_collection_id on recipe_collections(collection_id);
create index if not exists idx_recipe_collections_recipe_id on recipe_collections(recipe_id);

-- Enable Row Level Security
alter table collections enable row level security;
alter table recipe_collections enable row level security;

create policy "Users can view their own collections"
  on collections for select
  using (auth.uid() = user_id);

create policy "Users can create their own collections"
  on collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own collections"
  on collections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own collections"
  on collections for delete
  using (auth.uid() = user_id);

-- RLS Policies for recipe_collections table
create policy "Users can view their own recipe_collections"
  on recipe_collections for select
  using (
    exists (
      select 1 from collections
      where collections.id = recipe_collections.collection_id
      and collections.user_id = auth.uid()
    )
  );

create policy "Users can add recipes to their own collections"
  on recipe_collections for insert
  with check (
    exists (
      select 1 from collections
      where collections.id = recipe_collections.collection_id
      and collections.user_id = auth.uid()
    )
  );

create policy "Users can remove recipes from their own collections"
  on recipe_collections for delete
  using (
    exists (
      select 1 from collections
      where collections.id = recipe_collections.collection_id
      and collections.user_id = auth.uid()
    )
  );

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_collections_updated_at
  before update on collections
  for each row
  execute function update_updated_at_column();

create or replace function get_collection_recipe_count(collection_uuid uuid)
returns integer as $$
  select count(*)::integer
  from recipe_collections
  where collection_id = collection_uuid;
$$ language sql stable;
