-- STEP 5: Create Triggers

-- Triggers for updated_at
CREATE TRIGGER trigger_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_journal_entries_updated_at 
    BEFORE UPDATE ON journal_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_access_grants_updated_at 
    BEFORE UPDATE ON access_grants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auto cashflow
CREATE TRIGGER trigger_auto_cashflow 
    BEFORE INSERT OR UPDATE ON journal_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION auto_set_cashflow_type();