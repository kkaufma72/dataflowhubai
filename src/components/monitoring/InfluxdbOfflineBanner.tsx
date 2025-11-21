import React from 'react';

interface InfluxdbOfflineBannerProps {
  onRetry?: () => void;
  className?: string;
}

const InfluxdbOfflineBanner: React.FC<InfluxdbOfflineBannerProps> = ({ onRetry, className }) => {
  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 ${className || ''}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">
          Live metrics are temporarily unavailable (InfluxDB blocked by browser).
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-amber-700">
          <span>➜ Run the desktop app or</span>
          <span>➜ restart the Infra stack</span>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center text-xs font-semibold text-amber-800 underline"
        >
          Retry connection
        </button>
      )}
    </div>
  );
};

export default InfluxdbOfflineBanner;
