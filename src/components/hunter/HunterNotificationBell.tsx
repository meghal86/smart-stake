import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useHunterAlerts } from '@/hooks/useHunterAlerts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function HunterNotificationBell() {
  const { alerts, unreadCount, markAsRead, markAllAsRead, dismissAlert } = useHunterAlerts();
  const navigate = useNavigate();

  const recentAlerts = alerts.slice(0, 5);

  const handleAlertClick = (alert: typeof alerts[0]) => {
    markAsRead(alert.id);
    if (alert.actionUrl) {
      navigate(alert.actionUrl);
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'low':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'new_quest':
        return '🎯';
      case 'expiring_soon':
        return '⏰';
      case 'reward_ready':
        return '🎁';
      case 'quest_update':
        return '📝';
      default:
        return '🔔';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg hover:bg-slate-800/50"
        >
          <motion.div
            animate={unreadCount > 0 ? {
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{
              duration: 0.5,
              repeat: unreadCount > 0 ? Infinity : 0,
              repeatDelay: 3
            }}
          >
            <Bell className="w-4 h-4" />
          </motion.div>

          {/* Unread Badge */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "w-80 md:w-96 p-0",
          "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
          "border border-white/10 dark:border-slate-800/50",
          "shadow-2xl"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Alerts List */}
        <div className="max-h-[400px] overflow-y-auto">
          {recentAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/30 flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400 text-center">
                No notifications yet
              </p>
              <p className="text-xs text-slate-500 text-center mt-1">
                We'll notify you about new opportunities
              </p>
            </div>
          ) : (
            recentAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <DropdownMenuItem
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 cursor-pointer",
                    "border-b border-slate-800/30 last:border-0",
                    !alert.isRead && "bg-emerald-500/5"
                  )}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {/* Icon */}
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg border flex-shrink-0",
                        getPriorityColor(alert.priority)
                      )}>
                        <span className="text-sm">{getAlertIcon(alert.type)}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={cn(
                            "text-sm font-medium truncate",
                            !alert.isRead && "text-slate-100"
                          )}>
                            {alert.title}
                          </h4>
                          {!alert.isRead && (
                            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                          </span>
                          {alert.actionLabel && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-xs text-emerald-400 flex items-center gap-1">
                                {alert.actionLabel}
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dismiss Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissAlert(alert.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        {recentAlerts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-xs h-8 text-emerald-400 hover:text-emerald-300"
                onClick={() => navigate('/hunter/notifications')}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



