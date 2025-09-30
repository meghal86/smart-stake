import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
}

export function KeyboardShortcuts({ shortcuts }: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show help with Ctrl+? or Cmd+?
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setShowHelp(true);
        return;
      }

      // Hide help with Escape
      if (event.key === 'Escape' && showHelp) {
        setShowHelp(false);
        return;
      }

      // Execute shortcuts
      shortcuts.forEach(shortcut => {
        const keys = shortcut.key.toLowerCase().split('+');
        const hasCtrl = keys.includes('ctrl') || keys.includes('cmd');
        const hasShift = keys.includes('shift');
        const hasAlt = keys.includes('alt');
        const mainKey = keys[keys.length - 1];

        const ctrlPressed = event.ctrlKey || event.metaKey;
        const shiftPressed = event.shiftKey;
        const altPressed = event.altKey;
        const keyPressed = event.key.toLowerCase();

        if (
          (!hasCtrl || ctrlPressed) &&
          (!hasShift || shiftPressed) &&
          (!hasAlt || altPressed) &&
          keyPressed === mainKey
        ) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, showHelp]);

  const formatShortcut = (key: string) => {
    return key
      .split('+')
      .map(k => k.charAt(0).toUpperCase() + k.slice(1))
      .join(' + ');
  };

  return (
    <>
      {/* Help Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 left-4 z-40"
        title="Keyboard shortcuts (Ctrl+/)"
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{shortcut.description}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {formatShortcut(shortcut.key)}
                  </Badge>
                </div>
              ))}
              
              <div className="border-t pt-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show this help</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    Ctrl + /
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Close help</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    Escape
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}