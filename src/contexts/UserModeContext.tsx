/**
 * User Mode Context
 * Global state management for Beginner/Expert mode
 */
import { createContext, useContext, ReactNode } from 'react';
import { useUserMode, UserMode } from '@/components/guardian/UserModeToggle';

interface UserModeContextType {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  isBeginner: boolean;
  isExpert: boolean;
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined);

export function UserModeProvider({ children }: { children: ReactNode }) {
  const { mode, setMode } = useUserMode();
  
  return (
    <UserModeContext.Provider 
      value={{ 
        mode, 
        setMode,
        isBeginner: mode === 'beginner',
        isExpert: mode === 'expert',
      }}
    >
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserModeContext() {
  const context = useContext(UserModeContext);
  if (!context) {
    throw new Error('useUserModeContext must be used within UserModeProvider');
  }
  return context;
}

