-- Create missing access_grants table
CREATE TABLE access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sharer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status grant_status NOT NULL DEFAULT 'pending',
    shared_types entry_type[] NOT NULL DEFAULT '{}',
    date_from TIMESTAMP WITH TIME ZONE,
    date_to TIMESTAMP WITH TIME ZONE,
    min_pnl NUMERIC(20,4),
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT access_grants_different_users CHECK (viewer_id != sharer_id),
    CONSTRAINT access_grants_valid_date_range CHECK (date_from IS NULL OR date_to IS NULL OR date_from <= date_to),
    CONSTRAINT access_grants_message_length CHECK (char_length(message) <= 500),
    CONSTRAINT access_grants_expires_future CHECK (expires_at IS NULL OR expires_at > created_at),
    
    -- Unique constraint
    UNIQUE(viewer_id, sharer_id)
);

-- Indexes for access_grants
CREATE INDEX idx_access_grants_viewer_id ON access_grants(viewer_id);
CREATE INDEX idx_access_grants_sharer_id ON access_grants(sharer_id);
CREATE INDEX idx_access_grants_status ON access_grants(status);
CREATE INDEX idx_access_grants_expires_at ON access_grants(expires_at) WHERE expires_at IS NOT NULL;