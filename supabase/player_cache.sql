-- Supabase SQL za kreiranje player_cache tabele
-- Pokreni ovo u Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS player_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    steam_account_id TEXT NOT NULL,
    position INTEGER,
    data_type TEXT NOT NULL, -- 'stratz', 'opendota', 'dotaplus'
    heroes JSONB,
    profile_data JSONB,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(steam_account_id, position, data_type)
);

-- Index za brze pretrage
CREATE INDEX IF NOT EXISTS idx_player_cache_lookup ON player_cache(steam_account_id, data_type);

-- RLS politika - dozvoli sve operacije (za sada)
ALTER TABLE player_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations" ON player_cache;

-- Create policy
CREATE POLICY "Allow all operations" ON player_cache FOR ALL USING (true) WITH CHECK (true);
