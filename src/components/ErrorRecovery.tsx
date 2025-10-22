import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import { EnhancedError } from '../types/errors';

interface ErrorRecoveryProps {
  error: EnhancedError;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  onDismiss,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const getIcon = () => {
    switch (error.type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getColorClasses = () => {
    switch (error.type) {
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          secondaryButton: 'bg-red-100 hover:bg-red-200 text-red-700',
          linkButton: 'text-red-600 hover:text-red-800',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          secondaryButton: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700',
          linkButton: 'text-yellow-600 hover:text-yellow-800',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          title: 'text-blue-800',
          message: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          secondaryButton: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
          linkButton: 'text-blue-600 hover:text-blue-800',
        };
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          secondaryButton: 'bg-red-100 hover:bg-red-200 text-red-700',
          linkButton: 'text-red-600 hover:text-red-800',
        };
    }
  };

  const colors = getColorClasses();

  const handleAction = async (action: () => void | Promise<void>, label: string) => {
    setIsLoading(label);
    try {
      await action();
    } catch (err) {
      console.error('Recovery action failed:', err);
    } finally {
      setIsLoading(null);
    }
  };

  const getButtonClass = (variant: string = 'primary') => {
    const baseClass = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    switch (variant) {
      case 'primary':
        return `${baseClass} ${colors.button}`;
      case 'secondary':
        return `${baseClass} ${colors.secondaryButton}`;
      case 'link':
        return `${baseClass} ${colors.linkButton} bg-transparent hover:bg-transparent underline`;
      default:
        return `${baseClass} ${colors.button}`;
    }
  };

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className={`text-sm font-semibold ${colors.title} mb-1`}>
                {error.title}
              </h3>
              <p className={`text-sm ${colors.message}`}>
                {error.message}
              </p>

              {error.code && (
                <p className={`text-xs ${colors.message} mt-1 opacity-75`}>
                  Error code: {error.code}
                </p>
              )}
            </div>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors ${colors.title}`}
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Recovery Actions */}
          {error.recoveryActions && error.recoveryActions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {error.recoveryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(action.action, action.label)}
                  disabled={isLoading !== null}
                  className={getButtonClass(action.variant)}
                >
                  {isLoading === action.label ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    action.label
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Technical Details (collapsible) */}
          {error.technicalDetails && (
            <div className="mt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`flex items-center gap-1 text-xs ${colors.linkButton} hover:underline`}
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Hide Technical Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show Technical Details
                  </>
                )}
              </button>

              {showDetails && (
                <pre className="mt-2 text-xs bg-black/5 p-3 rounded overflow-auto max-h-40">
                  {error.technicalDetails}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook for using error recovery in components
export const useErrorRecovery = () => {
  const [error, setError] = useState<EnhancedError | null>(null);

  const showError = (enhancedError: EnhancedError) => {
    setError(enhancedError);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    showError,
    clearError,
  };
};
