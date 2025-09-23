-- STEP 4: Create Functions

-- Function 1: Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Auto-set cashflow type
CREATE OR REPLACE FUNCTION auto_set_cashflow_type()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip if manual override exists
    IF NEW.extras ? 'cashflow_type' THEN
        RETURN NEW;
    END IF;

    -- Set smart defaults based on entry type and context
    CASE NEW.type
        WHEN 'spot' THEN
            NEW.extras := NEW.extras || jsonb_build_object(
                'cashflow_type', 
                CASE NEW.side 
                    WHEN 'sell' THEN 'inflow'::text 
                    ELSE 'outflow'::text 
                END
            );
        WHEN 'futures' THEN
            NEW.extras := NEW.extras || jsonb_build_object(
                'cashflow_type', 
                CASE WHEN NEW.pnl > 0 THEN 'inflow'::text ELSE 'outflow'::text END
            );
        WHEN 'wallet' THEN
            NEW.extras := NEW.extras || jsonb_build_object('cashflow_type', 'inflow'::text);
        WHEN 'dual_investment' THEN
            NEW.extras := NEW.extras || jsonb_build_object('cashflow_type', 'inflow'::text);
        WHEN 'liquidity_mining' THEN
            NEW.extras := NEW.extras || jsonb_build_object('cashflow_type', 'inflow'::text);
        WHEN 'liquidity_pool' THEN
            NEW.extras := NEW.extras || jsonb_build_object('cashflow_type', 'inflow'::text);
        ELSE
            NEW.extras := NEW.extras || jsonb_build_object('cashflow_type', 'outflow'::text);
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Clean expired grants
CREATE OR REPLACE FUNCTION clean_expired_grants()
RETURNS void AS $$
BEGIN
    UPDATE access_grants 
    SET status = 'revoked'::grant_status,
        updated_at = NOW()
    WHERE status = 'granted'::grant_status 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;