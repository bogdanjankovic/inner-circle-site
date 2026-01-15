-- Shuffle Teams Table
-- Stores confirmed shuffle team formations

CREATE TABLE IF NOT EXISTS shuffle_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teams JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shuffle_teams ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for now)
CREATE POLICY "Allow all operations on shuffle_teams" ON shuffle_teams
    FOR ALL USING (true) WITH CHECK (true);
