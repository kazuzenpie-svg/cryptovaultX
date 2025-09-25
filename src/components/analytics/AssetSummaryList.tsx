import { useMemo, useState } from 'react';
import { useAssetSummaries } from '@/hooks/useAssetSummaries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetIcon } from './AssetIcon';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';

interface SortState {
  key: 'asset' | 'quantity' | 'marketValue' | 'totalPnL' | 'change24hPct';
  dir: 'asc' | 'desc';
}

export function AssetSummaryList() {
  const { summaries } = useAssetSummaries();
  const [sort, setSort] = useState<SortState>({ key: 'marketValue', dir: 'desc' });

  const sorted = useMemo(() => {
    const arr = [...summaries];
    arr.sort((a, b) => {
      let vA: number | string = 0;
      let vB: number | string = 0;
      switch (sort.key) {
        case 'asset': vA = a.asset; vB = b.asset; break;
        case 'quantity': vA = a.quantity; vB = b.quantity; break;
        case 'marketValue': vA = a.marketValue; vB = b.marketValue; break;
        case 'totalPnL': vA = a.totalPnL; vB = b.totalPnL; break;
        case 'change24hPct': vA = a.change24hPct ?? -Infinity; vB = b.change24hPct ?? -Infinity; break;
      }
      if (typeof vA === 'string' && typeof vB === 'string') {
        const cmp = vA.localeCompare(vB);
        return sort.dir === 'asc' ? cmp : -cmp;
      } else {
        const cmp = (vA as number) - (vB as number);
        return sort.dir === 'asc' ? cmp : -cmp;
      }
    });
    return arr;
  }, [summaries, sort]);

  const toggleSort = (key: SortState['key']) => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  };

  if (summaries.length === 0) return null;

  const HeaderButton = ({ label, k }: { label: string; k: SortState['key'] }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
      {label}
      {sort.key === k ? (sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
    </button>
  );

  return (
    <Card className="glass-card fade-in" style={{ animationDelay: '0.45s' }}>
      <CardHeader>
        <CardTitle>Per-Asset Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4"><HeaderButton label="Asset" k="asset" /></th>
                <th className="py-2 pr-4 text-right"><HeaderButton label="Qty" k="quantity" /></th>
                <th className="py-2 pr-4 text-right">Avg Price</th>
                <th className="py-2 pr-4 text-right"><HeaderButton label="Value" k="marketValue" /></th>
                <th className="py-2 pr-4 text-right"><HeaderButton label="PnL" k="totalPnL" /></th>
                <th className="py-2 pr-0 text-right"><HeaderButton label="24h %" k="change24hPct" /></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const change = s.change24hPct ?? 0;
                const changeColor = change > 0 ? 'text-green-600 dark:text-green-400' : change < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground';
                const pnlColor = s.totalPnL > 0 ? 'text-green-600 dark:text-green-400' : s.totalPnL < 0 ? 'text-red-600 dark:text-red-400' : '';
                return (
                  <tr key={s.asset} className="border-t">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <AssetIcon symbol={s.asset} size={22} />
                        <div className="font-medium">{s.asset}</div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">{s.quantity.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{s.avgPrice ? `$${s.avgPrice.toLocaleString()}` : '-'}</td>
                    <td className="py-3 pr-4 text-right tabular-nums font-medium">${s.marketValue.toLocaleString()}</td>
                    <td className={`py-3 pr-4 text-right tabular-nums font-medium ${pnlColor}`}>{s.totalPnL >= 0 ? '+' : ''}${s.totalPnL.toLocaleString()}</td>
                    <td className={`py-3 pr-0 text-right tabular-nums ${changeColor}`}>
                      <div className="inline-flex items-center gap-1">
                        {change > 0 ? <ArrowUp className="w-3 h-3" /> : change < 0 ? <ArrowDown className="w-3 h-3" /> : null}
                        {s.change24hPct != null ? `${change.toFixed(2)}%` : '-'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
