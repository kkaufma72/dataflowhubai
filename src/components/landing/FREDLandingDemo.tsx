/**
 * FRED Landing Demo
 * 
 * Interactive demo on landing page that lets visitors:
 * - Search and preview FRED economic data
 * - Import one free dataset
 * - Ask 3 free AI questions
 * 
 * Purpose: Show immediate value before signup
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  Sparkles, 
  Send, 
  Database, 
  ArrowRight,
  Loader2,
  LineChart,
  MessageSquare,
  Lock,
  Check,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Demo data for popular FRED series
const POPULAR_SERIES = [
  { id: 'CPIAUCSL', title: 'Consumer Price Index (CPI)', frequency: 'Monthly', description: 'Inflation indicator' },
  { id: 'UNRATE', title: 'Unemployment Rate', frequency: 'Monthly', description: 'Labor market health' },
  { id: 'GDP', title: 'Gross Domestic Product', frequency: 'Quarterly', description: 'Economic output' },
  { id: 'FEDFUNDS', title: 'Federal Funds Rate', frequency: 'Monthly', description: 'Interest rate benchmark' },
  { id: 'DGS10', title: '10-Year Treasury Rate', frequency: 'Daily', description: 'Bond market indicator' },
  { id: 'HOUST', title: 'Housing Starts', frequency: 'Monthly', description: 'Construction activity' }
];

// Simulated AI responses for demo
const DEMO_RESPONSES: Record<string, string[]> = {
  'CPIAUCSL': [
    "📊 **CPI Analysis Summary**\n\nThe Consumer Price Index shows a **3.2% year-over-year increase**, indicating moderate inflation. Key drivers include housing costs (+4.1%) and food prices (+2.8%).\n\n**Recommendation:** Consider inflation-hedged investments for portfolios with long-term horizons.",
    "🔍 **Trend Detection**\n\nI detected a **seasonal pattern** in CPI data - prices typically rise 0.3-0.5% more in Q1 and Q4.\n\nThe current trend suggests inflation is **decelerating** compared to the 2022 peak of 9.1%.",
    "💡 **Predictive Insight**\n\nBased on historical patterns and current economic indicators, I project CPI to stabilize around **2.5-3.0%** over the next 6 months, assuming no major supply shocks."
  ],
  'UNRATE': [
    "📊 **Unemployment Analysis**\n\nCurrent unemployment rate is **3.8%**, near historic lows. The labor market remains tight with **1.4 job openings per unemployed worker**.\n\n**Key Insight:** Low unemployment typically signals strong consumer spending ahead.",
    "🔍 **Historical Context**\n\nThis unemployment level is in the **bottom 10%** of all historical readings since 1948. Previous periods at this level preceded economic expansions lasting 2-4 years.",
    "💡 **Correlation Found**\n\nI found a **strong inverse correlation (-0.78)** between unemployment and consumer confidence. Current levels suggest sustained retail sector strength."
  ],
  'default': [
    "📊 **Quick Analysis**\n\nThis dataset shows interesting patterns! I identified **3 key trends** and **2 anomalies** worth investigating.\n\n**Next Step:** Sign up to unlock detailed analysis with actionable recommendations.",
    "🔍 **Pattern Recognition**\n\nI detected **seasonal variations** and a long-term trend in this data. The AI found correlations with 5 other economic indicators.\n\n**Unlock More:** Create a free account to see full correlations.",
    "💡 **Insight Preview**\n\nBased on this data, I can provide **predictive forecasts**, **anomaly detection**, and **automated recommendations**.\n\n**Get Started:** Sign up to train ML models on this data!"
  ]
};

interface FREDLandingDemoProps {
  className?: string;
}

export const FREDLandingDemo: React.FC<FREDLandingDemoProps> = ({ className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<typeof POPULAR_SERIES[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dataImported, setDataImported] = useState(false);

  const maxFreeQuestions = 3;

  // Filter series based on search
  const filteredSeries = searchQuery
    ? POPULAR_SERIES.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : POPULAR_SERIES;

  // Handle series selection
  const handleSelectSeries = (series: typeof POPULAR_SERIES[0]) => {
    setSelectedSeries(series);
    setDataImported(false);
    setChatMessages([]);
    setQuestionsUsed(0);
  };

  // Handle import
  const handleImport = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setDataImported(true);
      // Add welcome message
      setChatMessages([{
        role: 'ai',
        content: `✅ **${selectedSeries?.title}** imported successfully!\n\nI've analyzed your data and found some interesting patterns. Ask me anything about this dataset!\n\n**Try asking:**\n- "What trends do you see?"\n- "Are there any anomalies?"\n- "What predictions can you make?"`
      }]);
    }, 1500);
  };

  // Handle sending a question
  const handleSendQuestion = () => {
    if (!currentQuestion.trim() || questionsUsed >= maxFreeQuestions || !dataImported) return;

    const question = currentQuestion.trim();
    setCurrentQuestion('');
    setChatMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = DEMO_RESPONSES[selectedSeries?.id || 'default'] || DEMO_RESPONSES.default;
      const responseIndex = Math.min(questionsUsed, responses.length - 1);
      
      setChatMessages(prev => [...prev, { role: 'ai', content: responses[responseIndex] }]);
      setQuestionsUsed(prev => prev + 1);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  // Suggested questions
  const suggestedQuestions = [
    "What trends do you see?",
    "Any anomalies in this data?",
    "What predictions can you make?"
  ];

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Try It Now — No Signup Required</h3>
              <p className="text-indigo-200 text-sm">Import real economic data & ask AI questions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-medium">{maxFreeQuestions - questionsUsed} free questions left</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 divide-x divide-gray-200">
        {/* Left: Data Selection */}
        <div className="p-5">
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              1. Choose Economic Data
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FRED datasets..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Series List */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {filteredSeries.map((series) => (
              <button
                key={series.id}
                onClick={() => handleSelectSeries(series)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedSeries?.id === series.id
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`w-4 h-4 ${selectedSeries?.id === series.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-gray-900 text-sm">{series.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 ml-6">{series.description}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{series.frequency}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Import Button */}
          {selectedSeries && !dataImported && (
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing data...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Import {selectedSeries.title}
                </>
              )}
            </button>
          )}

          {dataImported && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Data imported! Ask AI questions →</span>
            </div>
          )}
        </div>

        {/* Right: AI Chat */}
        <div className="p-5 bg-gray-50 flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            2. Ask AI About Your Data
          </label>

          {/* Chat Messages */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 mb-3 max-h-[300px] overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Import a dataset to start asking questions</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.role === 'ai' ? (
                      <div className="prose prose-sm max-w-none">
                        {msg.content.split('\n').map((line, i) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <p key={i} className="font-bold text-indigo-700">{line.replace(/\*\*/g, '')}</p>;
                          }
                          return <p key={i} className="mb-1">{line.replace(/\*\*/g, '')}</p>;
                        })}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is thinking...
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          {dataImported && questionsUsed < maxFreeQuestions && chatMessages.length <= 2 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQuestion(q)}
                  className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {questionsUsed < maxFreeQuestions ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
                placeholder={dataImported ? "Ask about your data..." : "Import data first"}
                disabled={!dataImported || isTyping}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
              <button
                onClick={handleSendQuestion}
                disabled={!currentQuestion.trim() || !dataImported || isTyping}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 text-center">
              <Lock className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-gray-700 font-medium mb-3">
                You've used all 3 free questions!
              </p>
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Sign Up for Unlimited Access
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-gray-500 mt-2">Free tier includes 10 questions/day</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <LineChart className="w-4 h-4 text-indigo-500" />
          <span>Powered by <strong>Federal Reserve Economic Data (FRED)</strong></span>
        </div>
        <Link
          to="/signin"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          Create Free Account
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default FREDLandingDemo;

