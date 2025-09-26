-- Create per-user API preferences table
CREATE TABLE IF NOT EXISTS public.user_api_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tokenmetrics_api_key TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_api_prefs ENABLE ROW LEVEL SECURITY;

-- Policy: each user can read their own prefs
CREATE POLICY IF NOT EXISTS "user can select own prefs"
  ON public.user_api_prefs
  FOR SELECT
  USING ( auth.uid() = user_id );

-- Policy: each user can insert their own row
CREATE POLICY IF NOT EXISTS "user can insert own prefs"
  ON public.user_api_prefs
  FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- Policy: each user can update their own row
CREATE POLICY IF NOT EXISTS "user can update own prefs"
  ON public.user_api_prefs
  FOR UPDATE
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- Grant necessary permissions
GRANT ALL ON TABLE public.user_api_prefs TO authenticated;
