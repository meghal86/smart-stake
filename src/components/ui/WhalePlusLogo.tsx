import React from 'react';

interface WhalePlusLogoProps {
  size?: number;
  className?: string;
}

export const WhalePlusLogo: React.FC<WhalePlusLogoProps> = ({ 
  size = 512, 
  className = "" 
}) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src="/whaleplus-logo.svg"
        alt="WhalePlus Logo"
        width={size}
        height={size}
        className="object-contain drop-shadow-lg"
      />
    </div>
  );
};

export default WhalePlusLogo;