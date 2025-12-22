import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Search, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  Info,
  RefreshCw,
  ExternalLink,
  Filter,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export type EmptyStateType = 
  | 'no-risks-detected'
  | 'no-opportunities'
  | 'no-search-results'
  | 'no-data-available'
  | 'scanning-in-progress'
  | 'filters-no-match'
  | 'temporary-unavailable';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  external?: boolean;
}

export interface ScanChecklist {
  item: string;
  checked: boolean;
  description?: string;
}

export interface ActionableEmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actions?: EmptyStateAction[];
  scanChecklist?: ScanChecklist[];
  showRefresh?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  estimatedWaitTime?: string;
  className?: string;
}

const getEmptyStateConfig = (type: EmptyStateType) => {
  switch (type) {
    case 'no-risks-detected':
      return {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        iconBg: 'bg-green-500/10',
        title: 'No Active Risks Detected',
        description: 'Your wallet appears secure based on our comprehensive analysis.',
        defaultActions: [
          {
            label: 'Learn how Guardian protects you',
            variant: 'outline' as const,
            icon: Shield,
            external: true
          }
        ],
        defaultChecklist: [
          { item: 'Transaction patterns analyzed', checked: true },
          { item: 'Smart contract interactions reviewed', checked: true },
          { item: 'Known risk addresses checked', checked: true },
          { item: 'Suspicious activity patterns scanned', checked: true },
          { item: 'Token approval risks assessed', checked: true }
        ]
      };

    case 'no-opportunities':
      return {
        icon: TrendingUp,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
        title: 'No Opportunities Available',
        description: 'AI Copilot is continuously scanning for new opportunities across all protocols.',
        defaultActions: [
          {
            label: 'Adjust filters',
            variant: 'default' as const,
            icon: Filter
          },
          {
            label: 'View all protocols',
            variant: 'outline' as const,
            icon: ExternalLink
          }
        ],
        defaultChecklist: [
          { item: 'DeFi protocols scanned', checked: true, description: '847 protocols' },
          { item: 'Yield farming opportunities checked', checked: true },
          { item: 'Staking rewards analyzed', checked: true },
          { item: 'Liquidity mining programs reviewed', checked: true },
          { item: 'New token launches monitored', checked: true }
        ]
      };

    case 'no-search-results':
      return {
        icon: Search,
        iconColor: 'text-gray-500',
        iconBg: 'bg-gray-500/10',
        title: 'No Results Found',
        description: 'Try adjusting your search terms or filters to find what you\'re looking for.',
        defaultActions: [
          {
            label: 'Clear filters',
            variant: 'default' as const,
            icon: RefreshCw
          },
          {
            label: 'Browse all',
            variant: 'outline' as const,
            icon: TrendingUp
          }
        ]
      };

    case 'no-data-available':
      return {
        icon: Info,
        iconColor: 'text-yellow-500',
        iconBg: 'bg-yellow-500/10',
        title: 'No Data Available',
        description: 'Data is temporarily unavailable. This could be due to network connectivity or maintenance.',
        defaultActions: [
          {
            label: 'Retry',
            variant: 'default' as const,
            icon: RefreshCw
          },
          {
            label: 'Check status',
            variant: 'outline' as const,
            icon: ExternalLink,
            external: true
          }
        ]
      };

    case 'scanning-in-progress':
      return {
        icon: RefreshCw,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
        title: 'Scanning in Progress',
        description: 'AI Copilot is analyzing your wallet and scanning for opportunities.',
        spinning: true
      };

    case 'filters-no-match':
      return {
        icon: Filter,
        iconColor: 'text-orange-500',
        iconBg: 'bg-orange-500/10',
        title: 'No Results Match Your Filters',
        description: 'Try broadening your search criteria or removing some filters.',
        defaultActions: [
          {
            label: 'Reset filters',
            variant: 'default' as const,
            icon: RefreshCw
          },
          {
            label: 'Adjust criteria',
            variant: 'outline' as const,
            icon: Settings
          }
        ]
      };

    case 'temporary-unavailable':
      return {
        icon: AlertTriangle,
        iconColor: 'text-yellow-500',
        iconBg: 'bg-yellow-500/10',
        title: 'Temporarily Unavailable',
        description: 'This feature is temporarily unavailable. Please try again in a few minutes.',
        defaultActions: [
          {
            label: 'Try again',
            variant: 'default' as const,
            icon: RefreshCw
          }
        ]
      };

    default:
      return {
        icon: Info,
        iconColor: 'text-gray-500',
        iconBg: 'bg-gray-500/10',
        title: 'No Content Available',
        description: 'There\'s nothing to show here right now.'
      };
  }
};

