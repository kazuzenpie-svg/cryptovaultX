import { useState, useMemo } from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { JournalEntryForm } from '@/components/journal/JournalEntryForm';
import { useCombinedEntries } from '@/hooks/useCombinedEntries';
import { useDataVisibility } from '@/hooks/useDataVisibility';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Edit, Trash2, Plus, Users, Eye } from 'lucide-react';

const Journal = () => {
  const { entries, loading, updateEntry, deleteEntry } = useCombinedEntries();
  const { isSourceVisible, getVisibleSourceIds } = useDataVisibility();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredEntries = useMemo(() => {
    // Enforce visibility again on the page to avoid any leak
    const visibleGrantIds = getVisibleSourceIds().filter(id => id !== 'own');
    const visibilityFiltered = entries.filter(entry => {
      if (entry.isShared) {
        return entry.grant_id && visibleGrantIds.includes(entry.grant_id);
      }
      return isSourceVisible('own');
    });

    let filtered = visibilityFiltered.filter(entry => {
      const matchesSearch = !searchTerm || 
        entry.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        entry.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || entry.type === filterType;
      
      let matchesDate = true;
      if (filterDate !== 'all') {
        const entryDate = new Date(entry.date);
        const now = new Date();
        if (filterDate === '7days') {
          matchesDate = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24) <= 7;
        } else if (filterDate === '30days') {
          matchesDate = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24) <= 30;
        } else if (filterDate === '90days') {
          matchesDate = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24) <= 90;
        }
      }
      
      return matchesSearch && matchesType && matchesDate;
    });
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, searchTerm, filterType, filterDate, isSourceVisible, getVisibleSourceIds]);

  const handleDelete = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry || entry.isShared) return; // runtime guard: never delete shared
    await deleteEntry(id);
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
  };

  const handleUpdate = async (updates: any) => {
    if (editingEntry && !editingEntry.isShared) {
      await updateEntry(editingEntry.id, updates);
      setEditingEntry(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-4 text-center">
          <div className="mt-20">Loading journal entries...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trading Journal</h1>
            <p className="text-muted-foreground">
              Document and manage your trading activities
            </p>
          </div>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" data-testid="button-add-entry">
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Journal Entry</DialogTitle>
              </DialogHeader>
              <JournalEntryForm onClose={() => setShowAddForm(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by asset, notes, or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[150px]" data-testid="select-type-filter">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="spot">Spot</SelectItem>
                      <SelectItem value="futures">Futures</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                      <SelectItem value="dual_investment">Dual Investment</SelectItem>
                      <SelectItem value="liquidity_mining">Liquidity Mining</SelectItem>
                      <SelectItem value="liquidity_pool">Liquidity Pool</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDate} onValueChange={setFilterDate}>
                    <SelectTrigger className="w-[150px]" data-testid="select-date-filter">
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="90days">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {filteredEntries.length} of {entries.length} entries
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="space-y-4">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <Card key={entry.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">
                          {entry.type}
                        </Badge>
                        <h3 className="font-semibold text-lg">{entry.asset}</h3>
                        {entry.side && (
                          <Badge variant={entry.side === 'buy' ? 'default' : 'destructive'} className="capitalize">
                            {entry.side}
                          </Badge>
                        )}
                        {entry.isShared && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Shared
                          </Badge>
                        )}
                        {entry.isShared && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Read-only
                          </Badge>
                        )}
                      </div>
                      {!entry.isShared && (
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(entry)}
                            data-testid={`button-edit-${entry.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive hover:text-destructive"
                                data-testid={`button-delete-${entry.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this {entry.type} entry for {entry.asset}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(entry.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-testid={`confirm-delete-${entry.id}`}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      {entry.quantity && (
                        <div>
                          <span className="text-muted-foreground">Quantity:</span>
                          <div className="font-medium">{entry.quantity}</div>
                        </div>
                      )}
                      {entry.price_usd && (
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <div className="font-medium">${entry.price_usd}</div>
                        </div>
                      )}
                      {entry.pnl !== 0 && (
                        <div>
                          <span className="text-muted-foreground">P&L:</span>
                          <div className={`font-medium ${
                            entry.pnl > 0 ? 'text-green-600 dark:text-green-400' : 
                            entry.pnl < 0 ? 'text-red-600 dark:text-red-400' : ''
                          }`}>
                            ${entry.pnl > 0 ? '+' : ''}${entry.pnl}
                          </div>
                        </div>
                      )}
                      {entry.fees > 0 && (
                        <div>
                          <span className="text-muted-foreground">Fees:</span>
                          <div className="font-medium">${entry.fees}</div>
                        </div>
                      )}
                    </div>
                    
                    {entry.notes && (
                      <div className="pt-2 border-t">
                        <span className="text-muted-foreground text-sm">Notes:</span>
                        <p className="text-sm mt-1">{entry.notes}</p>
                      </div>
                    )}
                    
                    {entry.isShared && entry.sharer_profile && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>Shared by: {entry.sharer_profile.username}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {entries.length === 0 
                    ? "No entries yet. Start by adding your first trade!" 
                    : "No entries match your current filters."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Journal Entry</DialogTitle>
            </DialogHeader>
            {editingEntry && (
              <JournalEntryForm 
                onClose={() => setEditingEntry(null)}
                initialData={editingEntry}
                onSubmit={handleUpdate}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Journal;