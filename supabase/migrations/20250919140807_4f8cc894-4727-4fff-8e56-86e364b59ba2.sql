-- STEP 8: Create Views

-- View 1: cashflow_summary
CREATE VIEW cashflow_summary AS
WITH latest_rates AS (
    SELECT DISTINCT ON (from_currency, to_currency) 
        from_currency, 
        to_currency, 
        rate,
        updated_at
    FROM exchange_rates 
    ORDER BY from_currency, to_currency, updated_at DESC
),
entry_cashflows AS (
    SELECT 
        je.id,
        je.user_id,
        je.date,
        je.type,
        je.currency,
        je.quantity,
        je.price_usd,
        je.pnl,
        COALESCE((je.extras->>'cashflow_type')::text, 'outflow') AS cashflow_type,
        COALESCE(lr_to_php.rate, 1::NUMERIC) AS usd_to_php_rate,
        CASE 
            WHEN je.currency = 'USD' THEN 1::NUMERIC
            ELSE COALESCE(lr_from_usd.rate, 1::NUMERIC)
        END AS currency_to_usd_rate
    FROM journal_entries je
    LEFT JOIN latest_rates lr_to_php ON (
        lr_to_php.from_currency = 'USD' AND 
        lr_to_php.to_currency = 'PHP'
    )
    LEFT JOIN latest_rates lr_from_usd ON (
        lr_from_usd.from_currency = je.currency AND 
        lr_from_usd.to_currency = 'USD'
    )
    WHERE je.extras ? 'cashflow_type'
)
SELECT 
    ec.user_id,
    ec.date,
    ec.type,
    ec.currency,
    ec.cashflow_type,
    ec.usd_to_php_rate,
    ec.currency_to_usd_rate,
    CASE 
        WHEN ec.cashflow_type = 'inflow' THEN
            COALESCE(ec.quantity * ec.price_usd * ec.currency_to_usd_rate, ec.pnl * ec.currency_to_usd_rate, 0)
        ELSE 0
    END AS inflow_usd,
    CASE 
        WHEN ec.cashflow_type = 'outflow' THEN
            COALESCE(ec.quantity * ec.price_usd * ec.currency_to_usd_rate, ABS(ec.pnl) * ec.currency_to_usd_rate, 0)
        ELSE 0
    END AS outflow_usd,
    CASE 
        WHEN ec.cashflow_type = 'inflow' THEN
            COALESCE(ec.quantity * ec.price_usd * ec.currency_to_usd_rate, ec.pnl * ec.currency_to_usd_rate, 0) * ec.usd_to_php_rate
        ELSE 0
    END AS inflow_php,
    CASE 
        WHEN ec.cashflow_type = 'outflow' THEN
            COALESCE(ec.quantity * ec.price_usd * ec.currency_to_usd_rate, ABS(ec.pnl) * ec.currency_to_usd_rate, 0) * ec.usd_to_php_rate
        ELSE 0
    END AS outflow_php
FROM entry_cashflows ec
ORDER BY ec.date DESC;