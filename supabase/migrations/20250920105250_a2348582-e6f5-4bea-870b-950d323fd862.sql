-- View 2: portfolio_summary (if it doesn't exist)
CREATE VIEW portfolio_summary AS
WITH latest_prices AS (
    SELECT DISTINCT ON (asset_slug) 
        asset_slug, 
        price_usd,
        updated_at
    FROM crypto_prices 
    WHERE updated_at >= NOW() - INTERVAL '2 hours'
    ORDER BY asset_slug, updated_at DESC
),
asset_positions AS (
    SELECT 
        je.user_id,
        je.asset,
        SUM(
            CASE 
                WHEN je.type IN ('spot', 'wallet') AND je.side = 'buy' THEN je.quantity
                WHEN je.type IN ('spot', 'wallet') AND je.side = 'sell' THEN -je.quantity
                WHEN je.type = 'wallet' THEN COALESCE(je.quantity, 0)
                ELSE 0
            END
        ) AS total_quantity,
        AVG(je.price_usd) AS avg_entry_price,
        SUM(je.pnl) AS total_pnl
    FROM journal_entries je
    WHERE je.type IN ('spot', 'wallet')
    GROUP BY je.user_id, je.asset
    HAVING SUM(
        CASE 
            WHEN je.type IN ('spot', 'wallet') AND je.side = 'buy' THEN je.quantity
            WHEN je.type IN ('spot', 'wallet') AND je.side = 'sell' THEN -je.quantity
            WHEN je.type = 'wallet' THEN COALESCE(je.quantity, 0)
            ELSE 0
        END
    ) > 0
)
SELECT 
    ap.user_id,
    ap.asset,
    ap.total_quantity,
    ap.avg_entry_price,
    ap.total_pnl,
    COALESCE(lp.price_usd, ap.avg_entry_price) AS current_price_usd,
    ap.total_quantity * COALESCE(lp.price_usd, ap.avg_entry_price) AS current_value_usd,
    lp.updated_at AS price_last_updated
FROM asset_positions ap
LEFT JOIN latest_prices lp ON (ap.asset = lp.asset_slug)
ORDER BY current_value_usd DESC;

-- STEP 9: Create Additional Indexes for Performance
-- Composite indexes for common query patterns
CREATE INDEX idx_journal_entries_user_date_type ON journal_entries(user_id, date DESC, type);
CREATE INDEX idx_journal_entries_asset_date ON journal_entries(asset, date DESC);
CREATE INDEX idx_access_grants_sharer_status ON access_grants(sharer_id, status);
CREATE INDEX idx_access_grants_viewer_status ON access_grants(viewer_id, status);

-- Partial indexes for active data
CREATE INDEX idx_journal_entries_recent ON journal_entries(date DESC) WHERE date >= NOW() - INTERVAL '1 year';
CREATE INDEX idx_access_grants_active ON access_grants(status) WHERE status IN ('pending', 'granted');

-- GIN indexes for JSONB operations
CREATE INDEX idx_journal_entries_extras_gin ON journal_entries USING GIN (extras);