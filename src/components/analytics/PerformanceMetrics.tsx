import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePortfolioMetrics } from '@/hooks/usePortfolioMetrics';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award,
  AlertTriangle,
  BarChart3,
  DollarSign,
  Percent
} from 'lucide-react';

export function PerformanceMetrics() {
  const { metrics, loading } = usePortfolioMetrics();

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const performanceCards = [
    {
      title: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      icon: Target,
      color: metrics.winRate >= 50 ? 'text-success' : 'text-warning',
      bgColor: metrics.winRate >= 50 ? 'bg-success/10' : 'bg-warning/10',
      description: `${metrics.totalTrades} total trades`
    },
    {
      title: 'Avg Trade Size',
      value: `$${metrics.avgTradeSize.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      description: 'Per trade average'
    },
    {
      title: 'Day P&L',
      value: `${metrics.dayPnL >= 0 ? '+' : ''}$${metrics.dayPnL.toLocaleString()}`,
      icon: metrics.dayPnL >= 0 ? TrendingUp : TrendingDown,
      color: metrics.dayPnL >= 0 ? 'text-success' : 'text-destructive',
      bgColor: metrics.dayPnL >= 0 ? 'bg-success/10' : 'bg-destructive/10',
      description: 'Last 24 hours'
    },
    {
      title: 'Week P&L',
      value: `${metrics.weekPnL >= 0 ? '+' : ''}$${metrics.weekPnL.toLocaleString()}`,
      icon: metrics.weekPnL >= 0 ? TrendingUp : TrendingDown,
      color: metrics.weekPnL >= 0 ? 'text-success' : 'text-destructive',
      bgColor: metrics.weekPnL >= 0 ? 'bg-success/10' : 'bg-destructive/10',
      description: 'Current week (Mon-Sun)'
    },
    {
      title: 'Month P&L',
      value: `${metrics.monthPnL >= 0 ? '+' : ''}$${metrics.monthPnL.toLocaleString()}`,
      icon: metrics.monthPnL >= 0 ? TrendingUp : TrendingDown,
      color: metrics.monthPnL >= 0 ? 'text-success' : 'text-destructive',
      bgColor: metrics.monthPnL >= 0 ? 'bg-success/10' : 'bg-destructive/10',
      description: 'Current month'
    },
    {
      title: 'Total Return',
      value: `${metrics.totalPnLPercentage >= 0 ? '+' : ''}${metrics.totalPnLPercentage.toFixed(2)}%`,
      icon: Percent,
      color: metrics.totalPnLPercentage >= 0 ? 'text-success' : 'text-destructive',
      bgColor: metrics.totalPnLPercentage >= 0 ? 'bg-success/10' : 'bg-destructive/10',
      description: 'Overall performance'
    }
  ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {performanceCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${card.color}`}>
                    {card.value}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {card.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {card.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Best/Worst Performers */}
        {(metrics.bestPerformer || metrics.worstPerformer) && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Asset Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.bestPerformer && (
                <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-success" />
                    <span className="font-medium">Best Performer</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-success">
                      {metrics.bestPerformer!.asset}
                    </div>
                    <div className="text-sm text-success">
                      +{metrics.bestPerformer!.percentage.toFixed(1)}% (+${metrics.bestPerformer!.pnl.toLocaleString()})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${metrics.bestPerformer!.invested.toLocaleString()} invested
                    </div>
                  </div>
                </div>
              )}
              
              {metrics.worstPerformer && metrics.worstPerformer.pnl < 0 && (
                <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="font-medium">Worst Performer</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-destructive">
                      {metrics.worstPerformer!.asset}
                    </div>
                    <div className="text-sm text-destructive">
                      {metrics.worstPerformer!.percentage.toFixed(1)}% (${metrics.worstPerformer!.pnl.toLocaleString()})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${metrics.worstPerformer!.invested.toLocaleString()} invested
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}