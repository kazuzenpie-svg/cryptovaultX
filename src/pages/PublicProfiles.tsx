import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/navigation/Navbar';
import { ShareDataDialog } from '@/components/sharing/ShareDataDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, Search, Share2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

// Custom type for the subset of profile data we fetch for public profiles
type PublicProfileData = {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  bio: string | null;
  privacy_sharing: 'public' | 'connections_only' | 'private';
};

export default function PublicProfiles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<PublicProfileData[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<PublicProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicProfiles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProfiles(profiles);
    } else {
      const filtered = profiles.filter(profile =>
        profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProfiles(filtered);
    }
  }, [searchQuery, profiles]);

  const fetchPublicProfiles = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, created_at, bio, privacy_sharing')
        .eq('privacy_sharing', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter out current user if logged in
      const filteredData = (data || []).filter(profile => profile.id !== user?.id) as PublicProfileData[];
      setProfiles(filteredData);
      setFilteredProfiles(filteredData);
    } catch (error: any) {
      console.error('Error fetching public profiles:', error);
      toast({
        title: "Error loading profiles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyUserIdToClipboard = async (userId: string, username: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedId(userId);
      toast({
        title: "User ID Copied! 📋",
        description: `${username}'s ID copied to clipboard.`,
        className: "bg-green-50 text-green-900 border-green-200",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy user ID to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 pb-20 md:pb-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Public Profiles
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover and connect with other traders. Copy their User ID to send sharing requests and access their trading data.
              Or visit the <a href="/sharing" className="text-primary hover:underline font-medium">Sharing page</a> for enhanced discovery features.
            </p>
          </div>

          {/* Search Bar */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                  id="search-profiles"
                  name="search"
                  placeholder="Search by username or bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardContent className="p-6 text-center space-y-3">
                <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{profiles.length} Public Users</h3>
                  <p className="text-sm text-muted-foreground">Available for data sharing</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6 text-center space-y-3">
                <div className="p-3 rounded-full bg-success/10 w-fit mx-auto">
                  <Search className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">{filteredProfiles.length} Results</h3>
                  <p className="text-sm text-muted-foreground">Matching your search</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6 text-center space-y-3">
                <div className="p-3 rounded-full bg-info/10 w-fit mx-auto">
                  <Share2 className="w-6 h-6 text-info" />
                </div>
                <div>
                  <h3 className="font-semibold">Easy Sharing</h3>
                  <p className="text-sm text-muted-foreground">Copy ID to share data</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profiles Grid */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Public Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading public profiles...</p>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-medium text-lg">
                      {searchQuery ? 'No profiles found' : 'No public profiles yet'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'Try adjusting your search terms' 
                        : 'Be the first to make your profile public!'
                      }
                    </p>
                  </div>
                  {searchQuery && (
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredProfiles.map((profile) => (
                    <Card key={profile.id} className="glass-card border-2 hover:border-primary/30 transition-colors">
                      <CardContent className="p-6 space-y-4">
                        {/* Profile Header */}
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {profile.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">
                              {profile.username}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                            </p>
                            <Badge variant="secondary" className="mt-1">
                              <Users className="w-3 h-3 mr-1" />
                              Public
                            </Badge>
                          </div>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                          <div>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {profile.bio}
                            </p>
                          </div>
                        )}

                        {/* User ID */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">User ID:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-muted p-2 rounded font-mono truncate">
                              {profile.id}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyUserIdToClipboard(profile.id, profile.username)}
                              className="shrink-0"
                            >
                              {copiedId === profile.id ? (
                                <Check className="w-4 h-4 text-success" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Action Button */}
                        <ShareDataDialog>
                          <Button className="w-full" size="sm">
                            <Share2 className="w-4 h-4 mr-2" />
                            Request Data Sharing
                          </Button>
                        </ShareDataDialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}