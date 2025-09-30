import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CompactViewContextType {
  isCompact: boolean;
  toggleCompact: () => void;
}

const CompactViewContext = createContext<CompactViewContextType | undefined>(undefined);

export function CompactViewProvider({ children }: { children: ReactNode }) {
  const [isCompact, setIsCompact] = useState(() => {
    const saved = localStorage.getItem('whale-compact-view');
    return saved === 'true';
  });

  const toggleCompact = () => {
    setIsCompact(prev => {
      const newValue = !prev;
      localStorage.setItem('whale-compact-view', newValue.toString());
      return newValue;
    });
  };

  useEffect(() => {
    // Apply global CSS class for compact mode
    document.documentElement.classList.toggle('compact-mode', isCompact);
  }, [isCompact]);

  return (
    <CompactViewContext.Provider value={{ isCompact, toggleCompact }}>
      {children}
    </CompactViewContext.Provider>
  );
}

export function useCompactView() {
  const context = useContext(CompactViewContext);
  if (!context) {
    throw new Error('useCompactView must be used within CompactViewProvider');
  }
  return context;
}