// Success Animation Component - Delightful Microinteractions
import React, { useEffect, useState } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface SuccessAnimationProps {
  show: boolean;
  message: string;
  onComplete?: () => void;
  duration?: number;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  show,
  message,
  onComplete,
  duration = 2000
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
      <div className="relative">
        {/* Expanding circle */}
        <div className="absolute inset-0 flex items-center justify-center animate-ping">
          <div className="w-20 h-20 bg-green-500/30 rounded-full" />
        </div>

        {/* Main success icon */}
        <div className="relative bg-white rounded-full p-6 shadow-2xl animate-bounce-in">
          <CheckCircle className="w-16 h-16 text-green-500" strokeWidth={2.5} />
        </div>

        {/* Sparkles */}
        <div className="absolute -top-2 -right-2 animate-spin-slow">
          <Sparkles className="w-8 h-8 text-yellow-400" />
        </div>
        <div className="absolute -bottom-2 -left-2 animate-pulse">
          <Sparkles className="w-6 h-6 text-primary-400" />
        </div>
      </div>

      {/* Message */}
      <div className="absolute bottom-1/3 text-center animate-fade-in-up">
        <p className="text-2xl font-bold text-gray-900 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
          ✨ {message}
        </p>
      </div>
    </div>
  );
};

export default SuccessAnimation;

// Add animations to global CSS if not already present
const animationStyles = `
  @keyframes bounce-in {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes fade-in-up {
    0% {
      transform: translateY(20px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes spin-slow {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .animate-bounce-in {
    animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out 0.3s both;
  }

  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}
