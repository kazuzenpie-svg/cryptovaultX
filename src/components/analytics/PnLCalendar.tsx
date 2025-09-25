import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

export function PnLCalendar() {
  const { entries } = useCombinedEntries();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const dailyPnL = new Map<string, number>();
    const dailyTrades = new Map<string, number>();

    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= monthStart && entryDate <= monthEnd) {
        const dateKey = format(entryDate, 'yyyy-MM-dd');
        const currentPnL = dailyPnL.get(dateKey) || 0;
        const currentTrades = dailyTrades.get(dateKey) || 0;
        
        dailyPnL.set(dateKey, currentPnL + entry.pnl);
        dailyTrades.set(dateKey, currentTrades + 1);
      }
    });

    return days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const pnl = dailyPnL.get(dateKey) || 0;
      const trades = dailyTrades.get(dateKey) || 0;
      
      return {
        date: day,
        pnl,
        trades,
        isToday: isSameDay(day, new Date())
      };
    });
  }, [entries, currentMonth]);

  const monthStats = useMemo(() => {
    const totalPnL = monthData.reduce((sum, day) => sum + day.pnl, 0);
    const totalTrades = monthData.reduce((sum, day) => sum + day.trades, 0);
    const profitableDays = monthData.filter(day => day.pnl > 0).length;
    const tradingDays = monthData.filter(day => day.trades > 0).length;
    
    return {
      totalPnL,
      totalTrades,
      profitableDays,
      tradingDays,
      winRate: tradingDays > 0 ? (profitableDays / tradingDays) * 100 : 0
    };
  }, [monthData]);

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'bg-success text-success-foreground';
    if (pnl < 0) return 'bg-destructive text-destructive-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const getPnLIntensity = (pnl: number) => {
    const maxPnL = Math.max(...monthData.map(d => Math.abs(d.pnl)));
    if (maxPnL === 0) return 0;
    return Math.abs(pnl) / maxPnL;
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            P&L Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Month Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className={`font-semibold ${monthStats.totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
              {monthStats.totalPnL >= 0 ? '+' : ''}${monthStats.totalPnL.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total P&L</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="font-semibold">{monthStats.totalTrades}</div>
            <div className="text-xs text-muted-foreground">Total Trades</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="font-semibold">{monthStats.tradingDays}</div>
            <div className="text-xs text-muted-foreground">Trading Days</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="font-semibold text-primary">{monthStats.winRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {monthData.map((day, index) => {
            const intensity = getPnLIntensity(day.pnl);
            const hasActivity = day.trades > 0;
            
            return (
              <div
                key={index}
                className={`
                  relative aspect-square p-1 rounded-md border transition-all hover:scale-105 cursor-pointer
                  ${day.isToday ? 'ring-2 ring-primary' : ''}
                  ${hasActivity ? 'border-primary/30' : 'border-muted'}
                `}
                style={{
                  backgroundColor: hasActivity 
                    ? day.pnl > 0 
                      ? `rgba(34, 197, 94, ${0.1 + intensity * 0.4})` // success color with opacity
                      : day.pnl < 0
                        ? `rgba(239, 68, 68, ${0.1 + intensity * 0.4})` // destructive color with opacity
                        : 'rgba(148, 163, 184, 0.1)' // neutral
                    : 'transparent'
                }}
                title={`${format(day.date, 'MMM dd')}: ${day.pnl >= 0 ? '+' : ''}$${day.pnl.toLocaleString()} (${day.trades} trades)`}
              >
                <div className="text-xs font-medium text-center">
                  {format(day.date, 'd')}
                </div>
                
                {hasActivity && (
                  <div className="absolute bottom-0 left-0 right-0 text-center">
                    <div className={`text-xs font-bold ${
                      day.pnl > 0
                        ? 'text-success'
                        : day.pnl < 0
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`}>
                      {day.pnl > 0 ? '+$' : '-$'}{Math.abs(day.pnl) >= 1000
                        ? `${(Math.abs(day.pnl) / 1000).toFixed(1)}k`
                        : Math.abs(day.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                )}
                
                {day.isToday && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-success/30 rounded"></div>
            <span>Profit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-destructive/30 rounded"></div>
            <span>Loss</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border border-muted rounded"></div>
            <span>No Activity</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}