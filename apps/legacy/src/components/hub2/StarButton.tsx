import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWatchlist } from "@/store/watchlist";
import { addToWatchlist, removeFromWatchlist } from "@/integrations/api/hub2";
import { WatchEntityType } from "@/types/hub2";
import { Button } from "@/components/ui/button";
import { Star, StarOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarButtonProps {
  entityType: WatchEntityType;
  entityId: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
  className?: string;
}

export default function StarButton({ 
  entityType, 
  entityId, 
  label,
  size = 'sm',
  variant = 'ghost',
  className 
}: StarButtonProps) {
  const { isWatched, getWatchItem, addItem, removeItem } = useWatchlist();
  const queryClient = useQueryClient();
  const [isOptimistic, setIsOptimistic] = useState(false);
  
  const watched = isWatched(entityType, entityId);
  const watchItem = getWatchItem(entityType, entityId);
  
  const addMutation = useMutation({
    mutationFn: () => addToWatchlist(entityType, entityId, label),
    onMutate: () => {
      setIsOptimistic(true);
    },
    onSuccess: (newItem) => {
      addItem(newItem);
      queryClient.invalidateQueries({ queryKey: ['hub2', 'watchlist'] });
      setIsOptimistic(false);
    },
    onError: () => {
      setIsOptimistic(false);
    }
  });
  
  const removeMutation = useMutation({
    mutationFn: () => removeFromWatchlist(watchItem?.id || ''),
    onMutate: () => {
      setIsOptimistic(true);
    },
    onSuccess: () => {
      removeItem(watchItem?.id || '');
      queryClient.invalidateQueries({ queryKey: ['hub2', 'watchlist'] });
      setIsOptimistic(false);
    },
    onError: () => {
      setIsOptimistic(false);
    }
  });
  
  const handleClick = () => {
    if (watched && watchItem) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      disabled={addMutation.isPending || removeMutation.isPending || isOptimistic}
      className={cn(
        sizeClasses[size],
        watched ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500",
        className
      )}
    >
      {watched || isOptimistic ? (
        <Star className={cn("fill-current", iconSizes[size])} />
      ) : (
        <StarOff className={cn(iconSizes[size])} />
      )}
    </Button>
  );
}
