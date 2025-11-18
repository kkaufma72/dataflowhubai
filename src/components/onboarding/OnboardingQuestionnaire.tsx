import React, { useState } from 'react';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface OnboardingQuestionnaireProps {
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingQuestionnaire: React.FC<OnboardingQuestionnaireProps> = ({
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    primaryUseCase: '',
    profession: '',
    industry: '',
    objectives: [] as string[],
    customObjective: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const useCases = [
    { id: 'predictive_analytics', label: 'Predictive Analytics', icon: '📊' },
    { id: 'customer_insights', label: 'Customer Insights & Segmentation', icon: '👥' },
    { id: 'fraud_detection', label: 'Fraud Detection', icon: '🔒' },
    { id: 'sales_forecasting', label: 'Sales Forecasting', icon: '📈' },
    { id: 'churn_prediction', label: 'Churn Prediction', icon: '⚠️' },
    { id: 'lead_scoring', label: 'Lead Scoring', icon: '🎯' },
    { id: 'inventory_optimization', label: 'Inventory Optimization', icon: '📦' },
    { id: 'sentiment_analysis', label: 'Sentiment Analysis', icon: '💬' },
    { id: 'other', label: 'Other / Exploring', icon: '🔮' },
  ];

  const professions = [
    'Data Analyst',
    'Business Analyst',
    'Product Manager',
    'Marketing Manager',
    'Sales Manager',
    'Operations Manager',
    'Executive / C-Suite',
    'Data Scientist',
    'Developer / Engineer',
    'Consultant',
    'Entrepreneur',
    'Student',
    'Other',
  ];

  const industries = [
    'Technology / SaaS',
    'Financial Services / Fintech',
    'E-commerce / Retail',
    'Healthcare / Biotech',
    'Manufacturing',
    'Marketing / Advertising',
    'Education',
    'Consulting',
    'Real Estate',
    'Insurance',
    'Telecommunications',
    'Transportation / Logistics',
    'Other',
  ];

  const objectiveOptions = [
    'Reduce costs',
    'Increase revenue',
    'Improve efficiency',
    'Better customer understanding',
    'Competitive advantage',
    'Risk management',
    'Process automation',
    'Data-driven decisions',
  ];

  const handleObjectiveToggle = (objective: string) => {
    setFormData((prev) => ({
      ...prev,
      objectives: prev.objectives.includes(objective)
        ? prev.objectives.filter((o) => o !== objective)
        : [...prev.objectives, objective],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No user found');
      }

      // Combine objectives
      const allObjectives = [...formData.objectives];
      if (formData.customObjective.trim()) {
        allObjectives.push(formData.customObjective.trim());
      }

      // Update user profile with onboarding responses
      const { error } = await supabase
        .from('user_profiles')
        .update({
          use_case: formData.primaryUseCase,
          profession: formData.profession,
          industry: formData.industry,
          objectives: allObjectives,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile saved! The app will now be tailored to your needs.');
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding:', error);
      toast.error('Failed to save profile. You can update it later in settings.');
      onComplete(); // Still proceed even if save fails
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Mark as skipped
        await supabase
          .from('user_profiles')
          .update({
            onboarding_completed: true,
            onboarding_skipped: true,
            onboarding_completed_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error marking onboarding as skipped:', error);
    }
    onSkip();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.primaryUseCase !== '';
      case 2:
        return formData.profession !== '';
      case 3:
        return formData.industry !== '';
      case 4:
        return formData.objectives.length > 0 || formData.customObjective.trim() !== '';
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white relative">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Let's Personalize Your Experience</h2>
          </div>
          
          <p className="text-indigo-100 text-sm">
            These responses help us generate better insights and tailor the app to your industry
          </p>

          {/* Progress bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-240px)]">
          {/* Step 1: Primary Use Case */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  What are you most interested in using this app for?
                </h3>
                <p className="text-gray-600 text-sm">
                  Select your primary use case to help us customize your experience
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {useCases.map((useCase) => (
                  <button
                    key={useCase.id}
                    onClick={() => setFormData({ ...formData, primaryUseCase: useCase.id })}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      formData.primaryUseCase === useCase.id
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{useCase.icon}</span>
                      <span className="font-medium text-gray-900">{useCase.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Profession */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  What's your profession?
                </h3>
                <p className="text-gray-600 text-sm">
                  This helps us tailor recommendations and insights to your role
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {professions.map((profession) => (
                  <button
                    key={profession}
                    onClick={() => setFormData({ ...formData, profession })}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      formData.profession === profession
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium text-gray-900">{profession}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Industry */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  What industry do you work in?
                </h3>
                <p className="text-gray-600 text-sm">
                  We'll customize examples and templates for your industry
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {industries.map((industry) => (
                  <button
                    key={industry}
                    onClick={() => setFormData({ ...formData, industry })}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      formData.industry === industry
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium text-gray-900">{industry}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Objectives */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  What are your main objectives?
                </h3>
                <p className="text-gray-600 text-sm">
                  Select all that apply - this shapes how we present insights
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {objectiveOptions.map((objective) => (
                  <button
                    key={objective}
                    onClick={() => handleObjectiveToggle(objective)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      formData.objectives.includes(objective)
                        ? 'border-indigo-600 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.objectives.includes(objective)
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {formData.objectives.includes(objective) && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{objective}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other objectives (optional)
                </label>
                <input
                  type="text"
                  value={formData.customObjective}
                  onChange={(e) =>
                    setFormData({ ...formData, customObjective: e.target.value })
                  }
                  placeholder="e.g., Improve customer satisfaction"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Skip for now
          </button>

          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className={`px-6 py-3 font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  canProceed()
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className={`px-6 py-3 font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  canProceed() && !isSubmitting
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Complete Setup'}
                <Sparkles className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingQuestionnaire;
