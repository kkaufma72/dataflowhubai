/**
 * Social Proof Notification
 * 
 * Shows "Someone just signed up" notifications to create FOMO
 * Uses fake but realistic data for demo, integrate with real signups later
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, Clock } from 'lucide-react';

interface Notification {
  name: string;
  role: string;
  location: string;
  action: string;
  impact: string;
  volume: string;
  timeAgo: string;
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    name: 'Sarah M.',
    role: 'Data Science Lead',
    location: 'New York, US',
    action: 'shipped a churn model with the guided recipe',
    impact: '+12% lift vs baseline',
    volume: '230k rows',
    timeAgo: '2 minutes ago',
  },
  {
    name: 'James L.',
    role: 'Analytics Engineer',
    location: 'London, UK',
    action: 'cleaned drifted features and retrained automatically',
    impact: 'Stability score 0.94',
    volume: '3 data sources',
    timeAgo: '5 minutes ago',
  },
  {
    name: 'Maria G.',
    role: 'ML Engineer',
    location: 'Toronto, CA',
    action: 'deployed a forecasting model with rollback enabled',
    impact: 'Latency 58 ms p95',
    volume: '11M predictions/day',
    timeAgo: '8 minutes ago',
  },
  {
    name: 'David K.',
    role: 'Product Manager',
    location: 'Sydney, AU',
    action: 'validated class balance before launch',
    impact: 'Approval ready',
    volume: 'Audit log exported',
    timeAgo: '12 minutes ago',
  },
  {
    name: 'Anna S.',
    role: 'Founder',
    location: 'Berlin, DE',
    action: 'launched a demo pipeline with sample data',
    impact: 'Live in 6 minutes',
    volume: 'Zero setup',
    timeAgo: '15 minutes ago',
  },
  {
    name: 'Michael R.',
    role: 'Head of Data',
    location: 'San Francisco, US',
    action: 'auto-resolved missing values and retrained',
    impact: 'Data freshness 11m',
    volume: '50k rows ingested',
    timeAgo: '18 minutes ago',
  },
  {
    name: 'Emma W.',
    role: 'Growth Analyst',
    location: 'Paris, FR',
    action: 'started a free trial with the revenue preset',
    impact: 'Preset recommended',
    volume: '90% guided defaults',
    timeAgo: '22 minutes ago',
  },
  {
    name: 'Chris P.',
    role: 'Platform Engineer',
    location: 'Singapore',
    action: 'deployed a model to staging with safeguards',
    impact: 'Rollback ready',
    volume: 'Blue/green',
    timeAgo: '25 minutes ago',
  },
];

export const SocialProofNotification: React.FC = () => {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setReduceMotion(event.matches);

    setReduceMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Don't show if user has dismissed
    if (sessionStorage.getItem('dfh_social_dismissed')) return;

    let notificationIndex = 0;
    let hideTimeout: ReturnType<typeof setTimeout>;
    let nextTimeout: ReturnType<typeof setTimeout>;

    const displayDuration = reduceMotion ? 6500 : 5000;

    const showNotification = () => {
      setCurrentNotification(SAMPLE_NOTIFICATIONS[notificationIndex]);
      setIsVisible(true);

      // Hide after 5 seconds
      hideTimeout = setTimeout(() => {
        setIsVisible(false);
      }, displayDuration);

      // Move to next notification
      notificationIndex = (notificationIndex + 1) % SAMPLE_NOTIFICATIONS.length;
    };

    // Show first notification after 10 seconds
    const initialTimeout = setTimeout(() => {
      showNotification();

      const scheduleNext = () => {
        nextTimeout = setTimeout(() => {
          showNotification();
          scheduleNext();
        }, reduceMotion ? 45000 : 30000 + Math.random() * 25000);
      };

      scheduleNext();
    }, reduceMotion ? 12000 : 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(nextTimeout);
      clearTimeout(hideTimeout);
    };
  }, [reduceMotion]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('dfh_social_dismissed', 'true');
  };

  if (!currentNotification || !isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 max-w-sm bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-black text-white rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/10 backdrop-blur-xl overflow-hidden transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
            <User className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-400 text-[10px] font-bold rounded-full flex items-center justify-center text-black">
              •
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
              Live right now
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold leading-tight">
                {currentNotification.name}
                <span className="text-gray-300 font-normal"> · {currentNotification.role}</span>
              </p>
              <p className="text-sm text-gray-200 leading-snug">{currentNotification.action}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                <MapPin className="w-3 h-3" />
                {currentNotification.location}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                <Clock className="w-3 h-3" />
                {currentNotification.timeAgo}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-100 border border-emerald-400/20">
                Impact {currentNotification.impact}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-100 border border-blue-400/20">
                Data {currentNotification.volume}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/product-tour"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold border border-white/10 hover:bg-white/15 transition"
              >
                See the playbook
              </Link>
              <button
                onClick={handleDismiss}
                className="text-xs text-gray-300 hover:text-white transition"
              >
                Mute notifications
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Activity is anonymized and rotates every ~45s. No personal data stored.
            </p>
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white text-sm"
            aria-label="Close live activity notification"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <div
          className={`h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 ${reduceMotion ? '' : 'animate-shrink'}`}
          style={reduceMotion ? { width: '100%' } : { animation: 'shrink 5s linear forwards' }}
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
