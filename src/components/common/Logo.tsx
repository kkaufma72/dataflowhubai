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

  // New DataFlowHub.AI Logo - Icon with data flow connections
  const DataFlowIcon = () => (
    <svg 
      viewBox="0 0 800 800" 
      className={className}
      style={{ width: currentSize.icon, height: currentSize.icon }}
    >
      <defs>
        <linearGradient id="df-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#5B21B6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Main D shape */}
      <path d="M 100 200 L 100 650 L 350 650 C 500 650 600 550 600 425 C 600 300 500 200 350 200 Z M 200 300 L 350 300 C 430 300 480 350 480 425 C 480 500 430 550 350 550 L 200 550 Z" 
            fill="url(#df-gradient)"/>
      
      {/* Data flow connection lines */}
      <line x1="500" y1="250" x2="650" y2="250" stroke="url(#df-gradient)" strokeWidth="8"/>
      <line x1="500" y1="300" x2="650" y2="300" stroke="url(#df-gradient)" strokeWidth="8"/>
      <line x1="500" y1="350" x2="650" y2="350" stroke="url(#df-gradient)" strokeWidth="8"/>
      <line x1="500" y1="400" x2="650" y2="400" stroke="url(#df-gradient)" strokeWidth="8"/>
      <line x1="500" y1="450" x2="650" y2="450" stroke="url(#df-gradient)" strokeWidth="8"/>
      <line x1="500" y1="500" x2="650" y2="500" stroke="url(#df-gradient)" strokeWidth="8"/>
      <line x1="500" y1="550" x2="650" y2="550" stroke="url(#df-gradient)" strokeWidth="8"/>
      <line x1="500" y1="600" x2="650" y2="600" stroke="url(#df-gradient)" strokeWidth="8"/>
      
      {/* Connection nodes */}
      <circle cx="650" cy="250" r="15" fill="url(#df-gradient)"/>
      <circle cx="650" cy="300" r="15" fill="url(#df-gradient)"/>
      <circle cx="650" cy="350" r="15" fill="url(#df-gradient)"/>
      <circle cx="650" cy="400" r="15" fill="url(#df-gradient)"/>
      <circle cx="650" cy="450" r="15" fill="url(#df-gradient)"/>
      <circle cx="650" cy="500" r="15" fill="url(#df-gradient)"/>
      <circle cx="650" cy="550" r="15" fill="url(#df-gradient)"/>
      <circle cx="650" cy="600" r="15" fill="url(#df-gradient)"/>
    </svg>
  );

  // Icon Only
  if (variant === 'icon') {
    return <DataFlowIcon />;
  }

  // Horizontal (default)
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <svg 
        viewBox="0 0 800 800" 
        style={{ width: currentSize.icon, height: currentSize.icon }}
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="df-gradient-horiz" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#5B21B6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        {/* Main D shape */}
        <path d="M 100 200 L 100 650 L 350 650 C 500 650 600 550 600 425 C 600 300 500 200 350 200 Z M 200 300 L 350 300 C 430 300 480 350 480 425 C 480 500 430 550 350 550 L 200 550 Z" 
              fill="url(#df-gradient-horiz)"/>
        
        {/* Data flow connection lines */}
        <line x1="500" y1="250" x2="650" y2="250" stroke="url(#df-gradient-horiz)" strokeWidth="8"/>
        <line x1="500" y1="300" x2="650" y2="300" stroke="url(#df-gradient-horiz)" strokeWidth="8"/>
        <line x1="500" y1="350" x2="650" y2="350" stroke="url(#df-gradient-horiz)" strokeWidth="8"/>
        <line x1="500" y1="400" x2="650" y2="400" stroke="url(#df-gradient-horiz)" strokeWidth="8"/>
        <line x1="500" y1="450" x2="650" y2="450" stroke="url(#df-gradient-horiz)" strokeWidth="8"/>
        <line x1="500" y1="500" x2="650" y2="500" stroke="url(#df-gradient-horiz)" strokeWidth="8"/>
        <line x1="500" y1="550" x2="650" y2="550" stroke="url(#df-gradient-horiz)" strokeWidth="8"/>
        <line x1="500" y1="600" x2="650" y2="600" stroke="url(#df-gradient-horiz)" strokeWidth="8"/>
        
        {/* Connection nodes */}
        <circle cx="650" cy="250" r="15" fill="url(#df-gradient-horiz)"/>
        <circle cx="650" cy="300" r="15" fill="url(#df-gradient-horiz)"/>
        <circle cx="650" cy="350" r="15" fill="url(#df-gradient-horiz)"/>
        <circle cx="650" cy="400" r="15" fill="url(#df-gradient-horiz)"/>
        <circle cx="650" cy="450" r="15" fill="url(#df-gradient-horiz)"/>
        <circle cx="650" cy="500" r="15" fill="url(#df-gradient-horiz)"/>
        <circle cx="650" cy="550" r="15" fill="url(#df-gradient-horiz)"/>
        <circle cx="650" cy="600" r="15" fill="url(#df-gradient-horiz)"/>
      </svg>
      
      <div className="flex flex-col">
        <span className={`${currentSize.text} font-semibold text-gray-900 dark:text-white tracking-tight`}>
          DataFlowHub.AI
        </span>
        {showTagline && (
          <span className={`${currentSize.tagline} font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase`}>
            Enterprise AutoML Platform
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;