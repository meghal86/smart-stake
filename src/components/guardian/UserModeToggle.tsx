/**
 * User Mode Toggle
 * Switch between Beginner and Expert modes for different UX pathways
 */
import { useState, useEffect } from 'react';
import { GraduationCap, Zap, Settings, HelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type UserMode = 'beginner' | 'expert';

interface UserModeToggleProps {
  mode: UserMode;
  onModeChange: (mode: UserMode) => void;
  className?: string;
}

export function UserModeToggle({ mode, onModeChange, className }: UserModeToggleProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [showFirstTime, setShowFirstTime] = useState(false);

  // Check if first time user
  useEffect(() => {
    const hasSeenModePrompt = localStorage.getItem('guardian_seen_mode_prompt');
    if (!hasSeenModePrompt) {
      setShowFirstTime(true);
      localStorage.setItem('guardian_seen_mode_prompt', 'true');
    }
  }, []);

  const handleModeSelect = (newMode: UserMode) => {
    onModeChange(newMode);
    localStorage.setItem('guardian_user_mode', newMode);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'border-slate-700 hover:bg-slate-800/50 transition-all',
              className
            )}
          >
            {mode === 'beginner' ? (
              <>
                <GraduationCap className="h-4 w-4 mr-2 text-blue-400" />
                <span>Beginner Mode</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2 text-amber-400" />
                <span>Expert Mode</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 bg-slate-900/95 backdrop-blur-xl border-slate-700">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            User Mode
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-700" />

          {/* Beginner Mode */}
          <DropdownMenuItem
            onClick={() => handleModeSelect('beginner')}
            className={cn(
              'flex items-start gap-3 p-3 cursor-pointer',
              mode === 'beginner' && 'bg-blue-500/10'
            )}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-slate-100">
                  Beginner Mode
                </span>
                {mode === 'beginner' && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Guided experience with tooltips, confirmations, and plain language explanations
              </p>
            </div>
          </DropdownMenuItem>

          {/* Expert Mode */}
          <DropdownMenuItem
            onClick={() => handleModeSelect('expert')}
            className={cn(
              'flex items-start gap-3 p-3 cursor-pointer',
              mode === 'expert' && 'bg-amber-500/10'
            )}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-slate-100">
                  Expert Mode
                </span>
                {mode === 'expert' && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Streamlined UI with technical details, keyboard shortcuts, and bulk actions
              </p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-700" />

          {/* Learn More */}
          <DropdownMenuItem
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300"
          >
            <HelpCircle className="h-3 w-3" />
            Learn about modes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Info Dialog */}
      <UserModeInfoDialog open={showInfo} onOpenChange={setShowInfo} />

      {/* First Time Modal */}
      <FirstTimeModeDialog
        open={showFirstTime}
        onOpenChange={setShowFirstTime}
        onModeSelect={handleModeSelect}
      />
    </>
  );
}

function UserModeInfoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-900/95 backdrop-blur-xl border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl">Understanding User Modes</DialogTitle>
          <DialogDescription>
            Choose the experience that matches your crypto expertise
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Beginner Mode Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Beginner Mode</h3>
                <p className="text-sm text-slate-400">New to crypto or DeFi</p>
              </div>
            </div>

            <div className="pl-15 space-y-2">
              <FeatureItem
                icon="✅"
                text="Step-by-step guided flows with confirmations"
              />
              <FeatureItem
                icon="💡"
                text="Tooltips and explanations everywhere"
              />
              <FeatureItem
                icon="🗣️"
                text="Plain language (no jargon)"
              />
              <FeatureItem
                icon="🎓"
                text="Educational content and tutorials"
              />
            </div>
          </div>

          {/* Expert Mode Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Expert Mode</h3>
                <p className="text-sm text-slate-400">Experienced DeFi user</p>
              </div>
            </div>

            <div className="pl-15 space-y-2">
              <FeatureItem
                icon="⚡"
                text="Streamlined UI with minimal hand-holding"
              />
              <FeatureItem
                icon="⌨️"
                text="Keyboard shortcuts for power users"
              />
              <FeatureItem
                icon="🔧"
                text="Technical details and raw data"
              />
              <FeatureItem
                icon="📊"
                text="Bulk actions and advanced filters"
              />
            </div>
          </div>

          {/* Note */}
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-300 leading-relaxed">
              <strong className="text-slate-100">💡 Pro Tip:</strong> You can switch
              modes anytime from the top navigation. Your preference is saved automatically.
            </p>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FirstTimeModeDialog({
  open,
  onOpenChange,
  onModeSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModeSelect: (mode: UserMode) => void;
}) {
  const handleSelect = (mode: UserMode) => {
    onModeSelect(mode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900/95 backdrop-blur-xl border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Welcome to Guardian!</DialogTitle>
          <DialogDescription className="text-center text-base">
            Choose your experience level to get started
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* Beginner Option */}
          <button
            onClick={() => handleSelect('beginner')}
            className="w-full p-6 rounded-xl border-2 border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="h-7 w-7 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  I'm New to Crypto
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Perfect for beginners. Get helpful tips, explanations, and guided
                  workflows as you learn.
                </p>
              </div>
            </div>
          </button>

          {/* Expert Option */}
          <button
            onClick={() => handleSelect('expert')}
            className="w-full p-6 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="h-7 w-7 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  I'm Experienced
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  For DeFi veterans. Get a streamlined interface with technical details
                  and power-user features.
                </p>
              </div>
            </div>
          </button>

          {/* Skip */}
          <Button
            variant="ghost"
            onClick={() => {
              handleSelect('beginner');
            }}
            className="w-full text-slate-400 hover:text-slate-300"
          >
            I'll choose later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-300">
      <span className="text-base">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

/**
 * Hook to manage user mode state
 */
export function useUserMode() {
  const [mode, setMode] = useState<UserMode>(() => {
    const saved = localStorage.getItem('guardian_user_mode');
    return (saved as UserMode) || 'beginner';
  });

  const handleModeChange = (newMode: UserMode) => {
    setMode(newMode);
    localStorage.setItem('guardian_user_mode', newMode);
  };

  return { mode, setMode: handleModeChange };
}

