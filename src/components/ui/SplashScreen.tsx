import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 opacity-0 transition-opacity duration-500 pointer-events-none">
        <img 
          src="/whaleplus-logo.png" 
          alt="WhalePlus" 
          className="w-48 h-48 mb-6 drop-shadow-lg"
        />
        <h1 className="text-5xl font-bold text-foreground mb-3">WhalePlus</h1>
        <p className="text-xl text-muted-foreground">Master the DeFi Waves</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 transition-opacity duration-500">
      <div className="animate-pulse flex flex-col items-center">
        <img 
          src="/whaleplus-logo.png" 
          alt="WhalePlus" 
          className="w-48 h-48 mb-6 drop-shadow-lg"
        />
        <h1 className="text-5xl font-bold text-foreground mb-3">WhalePlus</h1>
        <p className="text-xl text-muted-foreground">Master the DeFi Waves</p>
      </div>
    </div>
  );
};

export default SplashScreen;