// Feature Discovery Tooltip Component
import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface FeatureTooltipProps {
  featureKey: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  showOnce?: boolean;
  delay?: number;
}

const FeatureTooltip: React.FC<FeatureTooltipProps> = ({
  featureKey,
  title,
  description,
  icon,
  position = 'bottom',
  actionLabel,
  onAction,
  children,
  showOnce = true,
  delay = 1000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = `feature-tooltip-${featureKey}`;

  useEffect(() => {
    // Check if already seen
    if (showOnce && localStorage.getItem(storageKey)) {
      return;
    }

    // Show after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [featureKey, showOnce, delay, storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (showOnce) {
      localStorage.setItem(storageKey, 'true');
    }
  };

  const handleAction = () => {
    handleDismiss();
    onAction?.();
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-indigo-600 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-indigo-600 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-indigo-600 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-indigo-600 border-t-transparent border-b-transparent border-l-transparent'
  };

  return (
    <div className="relative inline-block">
      {children}
      
      {isVisible && (
        <div 
          className={`absolute z-50 ${positionClasses[position]} animate-popIn`}
          style={{ width: '280px' }}
        >
          {/* Arrow */}
          <div className={`absolute w-0 h-0 border-8 ${arrowClasses[position]}`} />
          
          {/* Tooltip Content */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-2xl p-4 text-white">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {icon || <Sparkles className="w-5 h-5 text-yellow-300" />}
                <h4 className="font-semibold">{title}</h4>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-indigo-100 mb-3 leading-relaxed">
              {description}
            </p>

            {/* Action */}
            {actionLabel && (
              <button
                onClick={handleAction}
                className="flex items-center gap-2 w-full justify-center px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
              >
                {actionLabel}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Dismiss text */}
            {!actionLabel && (
              <button
                onClick={handleDismiss}
                className="text-xs text-indigo-200 hover:text-white transition-colors"
              >
                Got it, thanks!
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureTooltip;

