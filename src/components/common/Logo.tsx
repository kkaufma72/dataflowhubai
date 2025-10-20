import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'horizontal';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'horizontal', 
  className = '',
  size = 'md',
  showTagline = false
}) => {
  const sizes = {
    sm: { icon: 32, text: 'text-lg', tagline: 'text-xs' },
    md: { icon: 40, text: 'text-xl', tagline: 'text-sm' },
    lg: { icon: 56, text: 'text-2xl', tagline: 'text-base' }
  };

  const currentSize = sizes[size];

  // Icon Only
  if (variant === 'icon') {
    return (
      <svg 
        viewBox="0 0 100 100" 
        className={className}
        style={{ width: currentSize.icon, height: currentSize.icon }}
      >
        <defs>
          <linearGradient id="gradient-icon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        <g transform="translate(50, 50) scale(0.65)">
          <path d="M 0,-60 L 52,-30 L 52,30 L 0,60 L -52,30 L -52,-30 Z" 
                fill="none" 
                stroke="url(#gradient-icon)" 
                strokeWidth="4"
                strokeLinejoin="miter"/>
          
          <line x1="-35" y1="-20" x2="0" y2="0" stroke="url(#gradient-icon)" strokeWidth="2.5" opacity="0.4"/>
          <line x1="35" y1="-20" x2="0" y2="0" stroke="url(#gradient-icon)" strokeWidth="2.5" opacity="0.4"/>
          <line x1="-35" y1="20" x2="0" y2="0" stroke="url(#gradient-icon)" strokeWidth="2.5" opacity="0.4"/>
          <line x1="35" y1="20" x2="0" y2="0" stroke="url(#gradient-icon)" strokeWidth="2.5" opacity="0.4"/>
          <line x1="0" y1="-40" x2="0" y2="0" stroke="url(#gradient-icon)" strokeWidth="2.5" opacity="0.4"/>
          <line x1="0" y1="40" x2="0" y2="0" stroke="url(#gradient-icon)" strokeWidth="2.5" opacity="0.4"/>
          
          <circle cx="-35" cy="-20" r="7" fill="white" stroke="url(#gradient-icon)" strokeWidth="2.5"/>
          <circle cx="35" cy="-20" r="7" fill="white" stroke="url(#gradient-icon)" strokeWidth="2.5"/>
          <circle cx="-35" cy="20" r="7" fill="white" stroke="url(#gradient-icon)" strokeWidth="2.5"/>
          <circle cx="35" cy="20" r="7" fill="white" stroke="url(#gradient-icon)" strokeWidth="2.5"/>
          <circle cx="0" cy="-40" r="7" fill="white" stroke="url(#gradient-icon)" strokeWidth="2.5"/>
          <circle cx="0" cy="40" r="7" fill="white" stroke="url(#gradient-icon)" strokeWidth="2.5"/>
          
          <circle cx="0" cy="0" r="16" fill="url(#gradient-icon)"/>
          <circle cx="0" cy="0" r="10" fill="white" opacity="0.35"/>
          
          <g transform="translate(48, -43)">
            <path d="M -9,-9 L 9,-9 L 9,5 L 2,5 L 0,9 L 0,5 L -9,5 Z" 
                  fill="none" 
                  stroke="url(#gradient-icon)" 
                  strokeWidth="2"
                  opacity="0.7"/>
          </g>
        </g>
      </svg>
    );
  }

  // Horizontal (default)
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        style={{ width: currentSize.icon, height: currentSize.icon }}
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="gradient-horiz" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        <g transform="translate(50, 50) scale(0.65)">
          <path d="M 0,-60 L 52,-30 L 52,30 L 0,60 L -52,30 L -52,-30 Z" 
                fill="none" 
                stroke="url(#gradient-horiz)" 
                strokeWidth="4"
                strokeLinejoin="miter"/>
          
          <line x1="-35" y1="-20" x2="0" y2="0" stroke="url(#gradient-horiz)" strokeWidth="2.5" opacity="0.4"/>
          <line x1="35" y1="-20" x2="0" y2="0" stroke="url(#gradient-horiz)" strokeWidth="2.5" opacity="0.4"/>
          <line x1="-35" y1="20" x2="0" y2="0" stroke="url(#gradient-horiz)" strokeWidth="2.5" opacity="0.4"/>
          <line x1="35" y1="20" x2="0" y2="0" stroke="url(#gradient-horiz)" strokeWidth="2.5" opacity="0.4"/>
          <line x1="0" y1="-40" x2="0" y2="0" stroke="url(#gradient-horiz)" strokeWidth="2.5" opacity="0.4"/>
          <line x1="0" y1="40" x2="0" y2="0" stroke="url(#gradient-horiz)" strokeWidth="2.5" opacity="0.4"/>
          
          <circle cx="-35" cy="-20" r="7" fill="white" stroke="url(#gradient-horiz)" strokeWidth="2.5"/>
          <circle cx="35" cy="-20" r="7" fill="white" stroke="url(#gradient-horiz)" strokeWidth="2.5"/>
          <circle cx="-35" cy="20" r="7" fill="white" stroke="url(#gradient-horiz)" strokeWidth="2.5"/>
          <circle cx="35" cy="20" r="7" fill="white" stroke="url(#gradient-horiz)" strokeWidth="2.5"/>
          <circle cx="0" cy="-40" r="7" fill="white" stroke="url(#gradient-horiz)" strokeWidth="2.5"/>
          <circle cx="0" cy="40" r="7" fill="white" stroke="url(#gradient-horiz)" strokeWidth="2.5"/>
          
          <circle cx="0" cy="0" r="16" fill="url(#gradient-horiz)"/>
          <circle cx="0" cy="0" r="10" fill="white" opacity="0.35"/>
          
          <g transform="translate(48, -43)">
            <path d="M -9,-9 L 9,-9 L 9,5 L 2,5 L 0,9 L 0,5 L -9,5 Z" 
                  fill="none" 
                  stroke="url(#gradient-horiz)" 
                  strokeWidth="2"
                  opacity="0.7"/>
          </g>
        </g>
      </svg>
      
      <div className="flex flex-col">
        <span className={`${currentSize.text} font-semibold text-gray-900 dark:text-white tracking-tight`}>
          DataFlowHub
        </span>
        {showTagline && (
          <span className={`${currentSize.tagline} font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase`}>
            AI Platform
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;