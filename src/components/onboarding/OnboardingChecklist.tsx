/**
 * Onboarding Checklist Component
 * 
 * Shows user their activation progress with:
 * - Visual progress bar
 * - Milestone checklist
 * - Next action recommendation
 * - Celebration on completion
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Gift,
  ArrowRight,
  X,
  Trophy,
  Rocket
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  getMilestonesWithStatus, 
  getActivationStatus,
  getNextAction,
  ActivationMilestone 
} from '../../lib/activationTracking';

interface OnboardingChecklistProps {
  variant?: 'sidebar' | 'modal' | 'banner';
  onClose?: () => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ 
  variant = 'sidebar',
  onClose 
}) => {
  const [milestones, setMilestones] = useState<ActivationMilestone[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activation, setActivation] = useState(getActivationStatus());

  useEffect(() => {
    setMilestones(getMilestonesWithStatus());
    setActivation(getActivationStatus());
  }, []);

  const completedCount = milestones.filter(m => m.completed).length;
  const totalCount = milestones.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const nextAction = getNextAction();

  // Don't show if all complete and dismissed
  if (completedCount === totalCount && localStorage.getItem('dfh_checklist_dismissed')) {
    return null;
  }

  // Milestone action links
  const getMilestoneLink = (milestoneId: string): string => {
    const links: Record<string, string> = {
      'signup_complete': '/app',
      'first_dataset': '/app/data',
      'first_ai_question': '/app/data',
      'first_insight': '/app/data',
      'first_model': '/app/models',
      'share_or_export': '/app/data',
    };
    return links[milestoneId] || '/app';
  };

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              <span className="font-medium">Getting Started: {completedCount}/{totalCount} complete</span>
            </div>
            <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          {nextAction && (
            <Link
              to={getMilestoneLink(nextAction.id)}
              className="flex items-center gap-2 text-sm font-medium hover:underline"
            >
              Next: {nextAction.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-popIn">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white relative">
            {onClose && (
              <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {completedCount === totalCount ? (
                  <Trophy className="w-6 h-6" />
                ) : (
                  <Rocket className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {completedCount === totalCount ? 'All Done! 🎉' : 'Quick Start Guide'}
                </h2>
                <p className="text-indigo-200 text-sm">{completedCount}/{totalCount} steps complete</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">{progressPercent}% complete</p>
            </div>

            {/* Milestones */}
            <div className="space-y-3 mb-6">
              {milestones.map((milestone, idx) => (
                <Link
                  key={milestone.id}
                  to={getMilestoneLink(milestone.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition ${
                    milestone.completed 
                      ? 'bg-green-50' 
                      : idx === completedCount 
                        ? 'bg-indigo-50 ring-2 ring-indigo-500'
                        : 'bg-gray-50'
                  }`}
                >
                  {milestone.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className={`w-5 h-5 flex-shrink-0 ${
                      idx === completedCount ? 'text-indigo-600' : 'text-gray-300'
                    }`} />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${milestone.completed ? 'text-green-700' : 'text-gray-900'}`}>
                      {milestone.label}
                    </p>
                    <p className="text-xs text-gray-500">{milestone.description}</p>
                  </div>
                  {!milestone.completed && idx === completedCount && (
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                  )}
                </Link>
              ))}
            </div>

            {/* CTA */}
            {completedCount < totalCount && nextAction && (
              <Link
                to={getMilestoneLink(nextAction.id)}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2"
              >
                {nextAction.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            {completedCount === totalCount && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium mb-4">
                  <Gift className="w-4 h-4" />
                  You're all set!
                </div>
                <p className="text-sm text-gray-600">
                  You've completed the getting started guide. Explore all features!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Sidebar variant (default)
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Rocket className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Getting Started</p>
            <p className="text-xs text-gray-500">{completedCount}/{totalCount} complete</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-2">
          {milestones.map((milestone, idx) => (
            <Link
              key={milestone.id}
              to={getMilestoneLink(milestone.id)}
              className={`flex items-center gap-3 p-2 rounded-lg transition text-sm ${
                milestone.completed 
                  ? 'text-green-700' 
                  : idx === completedCount 
                    ? 'text-indigo-700 bg-indigo-50'
                    : 'text-gray-500'
              }`}
            >
              {milestone.completed ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className={`w-4 h-4 flex-shrink-0 ${
                  idx === completedCount ? 'text-indigo-600' : 'text-gray-300'
                }`} />
              )}
              <span className={milestone.completed ? 'line-through' : ''}>
                {milestone.label}
              </span>
              {milestone.completed && milestone.reward && (
                <span className="text-xs">{milestone.reward}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;

