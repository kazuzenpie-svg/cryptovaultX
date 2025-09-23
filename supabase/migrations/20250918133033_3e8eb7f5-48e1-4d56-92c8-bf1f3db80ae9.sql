-- Create remaining core tables

-- Table 5: crypto_prices
CREATE TABLE crypto_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_slug TEXT NOT NULL,
    price_usd NUMERIC(20,8) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL DEFAULT 'coingecko.com',
    
    -- Constraints
    CONSTRAINT crypto_prices_asset_slug_length CHECK (char_length(asset_slug) >= 1 AND char_length(asset_slug) <= 100),
    CONSTRAINT crypto_prices_asset_slug_format CHECK (asset_slug ~ '^[a-z0-9_-]+$'),
    CONSTRAINT crypto_prices_price_positive CHECK (price_usd > 0),
    CONSTRAINT crypto_prices_source_length CHECK (char_length(source) >= 3 AND char_length(source) <= 100),
    
    -- Unique constraint
    UNIQUE(asset_slug)
);

-- Indexes for crypto_prices
CREATE INDEX idx_crypto_prices_asset_updated ON crypto_prices(asset_slug, updated_at DESC);
CREATE INDEX idx_crypto_prices_updated_at ON crypto_prices(updated_at DESC);

-- Table 6: journal_entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type entry_type NOT NULL,
    platform_id UUID REFERENCES platforms(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    asset TEXT NOT NULL,
    quantity NUMERIC(20,8),
    price_usd NUMERIC(20,4),
    fees NUMERIC(20,8) NOT NULL DEFAULT 0,
    pnl NUMERIC(20,4) NOT NULL DEFAULT 0,
    side trade_side,
    leverage INTEGER,
    currency currency_code NOT NULL DEFAULT 'USD',
    notes TEXT,
    extras JSONB NOT NULL DEFAULT '{}',
    is_personal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT journal_entries_asset_length CHECK (char_length(asset) >= 1 AND char_length(asset) <= 50),
    CONSTRAINT journal_entries_quantity_positive CHECK (quantity IS NULL OR quantity > 0),
    CONSTRAINT journal_entries_price_positive CHECK (price_usd IS NULL OR price_usd > 0),
    CONSTRAINT journal_entries_fees_non_negative CHECK (fees >= 0),
    CONSTRAINT journal_entries_leverage_positive CHECK (leverage IS NULL OR leverage > 0),
    CONSTRAINT journal_entries_notes_length CHECK (char_length(notes) <= 1000),
    CONSTRAINT journal_entries_spot_requires_side CHECK (
        (type != 'spot') OR (type = 'spot' AND side IS NOT NULL)
    ),
    CONSTRAINT journal_entries_futures_requires_leverage CHECK (
        (type != 'futures') OR (type = 'futures' AND leverage IS NOT NULL)
    )
);

-- Indexes for journal_entries
CREATE INDEX idx_journal_entries_user_type_date ON journal_entries(user_id, type, date DESC);
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, date DESC);
CREATE INDEX idx_journal_entries_asset ON journal_entries(asset);
CREATE INDEX idx_journal_entries_platform_id ON journal_entries(platform_id);
CREATE INDEX idx_journal_entries_currency ON journal_entries(currency);
CREATE INDEX idx_journal_entries_is_personal ON journal_entries(is_personal);
CREATE INDEX idx_journal_entries_extras_cashflow ON journal_entries USING GIN ((extras->'cashflow_type'));