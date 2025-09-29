import { useEffect, useMemo, useState } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';
import { useCryptoIcons } from '../CryptoIcon';

interface AssetIconProps {
  symbol: string; // e.g., BTC
  size?: number; // pixels
  className?: string;
}

// Free icon CDN: https://github.com/spothq/cryptocurrency-icons
// We use jsdelivr to pull the colored SVG by ticker symbol when available
function normalize(symbol: string) {
  return symbol.toUpperCase().replace(/\/USDT$|\/USD$/, '');
}

function iconUrlFor(symbol: string) {
  const sym = normalize(symbol).toLowerCase();
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${sym}.svg`;
}

function pngFallbackUrlFor(symbol: string) {
  const sym = normalize(symbol).toLowerCase();
  // Use 64px color PNG as a broadly compatible fallback
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${sym}.png`;
}

// Attempt Binance-hosted currency logos (best-effort, not guaranteed for all symbols)
function binanceSvgUrlFor(symbol: string) {
  const sym = normalize(symbol).toUpperCase();
  // Public asset path used by Binance for many currency logos
  // If not available for a symbol, we'll fall back to other sources
  return `https://assets.binance.com/image/currencies/logo/${sym}.svg`;
}

const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

export function AssetIcon({ symbol, size = 24, className }: AssetIconProps) {
  const [src, setSrc] = useState<string | null>(null);
  const cacheKey = useMemo(() => `icon.${normalize(symbol)}`, [symbol]);
  const { getIconUrl } = useCryptoIcons();

  useEffect(() => {
    const cached = cacheGet<string>(cacheKey);
    if (cached) {
      setSrc(cached);
      return;
    }

    let didCancel = false;

    // 0) Prefer CoinGecko mapping to avoid 404 noise for symbols missing in spothq
    const cgUrlEarly = getIconUrl(normalize(symbol));
    if (cgUrlEarly) {
      setSrc(cgUrlEarly);
      cacheSet(cacheKey, cgUrlEarly, CACHE_TTL);
      return;
    }

    // 1) Try Binance-hosted SVG
    const tryBinance = async () => {
      try {
        const res = await fetch(binanceSvgUrlFor(symbol));
        if (!res.ok) throw new Error('Binance icon not found');
        const svg = await res.text();
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      } catch {
        return null;
      }
    };

    // 2) Try spothq SVG via jsdelivr
    const trySpotHqSvg = async () => {
      try {
        const res = await fetch(iconUrlFor(symbol));
        if (!res.ok) throw new Error('spothq SVG not found');
        const svg = await res.text();
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      } catch {
        return null;
      }
    };

    // 3) Fallback PNG from spothq
    const asPng = () => pngFallbackUrlFor(symbol);

    (async () => {
      const fromBinance = await tryBinance();
      if (!didCancel && fromBinance) {
        setSrc(fromBinance);
        cacheSet(cacheKey, fromBinance, CACHE_TTL);
        return;
      }

      const fromSvg = await trySpotHqSvg();
      if (!didCancel && fromSvg) {
        setSrc(fromSvg);
        cacheSet(cacheKey, fromSvg, CACHE_TTL);
        return;
      }

      const png = asPng();
      if (!didCancel) {
        setSrc(png);
        cacheSet(cacheKey, png, CACHE_TTL);
      }
    })();

    return () => {
      didCancel = true;
    };
  }, [cacheKey, symbol]);

  if (src) {
    return (
      <img
        src={src}
        width={size}
        height={size}
        alt={symbol}
        className={className}
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (img.src !== '/coin-fallback.svg') {
            img.src = '/coin-fallback.svg';
          }
        }}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Fallback: local coin placeholder SVG
  return (
    <img
      src={'/coin-fallback.svg'}
      width={size}
      height={size}
      alt={symbol}
      className={className}
      loading="lazy"
    />
  );
}
