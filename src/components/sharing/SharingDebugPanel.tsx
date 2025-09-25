import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccessGrants } from '@/hooks/useAccessGrants';
import { useAuth } from '@/hooks/useAuth';
import { Share2, User, Users } from 'lucide-react';

export function SharingDebugPanel() {
  const { user } = useAuth();
  const { grants, incomingRequests, outgoingRequests, loading, refetch } = useAccessGrants();

  return (
    <Card className="glass-card mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          Sharing Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <User className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="font-medium">{user ? 'Authenticated' : 'Not Logged In'}</div>
            <div className="text-xs text-muted-foreground">
              {user ? 'Ready to share' : 'Login required'}
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Users className="w-6 h-6 mx-auto mb-2 text-success" />
            <div className="font-medium">{grants.length} Active</div>
            <div className="text-xs text-muted-foreground">Sharing data</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Share2 className="w-6 h-6 mx-auto mb-2 text-warning" />
            <div className="font-medium">{incomingRequests.length} Incoming</div>
            <div className="text-xs text-muted-foreground">Requests to me</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Share2 className="w-6 h-6 mx-auto mb-2 text-info" />
            <div className="font-medium">{outgoingRequests.length} Outgoing</div>
            <div className="text-xs text-muted-foreground">My requests</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={refetch} disabled={loading} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            {loading ? 'Loading...' : 'Refresh Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}