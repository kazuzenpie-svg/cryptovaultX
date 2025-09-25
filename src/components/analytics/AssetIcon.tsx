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

    const url = iconUrlFor(symbol);

    // Try SVG first
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error('Icon not found');
        const svg = await res.text();
        const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        if (!didCancel) {
          setSrc(dataUrl);
          cacheSet(cacheKey, dataUrl, CACHE_TTL);
        }
      })
      .catch(() => {
        // Fallback order:
        // 1) spothq PNG (since we already tried SVG)
        // 2) CoinGecko mapping as a last resort (if it appears later)
        const pngUrl = pngFallbackUrlFor(symbol);
        if (!didCancel) {
          setSrc(pngUrl);
          cacheSet(cacheKey, pngUrl, CACHE_TTL);
        }
      });

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
