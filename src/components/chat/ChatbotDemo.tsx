// Demo Component to Showcase Enhanced Chatbot UX
import React, { useState } from 'react';
import { StreamingMessage } from './StreamingMessage';
import { EnhancedLoadingIndicator } from './EnhancedLoadingIndicator';
import { Sparkles, Play } from 'lucide-react';

const DEMO_RESPONSES = [
  {
    content: `Based on my analysis of your sales data, I've identified three key trends:

1. Revenue Growth: Your Q4 sales increased by 34% compared to Q3, with the strongest performance in the Enterprise segment.

2. Customer Acquisition: New customer sign-ups accelerated in November, showing a 2.3x increase over the previous month. This correlates with your product launch campaign.

3. Regional Performance: The West Coast region is outperforming all others with a 47% higher conversion rate. Consider expanding your presence there.`,
    insights: [
      '34% revenue growth in Q4 - strongest quarter yet',
      'Enterprise segment driving majority of new revenue',
      'West Coast showing exceptional performance',
      'Product launch campaign highly effective'
    ],
    charts: [
      { title: 'Monthly Revenue Trend (Line Chart)' },
      { title: 'Customer Acquisition by Source (Bar Chart)' },
      { title: 'Regional Performance Heatmap' }
    ],
    actions: [
      { label: 'Export Full Report' },
      { label: 'Create Dashboard' },
      { label: 'Share with Team' }
    ]
  },
  {
    content: `Your dataset has excellent quality! Here's what I found:

✅ Completeness: 98.7% - Only minor missing values in the 'notes' column
✅ Consistency: All date formats are uniform, no duplicates detected
✅ Validity: All email addresses and phone numbers pass validation
⚠️  Minor Issue: 12 outliers detected in the 'transaction_amount' column (likely legitimate high-value transactions)

I recommend:
• Adding validation rules for the 'notes' field
• Setting up automated quality monitoring
• Creating alerts for future outliers`,
    insights: [
      'Overall data quality score: 96/100',
      'No critical issues found',
      'Ready for machine learning'
    ]
  },
  {
    content: `For this dataset, I recommend a **Random Forest Classifier** for the following reasons:

1. **Mixed Data Types**: Your data contains both numerical and categorical features, which Random Forest handles excellently.

2. **Non-Linear Relationships**: I detected complex patterns that linear models would miss.

3. **Feature Importance**: Random Forest will show you which features matter most for predictions.

4. **Robustness**: It's resistant to overfitting and works well with your dataset size (50,000 rows).

Expected Performance: 87-92% accuracy based on similar datasets I've analyzed.

Would you like me to start training this model?`,
    insights: [
      'Random Forest optimal for your use case',
      'Expected 87-92% accuracy',
      'Training time: ~5 minutes'
    ],
    actions: [
      { label: 'Train Model Now' },
      { label: 'Configure Parameters' },
      { label: 'Compare Models' }
    ]
  }
];

export const ChatbotDemo: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [showResponse, setShowResponse] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const runDemo = () => {
    setShowResponse(false);
    setShowLoading(true);

    // Simulate AI processing time
    setTimeout(() => {
      setShowLoading(false);
      setShowResponse(true);
    }, 3000);
  };

  const nextDemo = () => {
    setCurrentDemo((prev) => (prev + 1) % DEMO_RESPONSES.length);
    setShowResponse(false);
    setShowLoading(false);
  };

  const response = DEMO_RESPONSES[currentDemo];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">
            Enhanced Chatbot UX Demo
          </h2>
        </div>
        <p className="text-gray-600">
          Experience the new streaming responses, dynamic loading states, and interactive features
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Demo {currentDemo + 1} of {DEMO_RESPONSES.length}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={runDemo}
              disabled={showLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Play className="w-4 h-4" />
              {showLoading ? 'Processing...' : 'Run Demo'}
            </button>
            <button
              onClick={nextDemo}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Next Demo
            </button>
          </div>
        </div>

        <div className="min-h-[300px] space-y-4">
          {showLoading && <EnhancedLoadingIndicator />}
          
          {showResponse && (
            <div className="animate-popIn">
              <StreamingMessage
                content={response.content}
                insights={response.insights}
                charts={response.charts}
                actions={response.actions}
                speed={70}
                showActions={true}
              />
            </div>
          )}

          {!showLoading && !showResponse && (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Click "Run Demo" to see the enhanced chatbot in action!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          ✨ Features Demonstrated
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-gray-800">Streaming Typewriter Effect</p>
              <p className="text-sm text-gray-600">Text appears character-by-character at natural reading speed</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-gray-800">Dynamic Loading States</p>
              <p className="text-sm text-gray-600">Progress bar and cycling status messages keep users informed</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-gray-800">Progressive Content Reveal</p>
              <p className="text-sm text-gray-600">Insights, charts, and actions appear sequentially</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-gray-800">Interactive Actions</p>
              <p className="text-sm text-gray-600">Copy, speak, thumbs up/down on every response (hover to see)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotDemo;

