-- STEP 2: Create Core Tables

-- Table 1: profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    trading_focus TEXT[],
    privacy_sharing privacy_level NOT NULL DEFAULT 'connections_only',
    preferred_currency currency_code NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT profiles_username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    CONSTRAINT profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$'),
    CONSTRAINT profiles_bio_length CHECK (char_length(bio) <= 500)
);

-- Indexes for profiles
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- Table 2: platforms
CREATE TABLE platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT platforms_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
    CONSTRAINT platforms_slug_format CHECK (slug ~ '^[a-z0-9_-]+$'),
    CONSTRAINT platforms_slug_length CHECK (char_length(slug) >= 2 AND char_length(slug) <= 30)
);

-- Indexes for platforms
CREATE INDEX idx_platforms_slug ON platforms(slug);
CREATE INDEX idx_platforms_is_custom ON platforms(is_custom);
CREATE INDEX idx_platforms_created_by ON platforms(created_by) WHERE is_custom = true;