import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Activity, TrendingUp, Wallet, BarChart3, Coins, Zap, Layers, Users } from 'lucide-react';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { usePlatforms } from '@/hooks/usePlatforms';
import { formatDistanceToNow } from 'date-fns';

const entryTypeLabels = {
  spot: 'Spot Trading',
  futures: 'Futures',
  wallet: 'Wallet',
  dual_investment: 'Dual Investment',
  liquidity_mining: 'Liquidity Mining',
  liquidity_pool: 'Liquidity Pool',
  other: 'Other'
};

const entryTypeColors = {
  spot: 'bg-primary/20 text-primary',
  futures: 'bg-accent/20 text-accent',
  wallet: 'bg-success/20 text-success',
  dual_investment: 'bg-warning/20 text-warning',
  liquidity_mining: 'bg-purple-500/20 text-purple-500',
  liquidity_pool: 'bg-cyan-500/20 text-cyan-500',
  other: 'bg-muted text-muted-foreground'
};

export function RecentActivity() {
  const { entries, loading } = useCombinedEntries();
  const { platforms } = usePlatforms();
  
  // Get the 5 most recent entries
  const recentEntries = entries.slice(0, 5);

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'spot':
        return TrendingUp;
      case 'futures':
        return BarChart3;
      case 'wallet':
        return Wallet;
      case 'dual_investment':
        return Coins;
      case 'liquidity_mining':
        return Zap;
      case 'liquidity_pool':
        return Layers;
      default:
        return Activity;
    }
  };

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'spot':
        return 'text-success';
      case 'futures':
        return 'text-accent';
      case 'wallet':
        return 'text-primary';
      case 'dual_investment':
        return 'text-warning';
      case 'liquidity_mining':
        return 'text-info';
      case 'liquidity_pool':
        return 'text-secondary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getActionBadgeVariant = (type: string, side?: string): "default" | "destructive" | "secondary" | "outline" => {
    if (type === 'spot') {
      return side === 'buy' ? 'default' : 'destructive';
    }
    switch (type) {
      case 'wallet':
        return 'secondary';
      case 'futures':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatEntryValue = (entry: any) => {
    if (entry.type === 'spot' && entry.quantity && entry.price_usd) {
      const value = entry.quantity * entry.price_usd;
      return `$${value.toLocaleString()}`;
    }
    if (entry.pnl !== 0) {
      return `${entry.pnl > 0 ? '+' : ''}$${Math.abs(entry.pnl).toLocaleString()}`;
    }
    return '-';
  };

  const getPlatformName = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.name || 'Unknown Platform';
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading recent activity...</p>
          </div>
        ) : recentEntries.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground">Start by adding your first trade!</p>
          </div>
        ) : (
          recentEntries.map((entry) => {
            const Icon = getEntryIcon(entry.type);
            const actionLabel = entry.type === 'spot' 
              ? entry.side?.toUpperCase() || 'TRADE'
              : entry.type.toUpperCase().replace('_', ' ');
            
            return (
              <div 
                key={entry.id} 
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                    <Icon className={`w-4 h-4 ${getEntryColor(entry.type)}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getActionBadgeVariant(entry.type, entry.side)} className="text-xs">
                        {actionLabel}
                      </Badge>
                      <span className="font-medium">{entry.asset}</span>
                      {entry.isShared && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-accent" />
                          <span className="text-xs text-accent">Shared</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {entry.sharer_profile && (
                        <>
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={entry.sharer_profile.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {entry.sharer_profile.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{entry.sharer_profile.username}</span>
                          <span className="mx-1">•</span>
                        </>
                      )}
                      <span>
                        {entry.quantity ? `${entry.quantity} • ` : ''}
                        {entry.platform_id ? getPlatformName(entry.platform_id) : 'Manual Entry'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatEntryValue(entry)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}