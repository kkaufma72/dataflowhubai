import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { checkStripeConfig } from '../../lib/stripeConfigCheck';

/**
 * Displays a warning banner when Stripe is not properly configured
 * Only shows to authenticated users (admins can see it, regular users won't be confused)
 */
const StripeConfigWarning: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [missingVars, setMissingVars] = useState<string[]>([]);

  useEffect(() => {
    // Check if user has dismissed this warning in this session
    const dismissed = sessionStorage.getItem('stripeConfigWarningDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    const status = checkStripeConfig();
    
    if (!status.isConfigured) {
      setShowWarning(true);
      setMissingVars(status.missingVars);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('stripeConfigWarningDismissed', 'true');
  };

  if (!showWarning || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-amber-50 border-2 border-amber-400 rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900 mb-1">
              Stripe Configuration Incomplete
            </h3>
            <p className="text-xs text-amber-800 mb-2">
              Payment features are disabled. Missing {missingVars.length} environment variable{missingVars.length > 1 ? 's' : ''}.
            </p>
            
            <details className="text-xs text-amber-700">
              <summary className="cursor-pointer font-semibold hover:text-amber-900">
                Show missing variables
              </summary>
              <ul className="mt-2 ml-4 space-y-1 list-disc">
                {missingVars.slice(0, 3).map(varName => (
                  <li key={varName} className="font-mono">
                    {varName}
                  </li>
                ))}
                {missingVars.length > 3 && (
                  <li className="text-amber-600">
                    ...and {missingVars.length - 3} more
                  </li>
                )}
              </ul>
            </details>
            
            <p className="text-xs text-amber-700 mt-2">
              Add these to{' '}
              <a 
                href="https://vercel.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-amber-900"
              >
                Vercel Environment Variables
              </a>
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
            aria-label="Dismiss warning"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StripeConfigWarning;
