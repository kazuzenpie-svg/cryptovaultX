-- STEP 6: Enable Row Level Security on all tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create RLS Policies

-- Policies for profiles
CREATE POLICY "Users can view own profile" 
    ON profiles 
    FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON profiles 
    FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles viewable by connections" 
    ON profiles 
    FOR SELECT 
    USING (
        privacy_sharing = 'public'::privacy_level OR 
        (
            privacy_sharing = 'connections_only'::privacy_level AND
            EXISTS (
                SELECT 1 FROM access_grants 
                WHERE (viewer_id = auth.uid() AND sharer_id = profiles.id AND status = 'granted'::grant_status)
                OR (sharer_id = auth.uid() AND viewer_id = profiles.id AND status = 'granted'::grant_status)
            )
        )
    );