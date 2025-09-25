import React, { useState } from 'react';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLoading } from '@/components/LoadingSpinner';
import { Navbar } from '@/components/navigation/Navbar';
import { 
  User, 
  Mail, 
  Calendar,
  Shield,
  Globe,
  Users,
  Lock,
  Edit,
  Save,
  X
} from 'lucide-react';
import { format } from 'date-fns';

const tradingFocusOptions = [
  'Spot Trading',
  'Futures Trading',
  'DeFi',
  'NFTs',
  'Staking',
  'Yield Farming',
  'Day Trading',
  'Swing Trading',
  'Long-term Holding',
  'Arbitrage'
];

export default function Profile() {
  const { user } = useAuth();
  const { profile, loading, createProfile, updateProfile } = useProfiles();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    trading_focus: [] as string[],
    privacy_sharing: 'connections_only' as 'public' | 'connections_only' | 'private',
    preferred_currency: 'USD' as 'USD' | 'PHP'
  });

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        bio: profile.bio || '',
        trading_focus: profile.trading_focus || [],
        privacy_sharing: profile.privacy_sharing || 'connections_only',
        preferred_currency: profile.preferred_currency || 'USD'
      });
    }
  }, [profile]);

  if (loading) {
    return (
      <>
        <Navbar />
        <PageLoading text="Loading profile..." />
      </>
    );
  }

  const handleSave = async () => {
    if (!profile) {
      // Create new profile
      const { error } = await createProfile(formData);
      if (!error) {
        setIsEditing(false);
      }
    } else {
      // Update existing profile
      const { error } = await updateProfile(formData);
      if (!error) {
        setIsEditing(false);
      }
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        bio: profile.bio || '',
        trading_focus: profile.trading_focus || [],
        privacy_sharing: profile.privacy_sharing || 'connections_only',
        preferred_currency: profile.preferred_currency || 'USD'
      });
    }
    setIsEditing(false);
  };

  const toggleTradingFocus = (focus: string) => {
    setFormData(prev => ({
      ...prev,
      trading_focus: prev.trading_focus.includes(focus)
        ? prev.trading_focus.filter(f => f !== focus)
        : [...prev.trading_focus, focus]
    }));
  };

  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'public': return Globe;
      case 'connections_only': return Users;
      case 'private': return Lock;
      default: return Shield;
    }
  };

  const getPrivacyColor = (level: string) => {
    switch (level) {
      case 'public': return 'text-blue-500';
      case 'connections_only': return 'text-green-500';
      case 'private': return 'text-orange-500';
      default: return 'text-muted-foreground';
    }
  };

  // Show profile setup if no profile exists
  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen p-4 md:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <Card className="glass-card fade-in">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
                <p className="text-muted-foreground">
                  Set up your CryptoVault profile to get started
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about your trading journey..."
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trading Focus</Label>
                  <div className="flex flex-wrap gap-2">
                    {tradingFocusOptions.map((focus) => (
                      <Badge
                        key={focus}
                        variant={formData.trading_focus.includes(focus) ? "default" : "outline"}
                        className="cursor-pointer hover-scale"
                        onClick={() => toggleTradingFocus(focus)}
                      >
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Privacy Level</Label>
                    <Select 
                      value={formData.privacy_sharing} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, privacy_sharing: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="connections_only">Connections Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Currency</Label>
                    <Select 
                      value={formData.preferred_currency} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, preferred_currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="PHP">PHP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleSave} 
                  className="w-full hover-scale"
                  disabled={!formData.username.trim()}
                >
                  Create Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Profile
                </h1>
              </div>
              <p className="text-muted-foreground">
                Manage your personal information and preferences
              </p>
            </div>
            
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} className="hover-scale">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* Profile Card */}
          <Card className="glass-card fade-in">
            <CardHeader>
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="" alt="Profile" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold">{profile.username}</h2>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {user?.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Bio */}
              <div className="space-y-2">
                <Label>Bio</Label>
                {isEditing ? (
                  <Textarea
                    placeholder="Tell us about your trading journey..."
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {profile.bio || 'No bio provided yet.'}
                  </p>
                )}
              </div>

              {/* Trading Focus */}
              <div className="space-y-2">
                <Label>Trading Focus</Label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {tradingFocusOptions.map((focus) => (
                      <Badge
                        key={focus}
                        variant={formData.trading_focus.includes(focus) ? "default" : "outline"}
                        className="cursor-pointer hover-scale"
                        onClick={() => toggleTradingFocus(focus)}
                      >
                        {focus}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.trading_focus?.length ? (
                      profile.trading_focus.map((focus) => (
                        <Badge key={focus} variant="outline">
                          {focus}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No trading focus set.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Privacy Level</Label>
                  {isEditing ? (
                    <Select 
                      value={formData.privacy_sharing} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, privacy_sharing: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="connections_only">Connections Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = getPrivacyIcon(profile.privacy_sharing);
                        return <Icon className={`w-4 h-4 ${getPrivacyColor(profile.privacy_sharing)}`} />;
                      })()}
                      <span className="capitalize">{profile.privacy_sharing.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Preferred Currency</Label>
                  {isEditing ? (
                    <Select 
                      value={formData.preferred_currency} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, preferred_currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="PHP">PHP</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{profile.preferred_currency}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} className="flex-1 hover-scale">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}