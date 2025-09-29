import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navigation/Navbar';
import { Settings, Shield, Bell, Palette, User, Database, Trash2, AlertTriangle, Key } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { supabase } from '@/integrations/supabase/client';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfiles();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { prefs, loading: prefsLoading, error: prefsError, save: savePrefs } = useUserPreferences();
  const [notifications, setNotifications] = useState<boolean>(() => {
    const saved = localStorage.getItem('cryptovault_notifications');
    return saved ? JSON.parse(saved) : (prefs.notifications ?? true);
  });
  const [compactMode, setCompactMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('cryptovault_compact_mode');
    return saved ? JSON.parse(saved) : (prefs.compact_mode ?? false);
  });
  const [animations, setAnimations] = useState<boolean>(() => {
    const saved = localStorage.getItem('cryptovault_animations');
    return saved ? JSON.parse(saved) : (prefs.animations ?? true);
  });
  const [mounted, setMounted] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(prefs.email_notifications ?? true);
  const [priceAlerts, setPriceAlerts] = useState<boolean>(prefs.price_alerts ?? false);
  const [sharingNotifications, setSharingNotifications] = useState<boolean>(prefs.sharing_notifications ?? true);
  // Binance credentials UI state
  const [binanceApiKey, setBinanceApiKey] = useState('');
  const [binanceApiSecret, setBinanceApiSecret] = useState('');
  const [binanceHasCreds, setBinanceHasCreds] = useState<boolean | null>(null);
  const [binanceUpdatedAt, setBinanceUpdatedAt] = useState<string | null>(null);
  const [binanceSaving, setBinanceSaving] = useState(false);
  const [binanceStatusError, setBinanceStatusError] = useState<string | null>(null);
  const [debugRows, setDebugRows] = useState<any[] | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugErr, setDebugErr] = useState<string | null>(null);

  // Password confirmation dialog state
  const [pwdAction, setPwdAction] = useState<null | 'save' | 'delete'>(null);
  const [pwd, setPwd] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Save preferences when they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cryptovault_notifications', JSON.stringify(notifications));
      localStorage.setItem('cryptovault_compact_mode', JSON.stringify(compactMode));
      localStorage.setItem('cryptovault_animations', JSON.stringify(animations));
    }
  }, [notifications, compactMode, animations, mounted]);

  // Helper: refresh storage status for Binance credentials
  const refreshBinanceStatus = async () => {
    setBinanceStatusError(null);
    try {
      // Prefer RPC if present
      const rpc = await supabase.rpc('get_binance_credentials_status');
      if (rpc.error) {
        console.error('get_binance_credentials_status RPC error:', rpc.error);
      }
      if (!rpc.error && rpc.data) {
        setBinanceHasCreds(!!rpc.data.has_credentials);
        setBinanceUpdatedAt(rpc.data.updated_at ?? null);
        console.debug('RPC status payload:', rpc.data);
        return;
      }
    } catch (e: any) {
      console.error('RPC refreshBinanceStatus exception:', e);
      setBinanceStatusError(e?.message || 'RPC call failed');
    }
    // Fallback: direct table check (requires RLS for current user)
    try {
      const { data, error } = await (supabase as any)
        .from('binance_credentials')
        .select('updated_at')
        .eq('user_id', user?.id ?? '')
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('Fallback select error:', error);
        setBinanceStatusError(error.message);
      }
      if (!error && data) {
        setBinanceHasCreds(true);
        setBinanceUpdatedAt(data.updated_at ?? null);
        console.debug('Fallback status payload:', data);
      } else {
        setBinanceHasCreds(false);
        setBinanceUpdatedAt(null);
      }
    } catch (e: any) {
      console.error('Fallback select exception:', e);
      setBinanceHasCreds(null);
      setBinanceUpdatedAt(null);
      setBinanceStatusError(e?.message || 'Status query failed');
    }
  };

  // Debug: list current user's stored API rows (never shows secrets)
  const listMyApis = async () => {
    if (!user?.id) return;
    setDebugLoading(true);
    setDebugErr(null);
    try {
      const { data, error } = await (supabase as any)
        .from('binance_credentials')
        .select('id, user_id, updated_at, created_at, api_key')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setDebugRows(data || []);
    } catch (e: any) {
      console.error('Debug listMyApis error:', e);
      setDebugErr(e?.message || 'Query failed');
      setDebugRows(null);
    } finally {
      setDebugLoading(false);
    }
  };

  // Load Binance creds status when user context is ready/changes
  useEffect(() => {
    if (user?.id) refreshBinanceStatus();
  }, [user?.id]);

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

  // Internal implementations (called after password confirmation)
  const doSaveBinanceCreds = async () => {
    if (!binanceApiKey.trim() || !binanceApiSecret.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Enter both API Key and Secret.',
        className: 'bg-destructive text-destructive-foreground',
        variant: 'destructive',
      });
      return;
    }
    setBinanceSaving(true);
    try {
      const { error } = await supabase.rpc('set_binance_credentials', {
        p_api_key: binanceApiKey.trim(),
        p_api_secret: binanceApiSecret.trim(),
      });
      if (error) {
        console.error('set_binance_credentials RPC error:', error);
        throw error;
      }
      // Optimistic UI: immediately reflect connected state
      setBinanceHasCreds(true);
      setBinanceUpdatedAt(new Date().toISOString());
      await refreshBinanceStatus();
      // Clear sensitive inputs after successful save
      setBinanceApiKey('');
      setBinanceApiSecret('');
      toast({
        title: 'Binance credentials saved',
        description: 'Stored securely with RLS and encryption.',
        className: 'bg-success text-success-foreground',
      });
    } catch (e: any) {
      console.error('Save credentials exception:', e);
      toast({
        title: 'Save failed',
        description: e?.message || 'Could not save credentials.',
        className: 'bg-destructive text-destructive-foreground',
        variant: 'destructive',
      });
    } finally {
      setBinanceSaving(false);
    }
  };

  const doDeleteBinanceCreds = async () => {
    setBinanceSaving(true);
    try {
      const { error } = await supabase.rpc('delete_binance_credentials');
      if (error) {
        console.error('delete_binance_credentials RPC error:', error);
        throw error;
      }
      await refreshBinanceStatus();
      setBinanceApiKey('');
      setBinanceApiSecret('');
      toast({
        title: 'Binance credentials removed',
        description: 'You can add them again anytime.',
        className: 'bg-success text-success-foreground',
      });
    } catch (e: any) {
      console.error('Delete credentials exception:', e);
      toast({
        title: 'Remove failed',
        description: e?.message || 'Could not remove credentials.',
        className: 'bg-destructive text-destructive-foreground',
        variant: 'destructive',
      });
    } finally {
      setBinanceSaving(false);
    }
  };

  // Public handlers now show password dialog
  const handleSaveBinanceCreds = () => setPwdAction('save');
  const handleDeleteBinanceCreds = () => setPwdAction('delete');

  const closePwdDialog = () => {
    setPwdAction(null);
    setPwd('');
    setPwdBusy(false);
    setPwdError(null);
  };

  const confirmPwd = async () => {
    if (!user?.email) {
      setPwdError('Not authenticated.');
      return;
    }
    if (!pwd) {
      setPwdError('Enter your password.');
      return;
    }
    setPwdBusy(true);
    setPwdError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: pwd });
      if (error) throw error;
      closePwdDialog();
      if (pwdAction === 'save') await doSaveBinanceCreds();
      if (pwdAction === 'delete') await doDeleteBinanceCreds();
    } catch (e: any) {
      setPwdError(e?.message || 'Authentication failed.');
    } finally {
      setPwdBusy(false);
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
                    {binanceHasCreds === null && (
                      <Badge variant="outline" className="ml-2">Checking…</Badge>
                    )}
                    {binanceHasCreds === true && (
                      <Badge className="ml-2 bg-green-600 text-white">Connected</Badge>
                    )}
                    {binanceHasCreds === false && (
                      <Badge variant="secondary" className="ml-2">Not set</Badge>
                    )}
                    {binanceSaving && (
                      <Badge variant="outline" className="ml-2">Saving…</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {binanceHasCreds && (
                    <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                      <Key className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        Binance API connected. Buttons switched to Update/Remove. Secrets are hidden by design.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <Key className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>Secure Storage:</strong> Your API keys are encrypted and stored securely in Supabase with Row Level Security. 
                      They are only accessible by you and used for fetching real-time price data.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {/* Binance Credentials */}
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Binance API Credentials</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Stored encrypted in Supabase; only you can access them. Secrets are never returned to the client.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <input
                            type="password"
                            className="px-3 py-2 bg-background/60 border border-border rounded-md iPhone-input"
                            placeholder="API Key"
                            value={binanceApiKey}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBinanceApiKey(e.target.value)}
                            autoComplete="off"
                          />
                          <input
                            type="password"
                            className="px-3 py-2 bg-background/60 border border-border rounded-md iPhone-input"
                            placeholder="Secret Key"
                            value={binanceApiSecret}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBinanceApiSecret(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {binanceHasCreds ? (
                            <>
                              <Button onClick={handleSaveBinanceCreds} disabled={binanceSaving} size="sm">Update</Button>
                              <Button onClick={handleDeleteBinanceCreds} disabled={binanceSaving} size="sm" variant="outline">Remove</Button>
                              <Badge className="bg-green-600 text-white">Connected</Badge>
                            </>
                          ) : (
                            <Button onClick={handleSaveBinanceCreds} disabled={binanceSaving} size="sm">Save</Button>
                          )}
                          {binanceHasCreds !== null && (
                            <span className="text-xs text-muted-foreground flex items-center gap-2">
                              {binanceHasCreds ? `Stored${binanceUpdatedAt ? ` • updated ${new Date(binanceUpdatedAt).toLocaleString()}` : ''}` : 'Not set'}
                              <button type="button" className="underline text-xs" onClick={refreshBinanceStatus}>Refresh</button>
                            </span>
                          )}
                          {binanceStatusError && (
                            <span className="text-xs text-destructive">{binanceStatusError}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          For security, stored keys are not shown. Enter new values to update. Tip: use a read‑only Binance API key and restrict IPs.
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
      {/* Password Confirmation Dialog */}
      <Dialog open={pwdAction !== null} onOpenChange={(open) => { if (!open) closePwdDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
            <DialogDescription>
              Enter your account password to confirm this API key action.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="confirm-password" className="text-sm">Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
            {pwdError && <p className="text-xs text-destructive mt-1">{pwdError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePwdDialog} disabled={pwdBusy}>Cancel</Button>
            <Button onClick={confirmPwd} disabled={pwdBusy}>
              {pwdBusy ? 'Verifying…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}