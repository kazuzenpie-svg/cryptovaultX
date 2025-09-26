import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Navbar } from '@/components/navigation/Navbar';
import { Settings, Shield, Bell, Palette, User, Database, Trash2, AlertTriangle, Key } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfiles();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { prefs, loading: prefsLoading, error: prefsError, save: savePrefs } = useUserPreferences();
  const [tokenMetricsKey, setTokenMetricsKey] = useState<string>('');
  const [notifications, setNotifications] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(false);
  const [sharingNotifications, setSharingNotifications] = useState(true);

  useEffect(() => {
    setTokenMetricsKey(prefs.tokenmetrics_api_key ?? '');
  }, [prefs.tokenmetrics_api_key]);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Load saved preferences
    const savedNotifications = localStorage.getItem('cryptovault_notifications');
    const savedCompactMode = localStorage.getItem('cryptovault_compact_mode');
    const savedAnimations = localStorage.getItem('cryptovault_animations');
    
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    if (savedCompactMode) setCompactMode(JSON.parse(savedCompactMode));
    if (savedAnimations) setAnimations(JSON.parse(savedAnimations));
  }, []);

  // Save preferences when they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cryptovault_notifications', JSON.stringify(notifications));
      localStorage.setItem('cryptovault_compact_mode', JSON.stringify(compactMode));
      localStorage.setItem('cryptovault_animations', JSON.stringify(animations));
    }
  }, [notifications, compactMode, animations, mounted]);

  const clearCache = () => {
    if (window.confirm('This will clear all cached data and reload the app. Continue?')) {
      localStorage.clear();
      sessionStorage.clear();
      toast({
        title: "Cache cleared! 🧹",
        description: "All cached data has been removed.",
        className: "bg-success text-success-foreground",
      });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handlePrivacyUpdate = async (privacy: 'public' | 'connections_only' | 'private') => {
    if (!profile) return;
    
    const { error } = await updateProfile({ privacy_sharing: privacy });
    if (!error) {
      toast({
        title: "Privacy updated! 🔒",
        description: `Your profile is now ${privacy.replace('_', ' ')}.`,
        className: "bg-success text-success-foreground",
      });
    }
  };

  const handleCurrencyUpdate = async (currency: 'USD' | 'PHP') => {
    if (!profile) return;
    
    const { error } = await updateProfile({ preferred_currency: currency });
    if (!error) {
      toast({
        title: "Currency updated! 💱",
        description: `Preferred currency set to ${currency}.`,
        className: "bg-success text-success-foreground",
      });
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  const handleSaveTokenMetricsKey = async () => {
    try {
      await savePrefs({ tokenmetrics_api_key: tokenMetricsKey.trim() || null });
      toast({
        title: "API Key Saved! 🔐",
        description: "Your TokenMetrics API key has been securely stored.",
        className: "bg-success text-success-foreground",
      });
    } catch (error) {
      toast({
        title: "Save Failed! ❌",
        description: "Failed to save your API key. Please try again.",
        className: "bg-destructive text-destructive-foreground",
        variant: "destructive",
      });
    }
  };

  // Load TokenMetrics API key when prefs change
  useEffect(() => {
    setTokenMetricsKey(prefs.tokenmetrics_api_key ?? '');
  }, [prefs.tokenmetrics_api_key]);

  // Don't render theme controls until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <div className="text-center space-y-3 sm:space-y-4 fade-in">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Settings
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
                Loading settings...
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Header - Mobile optimized */}
          <div className="text-center space-y-3 sm:space-y-4 fade-in">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Settings
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Customize your CryptoVault experience and manage your account preferences.
            </p>
          </div>

          {/* Settings Tabs - Mobile responsive */}
          <Tabs defaultValue="notifications" className="space-y-4 sm:space-y-6 fade-in" style={{ animationDelay: '0.1s' }}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 glass-card h-auto">
              <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Appearance</span>
                <span className="sm:hidden">Theme</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Account</span>
                <span className="sm:hidden">Account</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Privacy</span>
                <span className="sm:hidden">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="api" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">API Keys</span>
                <span className="sm:hidden">API</span>
              </TabsTrigger>
            </TabsList>



            <TabsContent value="notifications" className="fade-in" style={{ animationDelay: '0.2s' }}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Bell className="w-5 h-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Push Notifications</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Receive notifications about trading updates
                          </p>
                        </div>
                        <Switch
                          checked={notifications}
                          onCheckedChange={setNotifications}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Email Notifications</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Receive email updates about sharing requests
                          </p>
                        </div>
                        <Switch
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Price Alerts</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Get notified about significant price changes
                          </p>
                        </div>
                        <Switch
                          checked={priceAlerts}
                          onCheckedChange={setPriceAlerts}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Sharing Notifications</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Notifications for sharing requests and updates
                          </p>
                        </div>
                        <Switch
                          checked={sharingNotifications}
                          onCheckedChange={setSharingNotifications}
                        />
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="fade-in" style={{ animationDelay: '0.2s' }}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Palette className="w-5 h-5 text-primary" />
                    Appearance & Display
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Theme</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Choose your preferred color scheme
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-3 h-3 rounded-full bg-background border-2 border-foreground/20"></div>
                            <span className="text-xs text-muted-foreground">
                              Current: {theme === 'system' ? 'System Default' : theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                            </span>
                          </div>
                        </div>
                        <Select value={theme} onValueChange={setTheme}>
                          <SelectTrigger className="w-32 sm:w-48 iPhone-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">☀️ Light</SelectItem>
                            <SelectItem value="dark">🌙 Dark</SelectItem>
                            <SelectItem value="system">📱 System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Smooth Animations</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enable smooth transitions and hover effects
                          </p>
                        </div>
                        <Switch 
                          checked={animations}
                          onCheckedChange={setAnimations}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Compact Mode</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Show more content in less space
                          </p>
                        </div>
                        <Switch 
                          checked={compactMode}
                          onCheckedChange={setCompactMode}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="fade-in" style={{ animationDelay: '0.2s' }}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <User className="w-5 h-5 text-primary" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Account Info */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Email Address</Label>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Username</Label>
                        <p className="text-sm text-muted-foreground">{profile?.username || 'Not set'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Privacy Level</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Control who can see your profile
                          </p>
                        </div>
                        <Select 
                          value={profile?.privacy_sharing || 'connections_only'} 
                          onValueChange={handlePrivacyUpdate}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="connections_only">Connections Only</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">Preferred Currency</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Default currency for calculations
                          </p>
                        </div>
                        <Select 
                          value={profile?.preferred_currency || 'USD'} 
                          onValueChange={handleCurrencyUpdate}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="PHP">PHP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        Danger Zone
                      </h4>
                      
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className="text-sm font-medium text-destructive">Sign Out</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Sign out of your account
                            </p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={handleSignOut}
                          >
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="fade-in" style={{ animationDelay: '0.2s' }}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Shield className="w-5 h-5 text-primary" />
                    Privacy & Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Data Usage Info */}
                  <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <Database className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>Data Storage:</strong> Your trading data is securely stored in Supabase with end-to-end encryption. 
                      Only you and users you explicitly grant access can view your data.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Clear Cache</Label>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">
                          Clear stored cache and temporary data
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover-scale"
                          onClick={clearCache}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear Cache
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">App Version</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          CryptoVault v3.1.0 - Production MVP
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Built with React 18, TypeScript, and Supabase
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="fade-in" style={{ animationDelay: '0.2s' }}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Key className="w-5 h-5 text-primary" />
                    API Key Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <Key className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>Secure Storage:</strong> Your API keys are encrypted and stored securely in Supabase with Row Level Security. 
                      They are only accessible by you and used for fetching real-time price data.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">TokenMetrics API Key</Label>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">
                          Used for fetching real-time cryptocurrency prices
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            className="flex-1 px-3 py-2 bg-background/60 border border-border rounded-md iPhone-input"
                            placeholder="tm-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            value={tokenMetricsKey}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenMetricsKey(e.target.value)}
                          />
                          <Button 
                            onClick={handleSaveTokenMetricsKey}
                            disabled={prefsLoading}
                            size="sm"
                          >
                            Save
                          </Button>
                        </div>
                        {prefsError && (
                          <p className="text-xs text-destructive mt-2">{prefsError}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Note: TokenMetrics plans have monthly limits. Keys are stored per-user with Row Level Security.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

        </div>
      </div>
    </>
  );
}