import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { Activity } from 'lucide-react';

export function TradingHeatmap() {
  const { entries } = useCombinedEntries();

  const heatmapData = useMemo(() => {
    const hourlyActivity = new Array(24).fill(0).map(() => new Array(7).fill(0));
    const hourlyPnL = new Array(24).fill(0).map(() => new Array(7).fill(0));

    entries.forEach(entry => {
      const date = new Date(entry.date);
      const hour = date.getHours();
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      hourlyActivity[hour][day]++;
      hourlyPnL[hour][day] += entry.pnl;
    });

    const maxActivity = Math.max(...hourlyActivity.flat());
    const maxPnL = Math.max(...hourlyPnL.flat().map(Math.abs));

    return {
      activity: hourlyActivity,
      pnl: hourlyPnL,
      maxActivity,
      maxPnL
    };
  }, [entries]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getActivityIntensity = (count: number) => {
    if (heatmapData.maxActivity === 0) return 0;
    return count / heatmapData.maxActivity;
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) {
      const intensity = Math.abs(pnl) / heatmapData.maxPnL;
      return `rgba(34, 197, 94, ${0.2 + intensity * 0.6})`; // success color
    } else if (pnl < 0) {
      const intensity = Math.abs(pnl) / heatmapData.maxPnL;
      return `rgba(239, 68, 68, ${0.2 + intensity * 0.6})`; // destructive color
    }
    return 'rgba(148, 163, 184, 0.1)'; // neutral
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Trading Activity Heatmap
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your trading patterns by day and time (darker = more activity/higher P&L)
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Day labels */}
          <div className="grid grid-cols-8 gap-1 text-xs">
            <div></div> {/* Empty cell for hour labels */}
            {days.map(day => (
              <div key={day} className="text-center font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8 gap-1">
                <div className="text-xs text-muted-foreground text-right pr-2 flex items-center justify-end">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {days.map((_, dayIndex) => {
                  const activity = heatmapData.activity[hour][dayIndex];
                  const pnl = heatmapData.pnl[hour][dayIndex];
                  
                  return (
                    <div
                      key={dayIndex}
                      className="aspect-square rounded border border-muted/30 hover:border-primary/50 transition-all cursor-pointer"
                      style={{
                        backgroundColor: activity > 0 ? getPnLColor(pnl) : 'rgba(148, 163, 184, 0.05)'
                      }}
                      title={`${days[dayIndex]} ${hour.toString().padStart(2, '0')}:00 - ${activity} trades, ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} P&L`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Less activity</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted/20 rounded"></div>
              <div className="w-3 h-3 bg-primary/30 rounded"></div>
              <div className="w-3 h-3 bg-primary/60 rounded"></div>
              <div className="w-3 h-3 bg-primary rounded"></div>
            </div>
            <span>More activity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}