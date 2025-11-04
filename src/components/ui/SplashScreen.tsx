import React, { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/Logo';

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
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 opacity-0 transition-opacity duration-500 pointer-events-none" style={{ backgroundColor: '#0A1A2F' }}>
        <img 
          src="/hero_logo_1024.png"
          alt="AlphaWhale Logo"
          className="h-64 w-64 mb-6 drop-shadow-lg object-contain"
        />
        <h1 className="text-5xl font-bold text-white mb-3">AlphaWhale</h1>
        <p className="text-xl text-gray-300">Master the DeFi Waves</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 transition-opacity duration-500" style={{ backgroundColor: '#0A1A2F' }}>
      <div className="animate-pulse flex flex-col items-center">
        <img 
          src="/hero_logo_1024.png"
          alt="AlphaWhale Logo"
          className="h-64 w-64 mb-6 drop-shadow-lg object-contain"
        />
        <h1 className="text-5xl font-bold text-white mb-3">AlphaWhale</h1>
        <p className="text-xl text-gray-300">Master the DeFi Waves</p>
      </div>
    </div>
  );
};

export default SplashScreen;
