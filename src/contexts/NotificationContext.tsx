/**
 * Notification Context
 * Global state management for notifications
 */
import { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '@/components/guardian/NotificationCenter';

type NotificationContextType = ReturnType<typeof useNotifications>;

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notifications = useNotifications();
  
  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}

