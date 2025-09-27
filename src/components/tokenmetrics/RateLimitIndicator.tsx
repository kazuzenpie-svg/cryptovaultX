import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTokenMetricsApi } from '@/hooks/useTokenMetricsApi';
import { Clock, Zap, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react';

interface RateLimitIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function RateLimitIndicator({ className = "", showDetails = false }: RateLimitIndicatorProps) {
  const { rateLimitInfo, cacheStats } = useTokenMetricsApi();

  const getStatusColor = () => {
    if (rateLimitInfo.callsRemaining === 0) return 'text-destructive';
    if (rateLimitInfo.callsRemaining < 10) return 'text-warning';
    return 'text-success';
  };

  const getStatusIcon = () => {
    if (rateLimitInfo.callsRemaining === 0) return AlertTriangle;
    if (rateLimitInfo.callsRemaining < 10) return Clock;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StatusIcon className={`w-4 h-4 ${getStatusColor()}`} />
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {rateLimitInfo.callsRemaining} calls left
        </span>
        {rateLimitInfo.timeUntilNext > 0 && (
          <Badge variant="outline" className="text-xs">
            {Math.ceil(rateLimitInfo.timeUntilNext / 1000)}s
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={`glass-card ${className}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${getStatusColor()}`} />
            <h3 className="font-medium">API Rate Limit</h3>
          </div>
          <Badge variant={rateLimitInfo.canMakeCall ? 'default' : 'destructive'}>
            {rateLimitInfo.canMakeCall ? 'Ready' : 'Limited'}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">API Calls Remaining</span>
              <span className="font-semibold">{rateLimitInfo.callsRemaining}/100</span>
            </div>
            <Progress 
              value={(rateLimitInfo.callsRemaining / 100) * 100} 
              className="h-2"
            />
          </div>

          {rateLimitInfo.timeUntilNext > 0 && (
            <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-sm text-warning">
                Next call available in {Math.ceil(rateLimitInfo.timeUntilNext / 1000)} seconds
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Reset Time:</span>
              <div className="font-medium">
                {rateLimitInfo.resetTime.toLocaleTimeString()}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Cached Prices:</span>
              <div className="font-medium">{cacheStats.priceCount}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}