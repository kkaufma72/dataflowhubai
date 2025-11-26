import React from 'react';
import { Shield, Lock, CheckCircle, Award, Clock } from 'lucide-react';

interface TrustBadgesProps {
  variant?: 'default' | 'compact' | 'landing';
  className?: string;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ 
  variant = 'default',
  className = '' 
}) => {
  const badges = [
    {
      icon: Shield,
      title: 'SOC 2 Type II',
      subtitle: 'In Progress',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
      subtitleColor: 'text-green-700'
    },
    {
      icon: Lock,
      title: 'GDPR Compliant',
      subtitle: 'Privacy Protected',
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
      subtitleColor: 'text-blue-700'
    },
    {
      icon: CheckCircle,
      title: '256-bit Encryption',
      subtitle: 'Bank-Grade Security',
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-900',
      subtitleColor: 'text-purple-700'
    },
    {
      icon: Award,
      title: '99.9% Uptime',
      subtitle: 'Always Available',
      color: 'amber',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-900',
      subtitleColor: 'text-amber-700'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      subtitle: 'We\'re Here to Help',
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      iconColor: 'text-indigo-600',
      textColor: 'text-indigo-900',
      subtitleColor: 'text-indigo-700'
    }
  ];

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-4 flex-wrap ${className}`}>
        {badges.slice(0, 3).map((badge, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <badge.icon className={`w-4 h-4 ${badge.iconColor}`} />
            <span className="text-sm font-medium text-gray-700">{badge.title}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'landing') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 ${className}`}>
        {badges.map((badge, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col items-center text-center p-4 ${badge.bgColor} border ${badge.borderColor} rounded-xl hover:shadow-md transition-all`}
          >
            <badge.icon className={`w-8 h-8 ${badge.iconColor} mb-2`} />
            <p className={`text-xs font-bold ${badge.textColor}`}>{badge.title}</p>
            <p className={`text-xs ${badge.subtitleColor} mt-0.5`}>{badge.subtitle}</p>
          </div>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-4 flex-wrap ${className}`}>
      {badges.map((badge, idx) => (
        <div 
          key={idx} 
          className={`flex items-center gap-2 px-4 py-2 ${badge.bgColor} border ${badge.borderColor} rounded-lg hover:shadow-md transition-shadow`}
        >
          <badge.icon className={`w-5 h-5 ${badge.iconColor}`} />
          <div>
            <p className={`text-sm font-bold ${badge.textColor}`}>{badge.title}</p>
            <p className={`text-xs ${badge.subtitleColor}`}>{badge.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrustBadges;
