import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { JournalEntryForm } from '@/components/journal/JournalEntryForm';
import { 
  TrendingUp, 
  Wallet, 
  BarChart3, 
  Coins, 
  Zap, 
  Layers,
  Plus
} from 'lucide-react';

type EntryType = 'spot' | 'futures' | 'wallet' | 'dual_investment' | 'liquidity_mining' | 'liquidity_pool' | 'other';

export function QuickActions() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EntryType>('spot');

  const actions = [
    { 
      icon: TrendingUp, 
      label: 'Spot Trade', 
      description: 'Log buy/sell trades',
      color: 'from-primary to-primary-glow',
      iconColor: 'text-primary',
      type: 'spot' as EntryType
    },
    { 
      icon: BarChart3, 
      label: 'Futures', 
      description: 'Track leveraged positions',
      color: 'from-accent to-success',
      iconColor: 'text-accent',
      type: 'futures' as EntryType
    },
    { 
      icon: Wallet, 
      label: 'Wallet', 
      description: 'Update balances',
      color: 'from-success to-accent',
      iconColor: 'text-success',
      type: 'wallet' as EntryType
    },
    { 
      icon: Coins, 
      label: 'DeFi Pool', 
      description: 'Liquidity positions',
      color: 'from-warning to-primary',
      iconColor: 'text-warning',
      type: 'liquidity_pool' as EntryType
    },
    { 
      icon: Zap, 
      label: 'Mining', 
      description: 'Reward tracking',
      color: 'from-primary to-accent',
      iconColor: 'text-primary',
      type: 'liquidity_mining' as EntryType
    },
    { 
      icon: Layers, 
      label: 'Other', 
      description: 'Custom entries',
      color: 'from-muted to-accent',
      iconColor: 'text-muted-foreground',
      type: 'other' as EntryType
    }
  ];

  const handleActionClick = (type: EntryType) => {
    setSelectedType(type);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Quick Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleActionClick(action.type)}
                  className="h-auto p-2 sm:p-3 lg:p-4 flex flex-col items-center space-y-1 sm:space-y-2 hover-scale transition-all duration-300 hover:shadow-lg border-transparent bg-gradient-to-br hover:from-primary/5 hover:to-accent/5"
                >
                  <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${action.color} bg-opacity-20`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${action.iconColor}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs sm:text-sm font-medium leading-tight">{action.label}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">{action.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Journal Entry Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <JournalEntryForm 
            onClose={handleFormClose}
            initialType={selectedType}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}