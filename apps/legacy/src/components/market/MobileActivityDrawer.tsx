import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RightActivityFeed } from './RightActivityFeed';
import { useAnalytics } from '@/hooks/useAnalytics';

interface MobileActivityDrawerProps {
  onItemClick: (item: any) => void;
}

export function MobileActivityDrawer({ onItemClick }: MobileActivityDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const { track } = useAnalytics();

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    track('mobile_drawer_drag_start');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null) return;
    setDragCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (dragStartY === null || dragCurrentY === null) return;
    
    const deltaY = dragStartY - dragCurrentY;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        // Swiped up - expand
        setIsExpanded(true);
        track('mobile_drawer_swiped_up');
      } else {
        // Swiped down - collapse
        setIsExpanded(false);
        track('mobile_drawer_swiped_down');
      }
    }
    
    setDragStartY(null);
    setDragCurrentY(null);
  };

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const newState = !prev;
      track('mobile_drawer_toggled', { expanded: newState });
      return newState;
    });
  };

  // Auto-collapse on scroll (optional UX enhancement)
  useEffect(() => {
    const handleScroll = () => {
      if (isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isExpanded]);

  return (
    <div className="lg:hidden">
      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-background border-t transition-transform duration-300 ease-out ${
          isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'
        }`}
        style={{
          height: isExpanded ? '70vh' : '60px',
          maxHeight: isExpanded ? '500px' : '60px'
        }}
      >
        {/* Drag Handle */}
        <div 
          className="flex items-center justify-center py-3 cursor-pointer select-none"
          onClick={toggleExpanded}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Activity Feed</span>
            <Badge variant="secondary" className="text-xs">
              Live
            </Badge>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Drag indicator bar */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-muted-foreground/30 rounded-full" />

        {/* Content */}
        <div className={`px-4 pb-4 overflow-hidden ${isExpanded ? 'h-full' : 'h-0'}`}>
          <div className="h-full overflow-y-auto">
            <RightActivityFeed onItemClick={onItemClick} />
          </div>
        </div>
      </div>

      {/* Safe area spacer when drawer is collapsed */}
      {!isExpanded && <div className="h-16 lg:hidden" />}
    </div>
  );
}