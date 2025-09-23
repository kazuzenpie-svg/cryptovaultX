-- Continue with remaining core tables

-- Table 3: currencies
CREATE TABLE currencies (
    code currency_code PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    is_base BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT currencies_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
    CONSTRAINT currencies_symbol_length CHECK (char_length(symbol) >= 1 AND char_length(symbol) <= 5)
);

-- Index for currencies
CREATE INDEX idx_currencies_is_base ON currencies(is_base);

-- Table 4: exchange_rates
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency currency_code NOT NULL REFERENCES currencies(code),
    to_currency currency_code NOT NULL REFERENCES currencies(code),
    rate NUMERIC(12,6) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL DEFAULT 'freecurrencyapi.com',
    
    -- Constraints
    CONSTRAINT exchange_rates_rate_positive CHECK (rate > 0),
    CONSTRAINT exchange_rates_different_currencies CHECK (from_currency != to_currency),
    CONSTRAINT exchange_rates_source_length CHECK (char_length(source) >= 3 AND char_length(source) <= 100),
    
    -- Unique constraint
    UNIQUE(from_currency, to_currency)
);

-- Indexes for exchange_rates
CREATE INDEX idx_exchange_rates_pair_updated ON exchange_rates(from_currency, to_currency, updated_at DESC);
CREATE INDEX idx_exchange_rates_updated_at ON exchange_rates(updated_at DESC);