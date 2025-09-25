import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShareDataDialog } from '@/components/sharing/ShareDataDialog';
import { AccessRequestCard } from '@/components/sharing/AccessRequestCard';
import { DataVisibilityControl } from '@/components/sharing/DataVisibilityControl';
import { Navbar } from '@/components/navigation/Navbar';
import { useAccessGrants } from '@/hooks/useAccessGrants';
import { Share2, Users, Send, UserPlus, Shield, Eye } from 'lucide-react';

export default function Sharing() {
  const { grants, incomingRequests, outgoingRequests, loading } = useAccessGrants();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4 pb-20 md:pb-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Share2 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Data Sharing
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Share your trading data with other users or manage access to data shared with you. 
              Discover public profiles or manually enter user IDs to control exactly what data is shared and for how long.
            </p>
          </div>

          {/* Quick Actions - Mobile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <ShareDataDialog>
              <Card className="glass-card hover:bg-card/80 transition-colors cursor-pointer group">
                <CardContent className="p-4 md:p-6 text-center space-y-2 md:space-y-3">
                  <div className="p-2 md:p-3 rounded-full bg-primary/10 w-fit mx-auto group-hover:bg-primary/20 transition-colors">
                    <UserPlus className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm md:text-base">Share & Discover</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">Browse public profiles or enter user IDs</p>
                  </div>
                </CardContent>
              </Card>
            </ShareDataDialog>

            <Card className="glass-card">
              <CardContent className="p-4 md:p-6 text-center space-y-2 md:space-y-3">
                <div className="p-2 md:p-3 rounded-full bg-success/10 w-fit mx-auto">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">{grants.length} Active Shares</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Users with access to your data</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 md:p-6 text-center space-y-2 md:space-y-3">
                <div className="p-2 md:p-3 rounded-full bg-warning/10 w-fit mx-auto">
                  <Send className="w-5 h-5 md:w-6 md:h-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">{incomingRequests.length + outgoingRequests.length} Pending</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Requests awaiting response</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="visibility" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 glass-card">
              <TabsTrigger value="visibility" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Visibility
              </TabsTrigger>
              <TabsTrigger value="incoming" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Incoming ({incomingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="outgoing" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Outgoing ({outgoingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active ({grants.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visibility" className="space-y-4">
              <DataVisibilityControl />
            </TabsContent>

            <TabsContent value="incoming" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Incoming Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading requests...</p>
                    </div>
                  ) : incomingRequests.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="font-medium">No incoming requests</h3>
                        <p className="text-sm text-muted-foreground">
                          When users request access to your data, they'll appear here
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {incomingRequests.map((request) => (
                        <AccessRequestCard 
                          key={request.id} 
                          request={request} 
                          type="incoming" 
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outgoing" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                    Outgoing Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading requests...</p>
                    </div>
                  ) : outgoingRequests.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <Send className="w-12 h-12 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="font-medium">No outgoing requests</h3>
                        <p className="text-sm text-muted-foreground">
                          Requests you send to others will appear here
                        </p>
                      </div>
                      <ShareDataDialog>
                        <Button variant="outline">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Share Data
                        </Button>
                      </ShareDataDialog>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {outgoingRequests.map((request) => (
                        <AccessRequestCard 
                          key={request.id} 
                          request={request} 
                          type="outgoing" 
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Active Shares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading active shares...</p>
                    </div>
                  ) : grants.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="font-medium">No active shares</h3>
                        <p className="text-sm text-muted-foreground">
                          Users you're sharing data with will appear here
                        </p>
                      </div>
                      <ShareDataDialog>
                        <Button variant="outline">
                          <Share2 className="w-4 h-4 mr-2" />
                          Start Sharing
                        </Button>
                      </ShareDataDialog>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {grants.map((grant) => (
                        <AccessRequestCard 
                          key={grant.id} 
                          request={grant} 
                          type="granted" 
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}