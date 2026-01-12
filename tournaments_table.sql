create table public.tournaments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  status text default 'draft', -- 'draft', 'active', 'completed'
  bracket_data jsonb default '[]'::jsonb -- Stores the structure of rounds and matches
);

-- Enable RLS
alter table public.tournaments enable row level security;

-- Policies
create policy "Public tournaments are viewable by everyone"
  on public.tournaments for select
  using (true);

create policy "Admins can insert tournaments"
  on public.tournaments for insert
  with check (true); -- Ideally restrict to admin role if auth is fully set up

create policy "Admins can update tournaments"
  on public.tournaments for update
  using (true);

create policy "Admins can delete tournaments"
  on public.tournaments for delete
  using (true);
