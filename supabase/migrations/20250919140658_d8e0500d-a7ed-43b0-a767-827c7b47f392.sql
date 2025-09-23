-- Policies for journal_entries
CREATE POLICY "Users can manage own entries" 
    ON journal_entries 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view granted entries" 
    ON journal_entries 
    FOR SELECT 
    USING (
        auth.uid() = user_id OR (
            is_personal = false AND
            EXISTS (
                SELECT 1 FROM access_grants ag
                WHERE ag.viewer_id = auth.uid() 
                AND ag.sharer_id = journal_entries.user_id 
                AND ag.status = 'granted'::grant_status
                AND (ag.expires_at IS NULL OR ag.expires_at > NOW())
                AND (ag.date_from IS NULL OR journal_entries.date >= ag.date_from)
                AND (ag.date_to IS NULL OR journal_entries.date <= ag.date_to)
                AND (ag.min_pnl IS NULL OR journal_entries.pnl >= ag.min_pnl)
                AND (
                    cardinality(ag.shared_types) = 0 OR 
                    journal_entries.type = ANY(ag.shared_types)
                )
            )
        )
    );

-- Policies for access_grants
CREATE POLICY "Users can view grants where involved" 
    ON access_grants 
    FOR SELECT 
    USING (auth.uid() IN (viewer_id, sharer_id));

CREATE POLICY "Users can request access" 
    ON access_grants 
    FOR INSERT 
    WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Sharers can manage grant status" 
    ON access_grants 
    FOR UPDATE 
    USING (auth.uid() = sharer_id) 
    WITH CHECK (auth.uid() = sharer_id);

CREATE POLICY "Users can delete own requests" 
    ON access_grants 
    FOR DELETE 
    USING (auth.uid() = viewer_id AND status = 'pending'::grant_status);