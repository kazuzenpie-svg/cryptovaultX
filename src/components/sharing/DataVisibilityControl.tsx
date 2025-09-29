import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useDataVisibility } from '@/hooks/useDataVisibility';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { Eye, EyeOff, Users, User, Database, BarChart3, Info } from 'lucide-react';

export function DataVisibilityControl() {
  const { dataSources, toggleVisibility, isLoaded } = useDataVisibility();
  const { ownEntries, sharedEntries } = useCombinedEntries();

  // Calculate entry counts per source
  const getEntryCount = (sourceId: string, sourceType: 'own' | 'shared') => {
    if (sourceType === 'own') {
      return ownEntries.length;
    }
    // For shared sources, count entries from that specific grant
    return sharedEntries.filter(entry => entry.grant_id === sourceId).length;
  };

  const totalVisibleEntries = dataSources
    .filter(source => source.isVisible)
    .reduce((sum, source) => sum + getEntryCount(source.sourceId, source.sourceType), 0);

  if (!isLoaded) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading data sources...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          Data Sources Control
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Control which data sources are visible across your dashboard and journal
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="glass-card border-0 bg-muted/30">
            <CardContent className="p-4 text-center space-y-2">
              <div className="p-2 rounded-full bg-primary/10 w-fit mx-auto">
                <Database className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{dataSources.length}</h3>
                <p className="text-xs text-muted-foreground">Total Sources</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 bg-muted/30">
            <CardContent className="p-4 text-center space-y-2">
              <div className="p-2 rounded-full bg-success/10 w-fit mx-auto">
                <Eye className="w-4 h-4 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{dataSources.filter(s => s.isVisible).length}</h3>
                <p className="text-xs text-muted-foreground">Visible</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 bg-muted/30">
            <CardContent className="p-4 text-center space-y-2">
              <div className="p-2 rounded-full bg-accent/10 w-fit mx-auto">
                <BarChart3 className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{totalVisibleEntries}</h3>
                <p className="text-xs text-muted-foreground">Entries Shown</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Sources List */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Active Data Sources
          </h4>
          
          {dataSources.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Database className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-medium">No data sources available</h3>
                <p className="text-sm text-muted-foreground">
                  Request access to other users' data to see more sources here
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {dataSources.map((source) => {
                const entryCount = getEntryCount(source.sourceId, source.sourceType);
                const Icon = source.sourceType === 'own' ? User : Users;
                
                return (
                  <div
                    key={source.sourceId}
                    className={`
                      flex items-center justify-between p-4 rounded-lg border transition-all
                      ${source.isVisible 
                        ? 'bg-primary/5 border-primary/20' 
                        : 'bg-muted/30 border-muted/40'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar or Icon */}
                      {source.sourceType === 'shared' && source.avatar_url ? (
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={source.avatar_url} />
                          <AvatarFallback className="bg-accent/10 text-accent font-semibold">
                            {source.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={`
                          p-2 rounded-full w-10 h-10 flex items-center justify-center
                          ${source.sourceType === 'own' 
                            ? 'bg-primary/10' 
                            : 'bg-accent/10'
                          }
                        `}>
                          <Icon className={`w-5 h-5 ${
                            source.sourceType === 'own' ? 'text-primary' : 'text-accent'
                          }`} />
                        </div>
                      )}
                      
                      {/* Source Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{source.sourceName}</h3>
                          <Badge 
                            variant={source.sourceType === 'own' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {source.sourceType === 'own' ? 'My Data' : 'Shared'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entryCount} {entryCount === 1 ? 'entry' : 'entries'} available
                          {source.sourceType === 'shared' && ' • Read-only'}
                        </p>
                      </div>
                    </div>

                    {/* Visibility Toggle */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {source.isVisible ? (
                          <Eye className="w-4 h-4 text-success" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                        <Switch
                          checked={source.isVisible}
                          onCheckedChange={() => toggleVisibility(source.sourceId)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Information */}
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>My Data:</strong> Your personal trading entries that you can edit</li>
                <li><strong>Shared Data:</strong> Read-only entries shared with you by other users</li>
                <li><strong>Individual Control:</strong> Toggle each data source independently</li>
                <li><strong>Global Effect:</strong> Settings apply to Dashboard, Journal, and Analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}