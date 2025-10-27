// Interactive Product Tour using Joyride
import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useLocation } from 'react-router-dom';

interface ProductTourProps {
  userProfile?: any;
}

const ProductTour: React.FC<ProductTourProps> = ({ userProfile }) => {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const location = useLocation();

  // Check if user should see tour
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('hasCompletedTour');
    const hasSeenMagicMoment = localStorage.getItem('hasSeenMagicMoment');
    
    // Show tour after Magic Moment or if they skipped it
    if (!hasCompletedTour && (hasSeenMagicMoment || location.pathname === '/app')) {
      // Start tour after small delay
      setTimeout(() => {
        setRunTour(true);
      }, 2000);
    }
  }, [location.pathname]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('hasCompletedTour', 'true');
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold mb-2">👋 Welcome to DataFlowHub AI!</h2>
          <p className="text-gray-700 mb-3">
            Let's take a quick 2-minute tour to show you the most powerful features.
          </p>
          <p className="text-sm text-gray-600">
            {userProfile?.full_name && `Hi ${userProfile.full_name.split(' ')[0]}! `}
            Since you're using this for <span className="font-semibold">{userProfile?.use_case || 'data analysis'}</span>, 
            I'll highlight features most relevant to you.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="sidebar-data"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">📁 Your Data Hub</h3>
          <p className="text-gray-700">
            Upload and manage all your datasets here. Supports CSV, Excel, and JSON files.
          </p>
          <p className="text-sm text-indigo-600 mt-2">
            💡 Tip: Drag & drop files anywhere to upload!
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="health-score"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">💯 Dataset Health Score</h3>
          <p className="text-gray-700 mb-2">
            Every dataset gets an instant quality score (0-100).
          </p>
          <p className="text-sm text-gray-600">
            🟢 90-100 = Excellent data<br />
            🟡 70-89 = Good, minor issues<br />
            🔴 Below 70 = Needs cleaning
          </p>
          <p className="text-sm text-indigo-600 mt-2">
            We check: completeness, consistency, validity, and uniqueness
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="ask-ai"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">🤖 Ask AI Anything!</h3>
          <p className="text-gray-700 mb-2">
            This is your secret weapon - an AI team personalized for{' '}
            <span className="font-semibold">{userProfile?.use_case || 'your industry'}</span>.
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Try asking:
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            {userProfile?.use_case?.includes('marketing') ? (
              <>
                <li>• "Create customer personas"</li>
                <li>• "Generate email campaign"</li>
                <li>• "Analyze campaign ROI"</li>
              </>
            ) : (
              <>
                <li>• "What are the key insights?"</li>
                <li>• "Show me trends over time"</li>
                <li>• "Find any anomalies"</li>
              </>
            )}
          </ul>
          <p className="text-sm text-indigo-600 mt-2">
            🎤 Bonus: Click the mic to use voice input!
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="insights"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">📊 Dataset Insights</h3>
          <p className="text-gray-700">
            See beautiful visualizations and statistics automatically generated from your data.
          </p>
          <p className="text-sm text-indigo-600 mt-2">
            All charts are interactive and downloadable!
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="train-models"]',
      content: (
        <div>
          <h3 className="font-bold mb-2">🧠 Train ML Models</h3>
          <p className="text-gray-700 mb-2">
            Build machine learning models with just a few clicks. No coding required!
          </p>
          <p className="text-sm text-gray-600">
            Select your target variable, choose algorithms, and we'll handle the rest.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold mb-2">🎉 You're Ready!</h2>
          <p className="text-gray-700 mb-3">
            You now know the key features of DataFlowHub AI.
          </p>
          <div className="bg-indigo-50 rounded-lg p-4 mb-3">
            <p className="font-semibold text-indigo-900 mb-2">💡 Pro Tips:</p>
            <ul className="text-sm text-indigo-800 space-y-1">
              <li>• Upload your own data to see real insights</li>
              <li>• The AI remembers your conversations</li>
              <li>• Health scores update automatically</li>
              <li>• Everything is auto-saved</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            Need help? Click the "Ask AI" button on any dataset - we're here to help!
          </p>
        </div>
      ),
      placement: 'center',
    },
  ];

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#6366F1',
          textColor: '#1F2937',
          backgroundColor: '#FFFFFF',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: '#FFFFFF',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: '#6366F1',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 600,
        },
        buttonBack: {
          color: '#6B7280',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#6B7280',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default ProductTour;

