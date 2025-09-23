-- Create Additional Indexes for Performance (without problematic partial indexes)

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date_type ON journal_entries(user_id, date DESC, type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_asset_date ON journal_entries(asset, date DESC);
CREATE INDEX IF NOT EXISTS idx_access_grants_sharer_status ON access_grants(sharer_id, status);
CREATE INDEX IF NOT EXISTS idx_access_grants_viewer_status ON access_grants(viewer_id, status);

-- Simple partial indexes for active data (without NOW() function)
CREATE INDEX IF NOT EXISTS idx_access_grants_active ON access_grants(status) WHERE status IN ('pending', 'granted');

-- GIN indexes for JSONB operations
CREATE INDEX IF NOT EXISTS idx_journal_entries_extras_gin ON journal_entries USING GIN (extras);