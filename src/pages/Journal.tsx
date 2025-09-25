import { useState } from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { JournalEntryForm } from '@/components/journal/JournalEntryForm';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Journal = () => {
  const { entries, loading } = useJournalEntries();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto p-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trading Journal</h1>
            <p className="text-muted-foreground">
              Document your trading activities and thoughts
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Entry</CardTitle>
                <CardDescription>
                  Record your latest trade or market observation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JournalEntryForm onClose={() => {}} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entries && entries.length > 0 ? (
                    entries.map((entry, index) => (
                      <div key={entry.id || index} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{entry.type} - {entry.asset}</h4>
                          <span className="text-sm text-muted-foreground">
                            {entry.date ? new Date(entry.date).toLocaleDateString() : 'No date'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entry.notes || 'No notes'}
                        </p>
                        <Separator />
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No entries yet. Start by adding your first trade!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Journal;