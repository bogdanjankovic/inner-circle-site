-- Supabase SQL za shuffle_players tabelu
-- Pokreni ovo u Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS shuffle_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    steam_id TEXT NOT NULL UNIQUE,
    steam_account_id TEXT NOT NULL,
    persona_name TEXT,
    avatar TEXT,
    rank_tier INTEGER,
    winrate NUMERIC,
    preferred_positions INTEGER[] NOT NULL, -- Array: [1,2,3] or [4,5]
    assigned_position INTEGER, -- Set when team is formed
    assigned_team_id UUID, -- Set when team is formed  
    status TEXT DEFAULT 'pending', -- pending, approved, assigned, rejected
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index za brze pretrage po statusu
CREATE INDEX IF NOT EXISTS idx_shuffle_players_status ON shuffle_players(status);

-- RLS politika - dozvoli sve operacije
ALTER TABLE shuffle_players ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all shuffle operations" ON shuffle_players;

-- Create policy
CREATE POLICY "Allow all shuffle operations" ON shuffle_players FOR ALL USING (true) WITH CHECK (true);
