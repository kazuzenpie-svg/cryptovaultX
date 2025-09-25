import { useEffect, useMemo, useState } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';

interface AssetIconProps {
  symbol: string; // e.g., BTC
  size?: number; // pixels
  className?: string;
}

// Free icon CDN: https://github.com/spothq/cryptocurrency-icons
// We use jsdelivr to pull the colored SVG by ticker symbol when available
function iconUrlFor(symbol: string) {
  const sym = symbol.toLowerCase();
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${sym}.svg`;
}

function pngFallbackUrlFor(symbol: string) {
  const sym = symbol.toLowerCase();
  // Use 64px color PNG as a broadly compatible fallback
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${sym}.png`;
}

const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

export function AssetIcon({ symbol, size = 24, className }: AssetIconProps) {
  const [src, setSrc] = useState<string | null>(null);
  const cacheKey = useMemo(() => `icon.${symbol.toUpperCase()}`, [symbol]);

  useEffect(() => {
    const cached = cacheGet<string>(cacheKey);
    if (cached) {
      setSrc(cached);
      return;
    }

    const url = iconUrlFor(symbol);
    let didCancel = false;

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
        // Fallback to PNG URL (no inline to keep it simple)
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
