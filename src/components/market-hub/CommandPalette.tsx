import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Fish, Coins, Users } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntitySelect: (entity: any) => void;
}

export function CommandPalette({ open, onOpenChange, onEntitySelect }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  // Search results should come from API - showing empty for now
  const searchResults: any[] = [];

  const handleSelect = (item: any) => {
    onEntitySelect(item);
    onOpenChange(false);
    setQuery('');
  };

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <Command className="rounded-lg border-0 shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search coins, addresses, clusters..."
              value={query}
              onValueChange={setQuery}
              className="border-0 focus:ring-0"
            />
          </div>
          <CommandList className="max-h-96">
            <CommandEmpty>No results found.</CommandEmpty>
            
            {searchResults.filter(r => r.type === 'coin').length > 0 && (
              <CommandGroup heading="Coins">
                {searchResults
                  .filter(r => r.type === 'coin')
                  .map((item) => (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 p-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.symbol}</div>
                      </div>
                      <Badge variant="outline">Coin</Badge>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}

            {searchResults.filter(r => r.type === 'address').length > 0 && (
              <CommandGroup heading="Whale Addresses">
                {searchResults
                  .filter(r => r.type === 'address')
                  .map((item) => (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 p-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium font-mono text-sm">{item.id}</div>
                        <div className="text-sm text-muted-foreground">{item.balance}</div>
                      </div>
                      <Badge variant="outline">Address</Badge>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}

            {searchResults.filter(r => r.type === 'cluster').length > 0 && (
              <CommandGroup heading="Whale Clusters">
                {searchResults
                  .filter(r => r.type === 'cluster')
                  .map((item) => (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 p-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.members} members</div>
                      </div>
                      <Badge variant="outline">Cluster</Badge>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}