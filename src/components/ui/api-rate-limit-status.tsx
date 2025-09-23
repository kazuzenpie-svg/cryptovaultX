import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApiRateLimitStatusProps {
  lastApiCall: Date | null;
  canMakeApiCall: boolean;
  getTimeUntilNextCall: () => number;
  className?: string;
}

export function ApiRateLimitStatus({ 
  lastApiCall, 
  canMakeApiCall, 
  getTimeUntilNextCall,
  className = "" 
}: ApiRateLimitStatusProps) {
  if (!lastApiCall) return null;

  const timeLeft = getTimeUntilNextCall();
  const minutesLeft = Math.ceil(timeLeft / (1000 * 60));

  return (
    <Alert className={`${className} ${canMakeApiCall ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
      {canMakeApiCall ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <Clock className="h-4 w-4 text-amber-600" />
      )}
      <AlertDescription className={canMakeApiCall ? 'text-green-800' : 'text-amber-800'}>
        {canMakeApiCall ? (
          <>
            <strong>API Ready:</strong> Can fetch fresh price data now. 
            Last update: {formatDistanceToNow(lastApiCall, { addSuffix: true })}
          </>
        ) : (
          <>
            <strong>Rate Limited:</strong> Next price update available in {minutesLeft} minutes 
            to respect API limits (1 call per hour).
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}