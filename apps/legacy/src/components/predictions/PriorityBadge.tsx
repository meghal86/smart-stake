import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Flame, Zap } from 'lucide-react';

interface PriorityBadgeProps {
  confidence: number;
  horizon: number;
}

export function PriorityBadge({ confidence, horizon }: PriorityBadgeProps) {
  if (confidence > 0.85) {
    return (
      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white gap-1">
        <Flame className="h-3 w-3" />
        High Impact
      </Badge>
    );
  }
  
  if (horizon <= 120) { // 2 hours
    return (
      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white gap-1">
        <Zap className="h-3 w-3" />
        Urgent
      </Badge>
    );
  }
  
  return null;
}