import { useEffect, useMemo, useState } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';
import { useCoinGeckoTokens } from '@/hooks/useCoinGeckoTokens';

interface AssetIconProps {
  symbol: string; // e.g., BTC
  asset?: string; // CoinGecko ID, e.g., bitcoin
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

const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

export function AssetIcon({ symbol, asset, size = 24, className }: AssetIconProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);

  // Use asset (CoinGecko ID) if provided, otherwise derive from symbol
  const coinGeckoId = asset || symbol.toLowerCase();
  const cacheKey = useMemo(() => `icon.${coinGeckoId}`, [coinGeckoId]);

  // Get CoinGecko data for this token
  const { getTokenIcon } = useCoinGeckoTokens([coinGeckoId]);

  useEffect(() => {
    const cached = cacheGet<string>(cacheKey);
    if (cached) {
      setSrc(cached);
      return;
    }

    let didCancel = false;

    // 1) Try CoinGecko API first (highest quality)
    const coinGeckoIcon = getTokenIcon(coinGeckoId);
    if (coinGeckoIcon) {
      setSrc(coinGeckoIcon);
      cacheSet(cacheKey, coinGeckoIcon, CACHE_TTL);
      return;
    }

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
  }, [cacheKey, symbol, coinGeckoId, getTokenIcon]);

  // Set fallback source once we have a primary source
  useEffect(() => {
    if (src && !fallbackSrc) {
      setFallbackSrc('/coin-fallback.svg');
    }
  }, [src, fallbackSrc]);

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

  // Loading state - show placeholder
  return (
    <div
      className={`bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="w-1/2 h-1/2 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse" />
    </div>
  );
}
