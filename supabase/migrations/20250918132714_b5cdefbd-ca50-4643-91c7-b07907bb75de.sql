-- STEP 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create all enums (execute in order)
-- Privacy levels for user profiles
CREATE TYPE privacy_level AS ENUM ('public', 'connections_only', 'private');

-- Journal entry types
CREATE TYPE entry_type AS ENUM (
    'spot', 
    'futures', 
    'wallet', 
    'dual_investment', 
    'liquidity_mining', 
    'liquidity_pool', 
    'other'
);

-- Trade sides for spot/futures
CREATE TYPE trade_side AS ENUM ('buy', 'sell');

-- Access grant statuses
CREATE TYPE grant_status AS ENUM ('pending', 'granted', 'denied', 'revoked');

-- Supported currencies
CREATE TYPE currency_code AS ENUM ('USD', 'PHP');

-- Cashflow directions
CREATE TYPE cashflow_type AS ENUM ('inflow', 'outflow');