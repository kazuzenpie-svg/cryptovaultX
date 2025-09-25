import { useState } from 'react';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { usePlatforms } from '@/hooks/usePlatforms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { JournalEntryForm } from '@/components/journal/JournalEntryForm';
import { PageLoading } from '@/components/LoadingSpinner';
import { Navbar } from '@/components/navigation/Navbar';
import { 
  Plus, 
  BookOpen, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Filter,
  Users,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

const entryTypeLabels = {
  spot: 'Spot Trading',
  futures: 'Futures',
  wallet: 'Wallet',
  dual_investment: 'Dual Investment',
  liquidity_mining: 'Liquidity Mining',
  liquidity_pool: 'Liquidity Pool',
  other: 'Other'
};

const entryTypeColors = {
  spot: 'bg-primary/20 text-primary',
  futures: 'bg-accent/20 text-accent',
  wallet: 'bg-success/20 text-success',
  dual_investment: 'bg-warning/20 text-warning',
  liquidity_mining: 'bg-purple-500/20 text-purple-500',
  liquidity_pool: 'bg-cyan-500/20 text-cyan-500',
  other: 'bg-muted text-muted-foreground'
};

export default function Journal() {
  const { entries, loading, deleteEntry } = useCombinedEntries();
  const { platforms } = usePlatforms();
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<'spot' | 'futures' | 'wallet' | 'dual_investment' | 'liquidity_mining' | 'liquidity_pool' | 'other'>('spot');

  const handleAddEntry = (type?: typeof selectedType) => {
    if (type) setSelectedType(type);
    setShowForm(true);
  };

  const handleDeleteEntry = async (id: string, asset: string, isShared: boolean) => {
    if (isShared) {
      // Show a proper toast instead of alert
      return;
    }
    if (window.confirm(`Are you sure you want to delete the ${asset} entry? This action cannot be undone.`)) {
      await deleteEntry(id);
    }
  };

  const getPlatformName = (platformId: string | null) => {
    if (!platformId) return 'Manual Entry';
    const platform = platforms.find(p => p.id === platformId);
    return platform?.name || 'Unknown Platform';
  };

  const formatEntryValue = (entry: any) => {
    if (entry.type === 'spot' && entry.quantity && entry.price_usd) {
      const value = entry.quantity * entry.price_usd;
      return `$${value.toLocaleString()}`;
    }
    if (entry.pnl !== 0) {
      return `${entry.pnl > 0 ? '+' : ''}$${Math.abs(entry.pnl).toLocaleString()}`;
    }
    return '-';
  };

  if (loading && entries.length === 0) {
    return (
      <>
        <Navbar />
        <PageLoading text="Loading your journal..." />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Trading Journal
                </h1>
              </div>
              <p className="text-muted-foreground">
                Track your crypto activities and analyze your performance
              </p>
              {entries.some(e => e.isShared) && (
                <div className="flex items-center gap-2 mt-2">
                  <Eye className="w-4 h-4 text-accent" />
                  <span className="text-sm text-accent">
                    Showing data from {entries.filter(e => e.isShared).length > 0 ? 'multiple sources' : 'your account'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="hover-scale">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button onClick={() => handleAddEntry()} className="hover-scale">
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 fade-in" style={{ animationDelay: '0.1s' }}>
            {Object.entries(entryTypeLabels).map(([type, label], index) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => handleAddEntry(type as any)}
                className="hover-scale transition-all duration-300 hover:shadow-lg border-transparent bg-gradient-to-br hover:from-primary/5 hover:to-accent/5"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <Plus className="w-3 h-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>

          {/* Entries List */}
          {entries.length === 0 ? (
            <Card className="glass-card fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Start tracking your crypto activities by adding your first journal entry.
                </p>
                <Button onClick={() => handleAddEntry()} className="hover-scale">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <Card key={entry.id} className="glass-card hover-scale transition-all duration-300 fade-in" style={{ animationDelay: `${0.2 + index * 0.05}s` }}>
                  <CardContent className="p-4 md:p-6">
                    {/* Mobile Layout */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <Badge className={`${entryTypeColors[entry.type]} text-xs`}>
                            {entryTypeLabels[entry.type]}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(entry.date), 'MMM dd')}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-base md:text-lg">{entry.asset}</h3>
                            {entry.side && (
                              <Badge variant={entry.side === 'buy' ? 'default' : 'secondary'} className="text-xs">
                                {entry.side.toUpperCase()}
                              </Badge>
                            )}
                            {entry.isShared && (
                              <Badge variant="outline" className="text-xs border-accent text-accent">
                                <Users className="w-3 h-3 sm:mr-1" />
                                <span className="hidden sm:inline">Shared</span>
                              </Badge>
                            )}
                          </div>
                          
                          {/* Mobile: Grid layout for entry details */}
                          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2">
                            {entry.sharer_profile && (
                              <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                                <Avatar className="w-3 h-3 sm:w-4 sm:h-4">
                                  <AvatarImage src={entry.sharer_profile.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {entry.sharer_profile.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-accent font-medium">{entry.sharer_profile.username}</span>
                                <span className="hidden sm:inline">•</span>
                              </div>
                            )}
                            {entry.quantity && (
                              <span>Qty: {entry.quantity.toLocaleString()}</span>
                            )}
                            {entry.price_usd && (
                              <span>Price: ${entry.price_usd.toLocaleString()}</span>
                            )}
                            {entry.leverage && (
                              <span>Leverage: {entry.leverage}x</span>
                            )}
                            <span className="col-span-2 sm:col-span-1">
                              Platform: {getPlatformName(entry.platform_id)}
                            </span>
                          </div>
                          
                          {entry.notes && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* P&L and Actions - Mobile optimized */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                        <div className="text-left sm:text-right">
                          <div className="font-medium text-sm">
                            {formatEntryValue(entry)}
                          </div>
                          
                          {entry.pnl !== 0 && (
                            <div className={`flex items-center gap-1 text-xs ${
                              entry.pnl > 0 ? 'text-success' : 'text-destructive'
                            }`}>
                              {entry.pnl > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              P&L: {entry.pnl > 0 ? '+' : ''}${entry.pnl.toLocaleString()}
                            </div>
                          )}
                          
                          {entry.fees > 0 && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Fees: ${entry.fees.toLocaleString()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1 sm:gap-2">
                          {!entry.isShared && (
                            <Button variant="ghost" size="icon" className="hover-scale h-8 w-8">
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          )}
                          {!entry.isShared ? (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="hover-scale text-destructive hover:text-destructive h-8 w-8"
                              onClick={() => handleDeleteEntry(entry.id, entry.asset, entry.isShared || false)}
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          ) : (
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              Read-only
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Journal Entry Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <JournalEntryForm 
            onClose={() => setShowForm(false)}
            initialType={selectedType}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
      return;
    }
    if (confirm(`Are you sure you want to delete the ${asset} entry? This action cannot be undone.`)) {
      await deleteEntry(id);
    }
  };
