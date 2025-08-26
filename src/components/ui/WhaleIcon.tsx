import React from 'react';

interface WhaleIconProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const WhaleIcon: React.FC<WhaleIconProps> = ({ 
  size = 40, 
  className = "",
  showText = false 
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Whale Body */}
        <ellipse
          cx="35"
          cy="50"
          rx="20"
          ry="12"
          fill="#1E3A8A"
        />
        
        {/* Whale Head */}
        <ellipse
          cx="20"
          cy="50"
          rx="15"
          ry="10"
          fill="#1E3A8A"
        />
        
        {/* Whale Eye */}
        <circle
          cx="15"
          cy="47"
          r="2"
          fill="#FFFFFF"
        />
        
        {/* Whale Tail */}
        <path
          d="M 50 50 Q 65 42 70 50 Q 65 58 50 50"
          fill="#1E3A8A"
        />
        
        {/* Waves */}
        <path
          d="M 70 50 Q 80 45 90 50"
          stroke="#14B8A6"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        
        <path
          d="M 72 58 Q 82 53 92 58"
          stroke="#14B8A6"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        
        <path
          d="M 72 42 Q 82 37 92 42"
          stroke="#14B8A6"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      
      {showText && (
        <span className="font-bold text-lg text-foreground">
          WhalePlus
        </span>
      )}
    </div>
  );
};

export default WhaleIcon;