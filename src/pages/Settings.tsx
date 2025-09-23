import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/navigation/Navbar';
import { Settings, Shield, Bell, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const clearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
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
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 glass-card h-auto">
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
              <TabsTrigger value="privacy" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Privacy</span>
                <span className="sm:hidden">Privacy</span>
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

            <TabsContent value="privacy" className="fade-in" style={{ animationDelay: '0.2s' }}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Shield className="w-5 h-5 text-primary" />
                    Privacy & Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                          🗑️ Clear Cache
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">App Version</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          CryptoVault v1.0.0 - Demo Version
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