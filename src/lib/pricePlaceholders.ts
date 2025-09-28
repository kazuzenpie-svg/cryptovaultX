// Deterministic placeholder prices to prevent UI crashes when no DB data is available
// Only used as a fallback; real data should come from the database.

const PLACEHOLDERS: Record<string, number> = {
  BTC: 50000,
  ETH: 3000,
  BNB: 400,
  SOL: 150,
  ADA: 0.4,
  XRP: 0.6,
  DOGE: 0.1,
  MATIC: 0.7,
  LTC: 70,
  AVAX: 30,
  LINK: 15,
  DOT: 5,
  SHIB: 0.00002,
  TRX: 0.1,
  BCH: 200,
  ATOM: 8,
  ARB: 0.9,
  OP: 1.8,
  TIA: 4,
  SUI: 1.2,
  APT: 6,
  SEI: 0.3,
  WLD: 1.5,
  DYDX: 2.5,
  HBAR: 0.08,
  OM: 1.0,
  USDT: 1.0,
  USDC: 1.0,
  DAI: 1.0,
};

export function getPlaceholderPrices(symbols: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const sym of symbols) {
    const key = (sym || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (PLACEHOLDERS[key] !== undefined) {
      out[key] = PLACEHOLDERS[key];
    }
  }
  return out;
}
