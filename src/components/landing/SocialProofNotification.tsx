/**
 * Social Proof Notification
 * 
 * Shows "Someone just signed up" notifications to create FOMO
 * Uses fake but realistic data for demo, integrate with real signups later
 */

import React, { useState, useEffect } from 'react';
import { User, MapPin, Clock } from 'lucide-react';

interface Notification {
  name: string;
  location: string;
  action: string;
  timeAgo: string;
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  { name: 'Sarah M.', location: 'New York, US', action: 'started a free trial', timeAgo: '2 minutes ago' },
  { name: 'James L.', location: 'London, UK', action: 'uploaded their first dataset', timeAgo: '5 minutes ago' },
  { name: 'Maria G.', location: 'Toronto, CA', action: 'trained an ML model', timeAgo: '8 minutes ago' },
  { name: 'David K.', location: 'Sydney, AU', action: 'upgraded to Pro', timeAgo: '12 minutes ago' },
  { name: 'Anna S.', location: 'Berlin, DE', action: 'started a free trial', timeAgo: '15 minutes ago' },
  { name: 'Michael R.', location: 'San Francisco, US', action: 'analyzed 50k rows', timeAgo: '18 minutes ago' },
  { name: 'Emma W.', location: 'Paris, FR', action: 'started a free trial', timeAgo: '22 minutes ago' },
  { name: 'Chris P.', location: 'Singapore', action: 'deployed a model', timeAgo: '25 minutes ago' },
];

export const SocialProofNotification: React.FC = () => {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Don't show if user has dismissed
    if (sessionStorage.getItem('dfh_social_dismissed')) return;

    let notificationIndex = 0;

    const showNotification = () => {
      setCurrentNotification(SAMPLE_NOTIFICATIONS[notificationIndex]);
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      // Move to next notification
      notificationIndex = (notificationIndex + 1) % SAMPLE_NOTIFICATIONS.length;
    };

    // Show first notification after 10 seconds
    const initialTimeout = setTimeout(showNotification, 10000);

    // Show subsequent notifications every 30-60 seconds
    const interval = setInterval(() => {
      showNotification();
    }, 30000 + Math.random() * 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('dfh_social_dismissed', 'true');
  };

  if (!currentNotification || !isVisible) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 z-40 max-w-sm bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">{currentNotification.name}</span>
              {' '}{currentNotification.action}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {currentNotification.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {currentNotification.timeAgo}
              </span>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-shrink"
          style={{ animation: 'shrink 5s linear forwards' }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default SocialProofNotification;

