import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function DemoDataNotice() {
  return (
    <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 mb-4">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        <strong>Demo Mode:</strong> Using sample cryptocurrency data due to API restrictions. 
        In production, this would connect to live price feeds.
      </AlertDescription>
    </Alert>
  );
}