export function ActionableEmptyState({
  type,
  title,
  description,
  actions,
  scanChecklist,
  showRefresh = false,
  onRefresh,
  isRefreshing = false,
  estimatedWaitTime,
  className = ''
}: ActionableEmptyStateProps) {
  const config = getEmptyStateConfig(type);
  const Icon = config.icon;
  
  // Validate and sanitize inputs to handle edge cases
  const isValidString = (str: string | null | undefined): boolean => {
    return typeof str === 'string' && str.trim().length >= 3 && /[a-zA-Z]/.test(str.trim());
  };
  
  const finalTitle = isValidString(title) ? title!.trim() : config.title;
  const finalDescription = isValidString(description) ? description!.trim() : config.description;
  
  // Filter out invalid actions and sanitize labels
  const validActions = (actions || []).filter(action => 
    action && isValidString(action.label) && typeof action.onClick === 'function'
  ).map(action => ({
    ...action,
    label: action.label.trim()
  }));
  
  // Use default actions if no valid actions provided and we need some actions
  const finalActions = validActions.length > 0 ? validActions : (config.defaultActions || []);
  
  // Filter out invalid checklist items
  const validChecklist = (scanChecklist || []).filter(item => 
    item && isValidString(item.item)
  ).map(item => ({
    ...item,
    item: item.item.trim(),
    description: isValidString(item.description) ? item.description!.trim() : item.description
  }));
  
  const finalChecklist = validChecklist.length > 0 ? validChecklist : (config.defaultChecklist || []);

  const handleActionClick = (action: EmptyStateAction) => {
    // Ensure action has valid properties before executing
    if (!action || !isValidString(action.label) || typeof action.onClick !== 'function') {
      return;
    }
    
    if (action.href && isValidString(action.href)) {
      if (action.external) {
        window.open(action.href.trim(), '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = action.href.trim();
      }
    } else {
      action.onClick();
    }
  };

  return (
    <Card className={`p-8 text-center bg-card/50 backdrop-blur-sm border border-border/50 ${className}`}>
      <motion.div
        className="space-y-6 max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon */}
        <motion.div
          className="relative mx-auto"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className={`p-4 ${config.iconBg} rounded-2xl inline-block`}>
            <motion.div
              animate={config.spinning ? { rotate: 360 } : {}}
              transition={config.spinning ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
            >
              <Icon className={`h-12 w-12 ${config.iconColor}`} />
            </motion.div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-foreground">
            {finalTitle}
          </h2>
          
          <p className="text-muted-foreground leading-relaxed">
            {finalDescription}
          </p>

          {isValidString(estimatedWaitTime) && (
            <p className="text-sm text-muted-foreground">
              Estimated wait time: {estimatedWaitTime!.trim()}
            </p>
          )}
        </motion.div>

        {/* Scan Checklist */}
        {finalChecklist.length > 0 && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-medium text-foreground">
              Items Scanned:
            </h3>
            <div className="space-y-2 text-left">
              {finalChecklist.map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3 text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <CheckCircle 
                    className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      item.checked ? 'text-green-500' : 'text-gray-400'
                    }`}
                    aria-label={item.checked ? 'Completed' : 'Not completed'}
                  />
                  <div>
                    <span className="text-foreground">{item.item}</span>
                    {isValidString(item.description) && (
                      <span className="text-muted-foreground ml-2">
                        ({item.description!.trim()})
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        {(finalActions.length > 0 || showRefresh) && (
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {showRefresh && onRefresh && (
              <Button
                onClick={onRefresh}
                disabled={isRefreshing}
                variant="default"
                className="min-w-[120px]"
                aria-label="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            )}
            
            {finalActions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  variant={action.variant || 'default'}
                  className="min-w-[120px]"
                  aria-label={action.label}
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                  {action.label}
                  {action.external && <ExternalLink className="h-3 w-3 ml-2" />}
                </Button>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </Card>
  );
}