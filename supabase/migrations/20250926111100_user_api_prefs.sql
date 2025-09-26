-- Create per-user API preferences table
create table if not exists public.user_api_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tokenmetrics_api_key text,
  updated_at timestamptz not null default now()
);

alter table public.user_api_prefs enable row level security;

-- Policy: each user can read their own prefs
create policy if not exists "user can select own prefs"
  on public.user_api_prefs
  for select
  using ( auth.uid() = user_id );

-- Policy: each user can insert their own row
create policy if not exists "user can insert own prefs"
  on public.user_api_prefs
  for insert
  with check ( auth.uid() = user_id );

-- Policy: each user can update their own row
create policy if not exists "user can update own prefs"
  on public.user_api_prefs
  for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- Optional: mask key in logs by avoiding triggers; ensure least-privilege clients
