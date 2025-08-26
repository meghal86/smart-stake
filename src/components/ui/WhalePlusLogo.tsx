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
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Background (transparent) */}
        <rect width="512" height="512" fill="transparent" />
        
        {/* Title Text - WhalePlus */}
        <text
          x="256"
          y="80"
          textAnchor="middle"
          fontSize="48"
          fontWeight="bold"
          fill="#FFFFFF"
          fontFamily="Arial, sans-serif"
        >
          WhalePlus
        </text>
        
        {/* Whale Body */}
        <ellipse
          cx="180"
          cy="256"
          rx="80"
          ry="40"
          fill="#1E3A8A"
        />
        
        {/* Whale Head */}
        <ellipse
          cx="120"
          cy="256"
          rx="50"
          ry="35"
          fill="#1E3A8A"
        />
        
        {/* Whale Eye */}
        <circle
          cx="105"
          cy="245"
          r="8"
          fill="#FFFFFF"
        />
        <circle
          cx="108"
          cy="242"
          r="4"
          fill="#000000"
        />
        
        {/* Whale Tail */}
        <path
          d="M 240 256 Q 280 230 300 256 Q 280 282 240 256"
          fill="#1E3A8A"
        />
        
        {/* Wave 1 - Coming from tail */}
        <path
          d="M 300 256 Q 330 240 360 256 Q 390 272 420 256"
          stroke="#14B8A6"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Wave 2 - Second wave */}
        <path
          d="M 310 276 Q 340 260 370 276 Q 400 292 430 276"
          stroke="#14B8A6"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Wave 3 - Third wave */}
        <path
          d="M 320 236 Q 350 220 380 236 Q 410 252 440 236"
          stroke="#14B8A6"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Smaller decorative waves */}
        <path
          d="M 340 296 Q 360 285 380 296"
          stroke="#14B8A6"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        
        <path
          d="M 350 216 Q 370 205 390 216"
          stroke="#14B8A6"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Subtitle Text - Master the DeFi Waves */}
        <text
          x="256"
          y="420"
          textAnchor="middle"
          fontSize="24"
          fill="#FFFFFF"
          fontFamily="Arial, sans-serif"
        >
          Master the DeFi Waves
        </text>
      </svg>
    </div>
  );
};

export default WhalePlusLogo;