import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Shield,
  Info
} from 'lucide-react';

export function ApiKeySetup() {
  const { prefs, loading, error, save } = useUserPreferences();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize with current API key
  useState(() => {
    if (prefs.tokenmetrics_api_key) {
      setApiKey(prefs.tokenmetrics_api_key);
    }
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      await save({ tokenmetrics_api_key: apiKey.trim() || null });
      
      toast({
        title: "API Key Saved! 🔐",
        description: "Your TokenMetrics API key has been securely stored.",
        className: "bg-success text-success-foreground",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      setSaving(true);
      setApiKey('');
      await save({ tokenmetrics_api_key: null });
      
      toast({
        title: "API Key Cleared",
        description: "TokenMetrics integration has been disabled.",
        className: "bg-warning text-warning-foreground",
      });
    } catch (error: any) {
      toast({
        title: "Clear Failed",
        description: error.message || "Failed to clear API key",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isValidApiKey = (key: string): boolean => {
    return key.trim().startsWith('tm-') && key.length > 20;
  };

  const hasChanges = apiKey !== (prefs.tokenmetrics_api_key || '');

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          TokenMetrics API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Information Alert */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <div className="space-y-2">
              <p><strong>TokenMetrics API Integration:</strong></p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>Provides real-time cryptocurrency prices and market data</li>
                <li>Rate limited to 100 calls per hour (30 second intervals)</li>
                <li>Data is cached for 3 hours to minimize API usage</li>
                <li>API keys are encrypted and stored securely with Row Level Security</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* API Key Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">TokenMetrics API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="tm-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="pr-10 font-mono"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            
            {/* Validation feedback */}
            {apiKey && (
              <div className="flex items-center gap-2">
                {isValidApiKey(apiKey) ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm text-success">Valid API key format</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-sm text-warning">Invalid API key format</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              disabled={saving || loading || !hasChanges}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save API Key'}
            </Button>
            
            {prefs.tokenmetrics_api_key && (
              <Button 
                onClick={handleClear}
                disabled={saving || loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                Clear Key
              </Button>
            )}
          </div>

          {error && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Getting Started */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Getting Started</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="font-medium text-primary">1.</span>
              <div>
                <span>Visit </span>
                <a 
                  href="https://tokenmetrics.com/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  TokenMetrics API
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span> to get your API key</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-primary">2.</span>
              <span>Copy your API key (starts with "tm-")</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-primary">3.</span>
              <span>Paste it above and click "Save API Key"</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-primary">4.</span>
              <span>Start fetching real-time crypto prices!</span>
            </div>
          </div>
        </div>

        {/* Current Status */}
        {prefs.tokenmetrics_api_key && (
          <div className="p-4 rounded-lg bg-muted/30 border">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" />
              Integration Status
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">API Calls Remaining:</span>
                <div className="font-semibold">{rateLimitInfo.callsRemaining}/100</div>
              </div>
              <div>
                <span className="text-muted-foreground">Cache Status:</span>
                <div className="font-semibold">{cacheStats.priceCount} prices cached</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}