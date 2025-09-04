import React from 'react';

interface TabContentProps {
  children: React.ReactNode;
}

export const TabContent: React.FC<TabContentProps> = ({ children }) => {
  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};