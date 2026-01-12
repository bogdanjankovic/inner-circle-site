-- 1. TEAMS TABLE
create table public.teams (
  id text primary key, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  logo text,
  captain_id text,
  players jsonb not null default '[]'::jsonb,
  stats jsonb default '{}'::jsonb
);

-- 2. PENDING TEAMS TABLE (For registration requests)
create table public.pending_teams (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  logo text,
  captain_id text,
  players jsonb not null default '[]'::jsonb,
  stats jsonb default '{}'::jsonb
);

-- 3. MATCHES TABLE (Match history)
create table public.matches (
  match_id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  winner text,
  timestamp bigint,
  duration numeric,
  radiant_team_id text,
  dire_team_id text,
  data jsonb not null -- Stores the full match JSON for detailed view
);

-- 4. ENABLE RLS (Row Level Security) - Best Practice
alter table public.teams enable row level security;
alter table public.pending_teams enable row level security;
alter table public.matches enable row level security;

-- 5. TEMPORARY POLICIES (Allow everything for now, can restrict later)
create policy "Enable all access for all users" on public.teams for all using (true) with check (true);
create policy "Enable all access for all users" on public.pending_teams for all using (true) with check (true);
create policy "Enable all access for all users" on public.matches for all using (true) with check (true);
