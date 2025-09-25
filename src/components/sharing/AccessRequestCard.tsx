import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAccessGrants } from '@/hooks/useAccessGrants';
import { Check, X, Clock, Calendar, DollarSign, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AccessRequest {
  id: string;
  sharer_id: string;
  viewer_id: string;
  status: 'pending' | 'granted' | 'denied' | 'revoked';
  shared_types: string[];
  expires_at?: string;
  date_from?: string;
  date_to?: string;
  min_pnl?: number;
  message?: string;
  created_at: string;
  sharer_profile?: {
    username: string;
    avatar_url?: string;
  };
  viewer_profile?: {
    username: string;
    avatar_url?: string;
  };
}

interface AccessRequestCardProps {
  request: AccessRequest;
  type: 'incoming' | 'outgoing' | 'granted';
}

export function AccessRequestCard({ request, type }: AccessRequestCardProps) {
  const { approveRequest, denyRequest, revokeAccess, loading } = useAccessGrants();

  const profile = type === 'incoming' ? request.viewer_profile : request.sharer_profile;
  const username = profile?.username || 'Unknown User';
  const avatarUrl = profile?.avatar_url;

  const handleApprove = () => {
    approveRequest(request.id);
  };

  const handleDeny = () => {
    denyRequest(request.id);
  };

  const handleRevoke = () => {
    revokeAccess(request.id);
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>;
      case 'granted':
        return <Badge variant="default" className="flex items-center gap-1 bg-success text-success-foreground">
          <Check className="w-3 h-3" />
          Active
        </Badge>;
      case 'denied':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <X className="w-3 h-3" />
          Denied
        </Badge>;
      case 'revoked':
        return <Badge variant="outline" className="flex items-center gap-1">
          <X className="w-3 h-3" />
          Revoked
        </Badge>;
      default:
        return null;
    }
  };

  const formatEntryTypes = (types: string[]) => {
    return types.map(type => {
      switch (type) {
        case 'spot': return 'Spot';
        case 'futures': return 'Futures';
        case 'wallet': return 'Wallet';
        case 'dual_investment': return 'Dual Investment';
        case 'liquidity_mining': return 'Liquidity Mining';
        case 'liquidity_pool': return 'Liquidity Pool';
        default: return 'Other';
      }
    }).join(', ');
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {type === 'incoming' ? `Request from ${username}` : 
                 type === 'outgoing' ? `Request to ${username}` : 
                 `Sharing with ${username}`}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Shared Data Types
          </h4>
          <p className="text-sm text-muted-foreground">
            {formatEntryTypes(request.shared_types)}
          </p>
        </div>

        {(request.date_from || request.date_to || request.min_pnl || request.expires_at) && (
          <div>
            <h4 className="font-medium text-sm mb-2">Filters Applied</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              {request.date_from && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  From: {new Date(request.date_from).toLocaleDateString()}
                </div>
              )}
              {request.date_to && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  To: {new Date(request.date_to).toLocaleDateString()}
                </div>
              )}
              {request.min_pnl && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  Min P&L: ${request.min_pnl}
                </div>
              )}
              {request.expires_at && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Expires: {new Date(request.expires_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}

        {request.message && (
          <div>
            <h4 className="font-medium text-sm mb-2">Message</h4>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              "{request.message}"
            </p>
          </div>
        )}

        {type === 'incoming' && request.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              onClick={handleApprove} 
              disabled={loading}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDeny}
              disabled={loading}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Deny
            </Button>
          </div>
        )}

        {type === 'granted' && (
          <div className="pt-2">
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={handleRevoke}
              disabled={loading}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Revoke Access
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}