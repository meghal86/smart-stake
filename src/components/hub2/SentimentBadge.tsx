import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SentimentBadgeProps {
  sentiment: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export default function SentimentBadge({ 
  sentiment, 
  size = 'sm',
  showValue = false,
  className 
}: SentimentBadgeProps) {
  const getSentimentLabel = (sentiment: number) => {
    if (sentiment >= 60) return 'Positive';
    if (sentiment >= 40) return 'Neutral';
    return 'Negative';
  };
  
  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 60) return 'bg-green-100 text-green-800 border-green-200';
    if (sentiment >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        sizeClasses[size],
        getSentimentColor(sentiment),
        className
      )}
    >
      {showValue ? `${Math.round(sentiment)}% ${getSentimentLabel(sentiment)}` : getSentimentLabel(sentiment)}
    </Badge>
  );
}
