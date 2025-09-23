-- Continue with remaining RLS policies

-- Policies for platforms
CREATE POLICY "Public read platforms" 
    ON platforms 
    FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert custom platforms" 
    ON platforms 
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL AND is_custom = true AND created_by = auth.uid());

CREATE POLICY "Users can update own custom platforms" 
    ON platforms 
    FOR UPDATE 
    USING (is_custom = true AND created_by = auth.uid()) 
    WITH CHECK (is_custom = true AND created_by = auth.uid());

CREATE POLICY "Users can delete own custom platforms" 
    ON platforms 
    FOR DELETE 
    USING (is_custom = true AND created_by = auth.uid());

-- Policies for currencies
CREATE POLICY "Public read currencies" 
    ON currencies 
    FOR SELECT 
    USING (true);

-- Policies for exchange_rates
CREATE POLICY "Public read exchange rates" 
    ON exchange_rates 
    FOR SELECT 
    USING (true);

CREATE POLICY "Service role can manage exchange rates" 
    ON exchange_rates 
    FOR ALL 
    USING (auth.role() = 'service_role') 
    WITH CHECK (auth.role() = 'service_role');

-- Policies for crypto_prices
CREATE POLICY "Public read crypto prices" 
    ON crypto_prices 
    FOR SELECT 
    USING (true);

CREATE POLICY "Service role can manage crypto prices" 
    ON crypto_prices 
    FOR ALL 
    USING (auth.role() = 'service_role') 
    WITH CHECK (auth.role() = 'service_role');