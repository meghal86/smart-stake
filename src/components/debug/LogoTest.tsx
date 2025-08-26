import React from 'react';

export const LogoTest = () => {
  return (
    <div className="fixed top-4 right-4 bg-red-500 p-4 rounded z-50">
      <h3 className="text-white font-bold mb-2">Logo Test</h3>
      <div className="flex gap-2">
        <div className="text-center">
          <img 
            src="/whaleplus-logo.png" 
            alt="Original" 
            className="w-16 h-16 border-2 border-white"
            onLoad={() => console.log('Logo loaded successfully!')}
            onError={() => console.log('Logo failed to load!')}
          />
          <p className="text-white text-xs">Original</p>
        </div>
        <div className="text-center">
          <img 
            src="/whaleplus-logo.png" 
            alt="Blended" 
            className="w-16 h-16 border-2 border-white mix-blend-multiply dark:mix-blend-screen"
            style={{ filter: 'contrast(1.2) brightness(1.1)' }}
          />
          <p className="text-white text-xs">Blended</p>
        </div>
      </div>
      <p className="text-white text-xs mt-2">White bg should be gone in "Blended"</p>
    </div>
  );
};