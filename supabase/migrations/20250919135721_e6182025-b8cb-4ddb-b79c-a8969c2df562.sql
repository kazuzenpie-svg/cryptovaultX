-- STEP 3: Insert Seed Data

-- Seed currencies
INSERT INTO currencies (code, name, symbol, is_base) VALUES 
('USD', 'US Dollar', '$', true),
('PHP', 'Philippine Peso', '₱', false)
ON CONFLICT (code) DO NOTHING;

-- Seed platforms
INSERT INTO platforms (name, slug, description, logo_url, is_custom, created_by) VALUES
('Binance', 'binance', 'Leading CEX for spot/futures trading', 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png', false, NULL),
('Coinbase', 'coinbase', 'US-regulated exchange', 'https://cryptologos.cc/logos/coinbase-coin-logo.png', false, NULL),
('MEXC', 'mexc', 'High-volume global exchange', 'https://cryptologos.cc/logos/mexc-logo.png', false, NULL),
('Bitget', 'bitget', 'Derivatives-focused exchange', 'https://cryptologos.cc/logos/bitget-logo.png', false, NULL),
('Bybit', 'bybit', 'Derivatives and spot trading', 'https://cryptologos.cc/logos/bybit-logo.png', false, NULL),
('OKX', 'okx', 'Global CEX with DeFi tools', 'https://cryptologos.cc/logos/okx-logo.png', false, NULL),
('HTX', 'htx', 'Former Huobi, high liquidity', 'https://cryptologos.cc/logos/htx-logo.png', false, NULL),
('Kraken', 'kraken', 'Secure US exchange', 'https://cryptologos.cc/logos/kraken-logo.png', false, NULL),
('Gate.io', 'gateio', 'Wide altcoin support', 'https://cryptologos.cc/logos/gateio-logo.png', false, NULL),
('Uniswap', 'uniswap', 'Leading DEX on Ethereum', 'https://cryptologos.cc/logos/uniswap-logo.png', false, NULL),
('PancakeSwap', 'pancakeswap', 'BSC DEX for liquidity provision', 'https://cryptologos.cc/logos/pancakeswap-logo.png', false, NULL),
('LBank', 'lbank', 'Emerging high-volume exchange', 'https://cryptologos.cc/logos/lbank-logo.png', false, NULL)
ON CONFLICT (slug) DO NOTHING;