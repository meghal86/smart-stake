import { useState } from 'react';
import { Twitter, MessageCircle, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FloatingSocial() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed right-4 bottom-24 z-40 md:hidden">
      <div className={cn(
        "flex flex-col items-end gap-2 transition-all duration-300",
        isExpanded ? "opacity-100" : "opacity-90"
      )}>
        {/* Social Links - Hidden by default, shown when expanded */}
        <div className={cn(
          "flex flex-col gap-2 transition-all duration-300 transform",
          isExpanded ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 pointer-events-none"
        )}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('https://twitter.com/whaleplus', '_blank')}
            className="h-10 w-10 p-0 bg-background/90 backdrop-blur-sm border-border/50 hover:bg-[#14B8A6]/10 hover:border-[#14B8A6]/50"
          >
            <Twitter className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('/support', '_blank')}
            className="h-10 w-10 p-0 bg-background/90 backdrop-blur-sm border-border/50 hover:bg-[#14B8A6]/10 hover:border-[#14B8A6]/50"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>

        {/* Toggle Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "h-10 w-10 p-0 bg-background/90 backdrop-blur-sm border-border/50 transition-all duration-300",
            "hover:bg-[#14B8A6]/10 hover:border-[#14B8A6]/50",
            isExpanded && "rotate-180"
          )}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}