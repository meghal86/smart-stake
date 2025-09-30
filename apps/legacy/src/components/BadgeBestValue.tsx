import React from 'react';
import { Badge } from '@/components/ui/badge';

export const BadgeBestValue: React.FC = () => {
  return (
    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500">
      Best Value
    </Badge>
  );
};