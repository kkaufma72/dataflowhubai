// Prerequisite Gate Component
// Shows real-time "before you start" callouts with prerequisites

import React from 'react';
import { AlertCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface Prerequisite {
  id: string;
  label: string;
  status: 'met' | 'unmet' | 'warning';
  description: string;
  actionLabel?: string;
  actionPath?: string;
}

interface PrerequisiteGateProps {
  title: string;
  description: string;
  prerequisites: Prerequisite[];
  onProceed?: () => void;
  proceedLabel?: string;
  children?: React.ReactNode;
}

const PrerequisiteGate: React.FC<PrerequisiteGateProps> = ({
  title,
  description,
  prerequisites,
  onProceed,
  proceedLabel = 'Proceed',
  children
}) => {
  const navigate = useNavigate();
  const allMet = prerequisites.every(p => p.status === 'met');
  const hasWarnings = prerequisites.some(p => p.status === 'warning');

  const getStatusIcon = (status: Prerequisite['status']) => {
    switch (status) {
      case 'met':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'unmet':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: Prerequisite['status']) => {
    switch (status) {
      case 'met':
        return 'border-green-500/30 bg-green-500/5';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'unmet':
        return 'border-red-500/30 bg-red-500/5';
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-100 mb-2">{title}</h2>
        <p className="text-sm text-gray-400">{description}</p>
      </div>

      {/* Prerequisites List */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wide mb-4">
          Prerequisites
        </h3>
        <div className="space-y-3">
          {prerequisites.map((prereq) => (
            <div
              key={prereq.id}
              className={`border rounded-lg p-4 transition ${getStatusColor(
                prereq.status
              )}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(prereq.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-100">
                      {prereq.label}
                    </p>
                    {prereq.status !== 'met' && prereq.actionLabel && prereq.actionPath && (
                      <button
                        onClick={() => navigate(prereq.actionPath!)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {prereq.actionLabel}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{prereq.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          {allMet ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-100">Ready to proceed</p>
                <p className="text-xs text-gray-400">All prerequisites are met</p>
              </div>
            </>
          ) : hasWarnings ? (
            <>
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-100">Proceed with caution</p>
                <p className="text-xs text-gray-400">Some warnings to consider</p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-100">Cannot proceed</p>
                <p className="text-xs text-gray-400">Please complete the prerequisites above</p>
              </div>
            </>
          )}
        </div>
        <button
          onClick={onProceed}
          disabled={!allMet && !hasWarnings}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            allMet
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : hasWarnings
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {proceedLabel}
        </button>
      </div>

      {/* Children (actual content, shown after prerequisites) */}
      {children && allMet && <div className="mt-8">{children}</div>}
    </div>
  );
};

export default PrerequisiteGate;
