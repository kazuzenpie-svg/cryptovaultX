import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccessGrants } from '@/hooks/useAccessGrants';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Clock, Filter, Calendar, CheckCircle, AlertCircle, XCircle, Users, Search, Copy, Check, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const shareSchema = z.object({
  viewer_id: z.string().min(1, 'Please enter a user ID'),
  shared_types: z.array(z.enum(['spot', 'futures', 'wallet', 'dual_investment', 'liquidity_mining', 'liquidity_pool', 'other'])).min(1, 'Select at least one entry type'),
  expires_at: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  min_pnl: z.number().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof shareSchema>;

// Custom type for the subset of profile data we fetch for public profiles
type PublicProfileData = {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  bio: string | null;
  privacy_sharing: 'public' | 'connections_only' | 'private';
};

const entryTypes = [
  { value: 'spot', label: 'Spot Trading' },
  { value: 'futures', label: 'Futures Trading' },
  { value: 'wallet', label: 'Wallet Transfer' },
  { value: 'dual_investment', label: 'Dual Investment' },
  { value: 'liquidity_mining', label: 'Liquidity Mining' },
  { value: 'liquidity_pool', label: 'Liquidity Pool' },
  { value: 'other', label: 'Other' },
];

interface ShareDataDialogProps {
  children: React.ReactNode;
}

export function ShareDataDialog({ children }: ShareDataDialogProps) {
  const { user } = useAuth();
  const { requestAccess, loading } = useAccessGrants();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [requestResult, setRequestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [pendingData, setPendingData] = useState<any>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [hasDateFilter, setHasDateFilter] = useState(false);
  const [hasPnlFilter, setHasPnlFilter] = useState(false);
  
  // Discovery state
  const [profiles, setProfiles] = useState<PublicProfileData[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<PublicProfileData[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'discover'>('manual');

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset, clearErrors } = useForm<FormData>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      shared_types: [],
    }
  });

  // Sync selectedTypes with form field
  useEffect(() => {
    setValue('shared_types', selectedTypes as any);
    // Force validation after setting value
    if (selectedTypes.length > 0) {
      // Clear any existing errors for shared_types
      clearErrors('shared_types');
    }
  }, [selectedTypes, setValue, clearErrors]);

  // Load public profiles when discovery tab is opened
  useEffect(() => {
    if (activeTab === 'discover' && open) {
      fetchPublicProfiles();
    }
  }, [activeTab, open]);

  // Filter profiles based on search query
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
      setDiscoveryLoading(true);
      
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
      setDiscoveryLoading(false);
    }
  };

  const copyUserIdToClipboard = async (userId: string, displayName: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedId(userId);
      toast({
        title: "User ID Copied! 📋",
        description: `${displayName}'s user ID copied to clipboard.`,
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

  const selectUserFromDiscovery = (userId: string, username: string) => {
    // Set the viewer user ID in the form
    setValue('viewer_id', userId);
    
    // Auto-select common entry types if none are selected
    if (selectedTypes.length === 0) {
      const defaultTypes = ['spot', 'futures', 'wallet'];
      setSelectedTypes(defaultTypes);
      
      // Show informative toast about auto-selection
      toast({
        title: "User Selected! ✅",
        description: `${username} selected. Default entry types (Spot, Futures, Wallet) have been pre-selected. You can modify these before sending.`,
        className: "bg-blue-50 text-blue-900 border-blue-200",
        duration: 5000,
      });
    } else {
      toast({
        title: "User Selected! ✅",
        description: `${username} selected. Review and modify sharing settings below, then send request.`,
        className: "bg-blue-50 text-blue-900 border-blue-200",
      });
    }
    
    // Switch to manual tab for configuration
    setActiveTab('manual');
  };

  const onSubmit = async (data: FormData) => {
    // Comprehensive validation with better user feedback
    if (selectedTypes.length === 0) {
      toast({
        title: "Select Entry Types",
        description: "Please select at least one type of trading data to share. Popular choices: Spot Trading, Futures Trading, and Wallet Transfers.",
        variant: "destructive",
        duration: 6000,
      });
      return;
    }

    // Validate viewer user ID with better messaging
    const viewerId = data.viewer_id?.trim();
    
    if (!viewerId) {
      toast({
        title: "Enter User ID",
        description: "Please enter a valid user ID or use the 'Discover Users' tab to find and select a user.",
        variant: "destructive",
        duration: 6000,
      });
      return;
    }

    // Additional validation for UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(viewerId)) {
      toast({
        title: "Invalid User ID Format",
        description: "Please enter a valid UUID format user ID (e.g., 12345678-1234-1234-1234-123456789012).",
        variant: "destructive",
        duration: 6000,
      });
      return;
    }
    
    const shareData = {
      viewer_id: viewerId,
      shared_types: selectedTypes as any[],
      expires_at: data.expires_at,
      date_from: data.date_from,
      date_to: data.date_to,
      min_pnl: data.min_pnl,
      message: data.message,
    };
    
    // Store data and show confirmation dialog
    setPendingData(shareData);
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    if (!pendingData) {
      return;
    }

    try {
      const { error, data } = await requestAccess(pendingData);
      
      // Close confirmation dialog first
      setShowConfirmDialog(false);
      
      if (!error) {
        // Success - show result dialog with enhanced messaging
        const successMessage = data?.targetUser 
          ? `Sharing request sent successfully to ${data.targetUser}!`
          : `Sharing request sent successfully!`;
          
        setRequestResult({
          success: true,
          message: successMessage,
          details: `${data?.targetUser || 'The user'} will receive a notification about your request. They can approve or deny it from their Sharing page. You can track the status in your "Outgoing" tab.`
        });
        
        setShowResultDialog(true);
        
        // Also show toast for immediate feedback
        toast({
          title: "Request Sent! 📨",
          description: `Your sharing request has been sent to ${data?.targetUser || 'the user'}.`,
          className: "bg-green-50 text-green-900 border-green-200",
          duration: 5000,
        });
      } else {
        // Error - show result dialog with error
        setRequestResult({
          success: false,
          message: 'Failed to send sharing request',
          details: error.message || 'An unexpected error occurred. Please try again.'
        });
        
        setShowResultDialog(true);
      }
    } catch (error: any) {
      // Close confirmation dialog
      setShowConfirmDialog(false);
      
      // Show error result dialog
      setRequestResult({
        success: false,
        message: 'Unexpected error occurred',
        details: error.message || 'Something went wrong. Please try again.'
      });
      setShowResultDialog(true);
    }
  };

  const handleResultDialogClose = () => {
    setShowResultDialog(false);
    setRequestResult(null);
    
    // If request was successful, close main dialog and reset form
    if (requestResult?.success) {
      setOpen(false);
      reset();
      setSelectedTypes([]);
      setHasExpiration(false);
      setHasDateFilter(false);
      setHasPnlFilter(false);
      setPendingData(null);
      setActiveTab('manual');
      setSearchQuery('');
      setCopiedId(null);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setPendingData(null);
  };

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes(prev => {
        const newTypes = [...prev, type];
        // Immediately update form value
        setValue('shared_types', newTypes as any);
        return newTypes;
      });
    } else {
      setSelectedTypes(prev => {
        const newTypes = prev.filter(t => t !== type);
        // Immediately update form value
        setValue('shared_types', newTypes as any);
        return newTypes;
      });
    }
  };

  return (
    <>

      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Share Trading Data</DialogTitle>
          <DialogDescription className="sr-only">
            Share your trading data with another user by setting up access permissions and filters.
          </DialogDescription>
          <div className="bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
            {/* iPhone-style header with cancel button */}
            <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <h2 className="text-lg font-semibold text-center">
                Share Trading Data
              </h2>
              <div className="w-16"></div> {/* Spacer for centering */}
            </div>
            
            {/* Tabbed content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'manual' | 'discover')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mx-4 mt-4 mb-0">
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Manual Entry
                  </TabsTrigger>
                  <TabsTrigger value="discover" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Discover Users
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="px-4 pb-6 mt-4">
                  <form id="share-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* User ID Input with better guidance */}
                    <div className="flex items-center gap-4">
                      <Label htmlFor="viewer_id" className="w-24 text-sm font-medium text-right shrink-0">User ID *</Label>
                      <div className="flex-1 space-y-2">
                        <Input
                          id="viewer_id"
                          name="viewer_id"
                          type="text"
                          placeholder="12345678-1234-1234-1234-123456789012"
                          className="flex-1"
                          {...register('viewer_id')}
                        />
                        <p className="text-xs text-muted-foreground">
                          💡 Tip: Use the 'Discover Users' tab above to find and select users easily
                        </p>
                        {errors.viewer_id && <p className="text-sm text-destructive">{errors.viewer_id.message}</p>}
                      </div>
                    </div>

                    {/* Entry Types with improved UI */}
                    <div className="flex items-start gap-4">
                      <Label className="w-24 text-sm font-medium text-right shrink-0 pt-2">Entry Types *</Label>
                      <div className="flex-1">
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">Select the types of trading data you want to share:</p>
                          <div className="grid grid-cols-2 gap-3">
                            {entryTypes.map((type) => (
                              <div key={type.value} className="flex items-center space-x-2 p-2 rounded border hover:bg-accent/50 transition-colors">
                                <Checkbox
                                  id={`type-${type.value}`}
                                  name={`shared_types_${type.value}`}
                                  checked={selectedTypes.includes(type.value)}
                                  onCheckedChange={(checked) => handleTypeChange(type.value, !!checked)}
                                />
                                <Label htmlFor={`type-${type.value}`} className="text-sm font-normal cursor-pointer flex-1">
                                  {type.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        {selectedTypes.length === 0 && (
                          <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Select at least one entry type
                          </p>
                        )}
                        {selectedTypes.length > 0 && (
                          <p className="text-sm text-success mt-2 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {selectedTypes.length} entry type{selectedTypes.length > 1 ? 's' : ''} selected
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center gap-4">
                        <div className="w-24 shrink-0"></div>
                        <h4 className="font-medium flex items-center gap-2 flex-1">
                          <Filter className="w-4 h-4" />
                          Access Filters (Optional)
                        </h4>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-24 shrink-0"></div>
                        <div className="flex items-center space-x-2 flex-1">
                          <Switch
                            id="expiration"
                            name="has_expiration"
                            checked={hasExpiration}
                            onCheckedChange={setHasExpiration}
                          />
                          <Label htmlFor="expiration" className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Set expiration date
                          </Label>
                        </div>
                      </div>

                      {hasExpiration && (
                        <div className="flex items-center gap-4">
                          <Label htmlFor="expires_at" className="w-24 text-sm font-medium text-right shrink-0">Expires On</Label>
                          <Input
                            id="expires_at"
                            type="date"
                            className="flex-1"
                            {...register('expires_at')}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="w-24 shrink-0"></div>
                        <div className="flex items-center space-x-2 flex-1">
                          <Switch
                            id="date_filter"
                            name="has_date_filter"
                            checked={hasDateFilter}
                            onCheckedChange={setHasDateFilter}
                          />
                          <Label htmlFor="date_filter" className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Filter by date range
                          </Label>
                        </div>
                      </div>

                      {hasDateFilter && (
                        <>
                          <div className="flex items-center gap-4">
                            <Label htmlFor="date_from" className="w-24 text-sm font-medium text-right shrink-0">From Date</Label>
                            <Input
                              id="date_from"
                              type="date"
                              className="flex-1"
                              {...register('date_from')}
                            />
                          </div>
                          <div className="flex items-center gap-4">
                            <Label htmlFor="date_to" className="w-24 text-sm font-medium text-right shrink-0">To Date</Label>
                            <Input
                              id="date_to"
                              type="date"
                              className="flex-1"
                              {...register('date_to')}
                            />
                          </div>
                        </>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="w-24 shrink-0"></div>
                        <div className="flex items-center space-x-2 flex-1">
                          <Switch
                            id="pnl_filter"
                            name="has_pnl_filter"
                            checked={hasPnlFilter}
                            onCheckedChange={setHasPnlFilter}
                          />
                          <Label htmlFor="pnl_filter">Filter by minimum P&L</Label>
                        </div>
                      </div>

                      {hasPnlFilter && (
                        <div className="flex items-center gap-4">
                          <Label htmlFor="min_pnl" className="w-24 text-sm font-medium text-right shrink-0">Min P&L (USD)</Label>
                          <Input
                            id="min_pnl"
                            type="number"
                            step="any"
                            defaultValue="0"
                            className="flex-1"
                            {...register('min_pnl', { valueAsNumber: true })}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-4">
                      <Label htmlFor="message" className="w-24 text-sm font-medium text-right shrink-0 pt-2">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Add a personal message to your sharing request..."
                        rows={3}
                        className="flex-1"
                        {...register('message')}
                      />
                    </div>

                    {/* Bottom action buttons */}
                    <div className="flex gap-3 pt-6 border-t">
                      <Button 
                        type="submit" 
                        disabled={loading || selectedTypes.length === 0} 
                        className="flex-1"
                        size="lg"
                      >
                        {loading ? 'Sending...' : 'Send Request'}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="discover" className="px-4 pb-6 mt-4">
                  <div className="space-y-6">
                    {/* Enhanced Search Bar */}
                    <div className="space-y-2">
                      <Label htmlFor="search-profiles" className="text-sm font-medium">Find Users</Label>
                      <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                        <Search className="w-5 h-5 text-muted-foreground" />
                        <Input
                          id="search-profiles"
                          name="search"
                          placeholder="Search by username or bio..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 border-0 focus:ring-0 focus:outline-none bg-transparent"
                        />
                        {searchQuery && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchQuery('')}
                            className="h-auto p-1 text-muted-foreground hover:text-foreground"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        🔍 Browse public profiles and click 'Select' to auto-populate the user ID below
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="glass-card">
                        <CardContent className="p-4 text-center space-y-2">
                          <div className="p-2 rounded-full bg-primary/10 w-fit mx-auto">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{profiles.length}</h3>
                            <p className="text-xs text-muted-foreground">Public Users</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass-card">
                        <CardContent className="p-4 text-center space-y-2">
                          <div className="p-2 rounded-full bg-success/10 w-fit mx-auto">
                            <Search className="w-4 h-4 text-success" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{filteredProfiles.length}</h3>
                            <p className="text-xs text-muted-foreground">Results</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass-card">
                        <CardContent className="p-4 text-center space-y-2">
                          <div className="p-2 rounded-full bg-info/10 w-fit mx-auto">
                            <Share2 className="w-4 h-4 text-info" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">Easy</h3>
                            <p className="text-xs text-muted-foreground">Sharing</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Profiles Grid */}
                    {discoveryLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading public profiles...</p>
                      </div>
                    ) : filteredProfiles.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto" />
                        <div>
                          <h3 className="font-medium">
                            {searchQuery ? 'No profiles found' : 'No public profiles yet'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {searchQuery 
                              ? 'Try adjusting your search terms' 
                              : 'Be the first to make your profile public!'}
                          </p>
                        </div>
                        {searchQuery && (
                          <Button variant="outline" onClick={() => setSearchQuery('')} size="sm">
                            Clear Search
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-4 max-h-96 overflow-y-auto">
                        {filteredProfiles.map((profile) => (
                          <Card key={profile.id} className="glass-card border hover:border-primary/30 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                {/* Profile Info */}
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={profile.avatar_url} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {profile.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold truncate">
                                    {profile.username}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                                  </p>
                                  {profile.bio && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                      {profile.bio}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyUserIdToClipboard(profile.id, profile.username)}
                                    title="Copy User ID"
                                  >
                                    {copiedId === profile.id ? (
                                      <Check className="w-4 h-4 text-success" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => selectUserFromDiscovery(profile.id, profile.username)}
                                    title="Select this user for sharing"
                                  >
                                    <Share2 className="w-4 h-4 mr-1" />
                                    Select
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <div className="bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl">
            {/* iPhone-style header */}
            <div className="flex items-center justify-center p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-center">
                Confirm Sharing Request
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-blue-100">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Ready to send request</h3>
                  <p className="text-sm text-muted-foreground">Review your sharing details</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="w-16 text-sm font-medium text-right shrink-0">To:</Label>
                  <span className="font-semibold text-primary font-mono text-xs bg-muted p-1 rounded">{pendingData?.viewer_id}</span>
                </div>
                
                {pendingData?.shared_types && (
                  <div className="flex items-start gap-4">
                    <Label className="w-16 text-sm font-medium text-right shrink-0 pt-1">Types:</Label>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1">
                        {pendingData.shared_types.map((type: string) => {
                          const typeLabel = entryTypes.find(t => t.value === type)?.label;
                          return (
                            <span key={type} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              {typeLabel}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {pendingData?.message && (
                  <div className="flex items-start gap-4">
                    <Label className="w-16 text-sm font-medium text-right shrink-0 pt-1">Message:</Label>
                    <div className="flex-1">
                      <p className="text-sm bg-muted p-2 rounded-md">
                        "{pendingData.message}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-800">
                  They will receive a notification and can approve or deny your request. Make sure you entered the correct user ID.
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCancelConfirm} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirmSend} disabled={loading} className="flex-1">
                  {loading ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Result Dialog */}
      <AlertDialog open={showResultDialog} onOpenChange={handleResultDialogClose}>
        <AlertDialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <div className="bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl">
            {/* iPhone-style header */}
            <div className="flex items-center justify-center p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-center">
                {requestResult?.success ? 'Request Sent!' : 'Request Failed'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${
                  requestResult?.success ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {requestResult?.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className={`font-medium ${
                    requestResult?.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {requestResult?.message}
                  </h3>
                  {requestResult?.details && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {requestResult.details}
                    </p>
                  )}
                </div>
              </div>
              
              {requestResult?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">What happens next:</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li className="flex items-start gap-2">
                          <span className="block w-1 h-1 bg-green-600 rounded-full mt-2 shrink-0"></span>
                          The user will be notified of your request
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="block w-1 h-1 bg-green-600 rounded-full mt-2 shrink-0"></span>
                          They can approve or deny access to their data
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="block w-1 h-1 bg-green-600 rounded-full mt-2 shrink-0"></span>
                          Check the "Outgoing" tab to monitor request status
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="block w-1 h-1 bg-green-600 rounded-full mt-2 shrink-0"></span>
                          You'll be notified when they respond
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {!requestResult?.success && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-900 mb-2">Troubleshooting tips:</h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        <li className="flex items-start gap-2">
                          <span className="block w-1 h-1 bg-red-600 rounded-full mt-2 shrink-0"></span>
                          Make sure the user ID is correct and complete
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="block w-1 h-1 bg-red-600 rounded-full mt-2 shrink-0"></span>
                          Verify the user has registered an account
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="block w-1 h-1 bg-red-600 rounded-full mt-2 shrink-0"></span>
                          Check if you already have a request with this user
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="block w-1 h-1 bg-red-600 rounded-full mt-2 shrink-0"></span>
                          Try again in a few moments
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <Button 
                  onClick={handleResultDialogClose} 
                  className={`w-full ${
                    requestResult?.success 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {requestResult?.success ? 'Perfect!' : 'I\'ll Try Again'}
                </Button>
              </div>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}