import React, { useState } from 'react';

// Crypto icon mapping - using reliable CDN sources
const CRYPTO_ICONS: Record<string, string> = {
  'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  'BNB': 'https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png',
  'ADA': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  'XRP': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  'DOT': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  'DOGE': 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  'AVAX': 'https://assets.coingecko.com/coins/images/12559/small/coin-round-red.png',
  'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  'LTC': 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  'UNI': 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
  'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  'ATOM': 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
  'BCH': 'https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png',
  'XLM': 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png',
  'VET': 'https://assets.coingecko.com/coins/images/1167/small/VET_Token_Icon.png',
  'FIL': 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
  'TRX': 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  'ETC': 'https://assets.coingecko.com/coins/images/453/small/ethereum-classic-logo.png',
  'ALGO': 'https://assets.coingecko.com/coins/images/4380/small/download.png',
  'AAVE': 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
  'MANA': 'https://assets.coingecko.com/coins/images/878/small/decentraland-mana.png',
  'SAND': 'https://assets.coingecko.com/coins/images/12129/small/sandbox.png',
  'CRV': 'https://assets.coingecko.com/coins/images/12124/small/Curve.png',
  'SUSHI': 'https://assets.coingecko.com/coins/images/12271/small/sushiswap.png',
  'COMP': 'https://assets.coingecko.com/coins/images/10775/small/COMP.png',
  'YFI': 'https://assets.coingecko.com/coins/images/11849/small/yfi-192x192.png',
  'SNX': 'https://assets.coingecko.com/coins/images/3406/small/SNX.png',
  'MKR': 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png',
  'ENJ': 'https://assets.coingecko.com/coins/images/1102/small/enjin-coin-logo.png',
  'BAT': 'https://assets.coingecko.com/coins/images/677/small/basic-attention-token.png',
  'ZRX': 'https://assets.coingecko.com/coins/images/863/small/0x.png',
  'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  'USDC': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  'BUSD': 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png',
  'DAI': 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
  'ARB': 'https://assets.coingecko.com/coins/images/16547/small/arb.jpg',
  'OP': 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
  'TIA': 'https://assets.coingecko.com/coins/images/31967/small/tia.jpg',
  'SUI': 'https://assets.coingecko.com/coins/images/26375/small/sui.png',
  'APT': 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
  'SEI': 'https://assets.coingecko.com/coins/images/28205/small/Sei_Logo_-_Transparent.png',
  'WLD': 'https://assets.coingecko.com/coins/images/31069/small/worldcoin.jpeg',
  'DYDX': 'https://assets.coingecko.com/coins/images/17500/small/hjnIm9bV.jpg',
  'HBAR': 'https://assets.coingecko.com/coins/images/3688/small/hbar.png',
  'OM': 'https://assets.coingecko.com/coins/images/30980/small/token-logo.png'
};

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function CryptoIcon({ symbol, size = 32, className = '' }: CryptoIconProps) {
  const [imageError, setImageError] = useState(false);
  const upperSymbol = symbol.toUpperCase().replace(/\/USDT$|\/USD$/, '');
  const iconUrl = CRYPTO_ICONS[upperSymbol];

  if (imageError || !iconUrl) {
    // Fallback to text representation
    return (
      <span className={`text-white font-bold text-sm ${className}`} style={{ fontSize: size * 0.4 }}>
        {upperSymbol.substring(0, 3)}
      </span>
    );
  }

  return (
    <img
      src={iconUrl}
      alt={`${symbol} icon`}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      onError={() => setImageError(true)}
    />
  );
}

// Hook for managing crypto icons
export function useCryptoIcons() {
  const getIconUrl = (symbol: string): string | null => {
    const upperSymbol = symbol.toUpperCase().replace(/\/USDT$|\/USD$/, '');
    return CRYPTO_ICONS[upperSymbol] || null;
  };

  const hasIcon = (symbol: string): boolean => {
    const upperSymbol = symbol.toUpperCase().replace(/\/USDT$|\/USD$/, '');
    return !!CRYPTO_ICONS[upperSymbol];
  };

  return {
    getIconUrl,
    hasIcon,
    CryptoIcon
  };
}
