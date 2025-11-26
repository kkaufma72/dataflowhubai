/**
 * Exit Intent Popup
 * 
 * Captures leaving visitors with a compelling offer
 */

import React, { useState, useEffect } from 'react';
import { X, Gift, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExitIntentPopupProps {
  onClose: () => void;
}

export const ExitIntentPopup: React.FC<ExitIntentPopupProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    
    // Store email for follow-up (you can integrate with your email service)
    try {
      // TODO: Send to your email service (Mailchimp, SendGrid, etc.)
      console.log('Captured email:', email);
      localStorage.setItem('dfh_captured_email', email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to capture email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-popIn">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">You're on the list!</h3>
          <p className="text-gray-600 mb-6">
            Check your inbox for your free data analysis template and exclusive tips.
          </p>
          <Link
            to="/signin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
          >
            Start Free Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-popIn relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="w-8 h-8" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              FREE GIFT
            </span>
          </div>
          <h2 className="text-2xl font-bold">Wait! Don't leave empty-handed</h2>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-gray-600 mb-6">
            Get our <strong>free Data Analysis Template</strong> + exclusive tips on how top companies use AI to save 10+ hours per week.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Sending...' : 'Get My Free Template'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-4 text-center">
            No spam, ever. Unsubscribe anytime.
          </p>

          {/* Social Proof */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>✓ 2,500+ downloads</span>
            <span>•</span>
            <span>✓ 4.9/5 rating</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to detect exit intent
export const useExitIntent = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Don't show if already shown this session
    if (sessionStorage.getItem('dfh_exit_shown')) {
      setHasShown(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from top of page
      if (e.clientY <= 0 && !hasShown) {
        setShowPopup(true);
        setHasShown(true);
        sessionStorage.setItem('dfh_exit_shown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown]);

  return { showPopup, setShowPopup };
};

export default ExitIntentPopup;

