// Interactive Live Demo for Landing Page
// Let visitors try AI features without signing up!

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, TrendingUp, BarChart3, MessageSquare, Play } from 'lucide-react';

interface DemoMessage {
  role: 'user' | 'assistant';
  content: string;
  chart?: any;
  delay?: number;
}

const SAMPLE_DATA = {
  name: "Sample Sales Data 2024",
  rows: 1000,
  columns: 8,
  preview: [
    ['Order ID', 'Date', 'Product', 'Quantity', 'Revenue', 'Region'],
    ['ORD001', '2024-01-15', 'Laptop', '2', '$1,999', 'West'],
    ['ORD002', '2024-01-15', 'Mouse', '5', '$150', 'East'],
    ['ORD003', '2024-01-16', 'Monitor', '1', '$599', 'North']
  ]
};

const DEMO_SCENARIOS = [
  {
    id: 'top-products',
    title: '📊 Find Top Products',
    question: "What are my top 5 products by revenue?",
    responses: [
      {
        role: 'user' as const,
        content: "What are my top 5 products by revenue?"
      },
      {
        role: 'assistant' as const,
        content: `Based on your sales data, here are your top 5 products:\n\n1. **Laptops** - $124,580 (32% of revenue)\n2. **Monitors** - $87,240 (22%)\n3. **Keyboards** - $45,120 (12%)\n4. **Headphones** - $38,950 (10%)\n5. **Mice** - $22,340 (6%)\n\n💡 **Insight:** Laptops are your star product. Consider bundling with accessories to increase average order value.\n\n📈 Revenue trend: ↗ +23% vs last month`,
        delay: 1500
      }
    ]
  },
  {
    id: 'customer-segments',
    title: '🎯 Create Personas',
    question: "Create customer segments for targeted marketing",
    responses: [
      {
        role: 'user' as const,
        content: "Create customer segments for targeted marketing"
      },
      {
        role: 'assistant' as const,
        content: `I've identified 3 key customer segments:\n\n**1. "Premium Professionals"** (18% of customers, 52% of revenue)\n• Age: 35-50, Income: $100K+\n• Buys: High-end laptops, premium accessories\n• Message: "Premium quality for professionals"\n\n**2. "Budget Shoppers"** (45% of customers, 25% of revenue)\n• Age: 25-35, Income: $40-70K\n• Buys: Mid-range products, waits for sales\n• Message: "Quality you can afford"\n\n**3. "Tech Enthusiasts"** (37% of customers, 23% of revenue)\n• Age: 20-40, Early adopters\n• Buys: Latest releases, multiple items\n• Message: "Be first with cutting-edge tech"\n\n✨ **Recommendation:** Create separate email campaigns for each segment. Want me to generate those?`,
        delay: 2000
      }
    ]
  },
  {
    id: 'clean-data',
    title: '🧹 Clean Data',
    question: "Remove rows where revenue < $50",
    responses: [
      {
        role: 'user' as const,
        content: "Remove rows where revenue < $50"
      },
      {
        role: 'assistant' as const,
        content: `✨ **Transformation Complete!**\n\nRemoved 127 rows where revenue < $50\n\n**Before:**\n• 1,000 rows\n• Revenue range: $10 - $2,500\n\n**After:**\n• 873 rows (-12.7%)\n• Revenue range: $50 - $2,500\n• Average order value increased from $143 to $156\n\n💡 **Impact:** Focusing on higher-value orders improved average revenue by 9%!\n\n[Undo] [Export Clean Data]`,
        delay: 1200
      }
    ]
  },
  {
    id: 'forecast',
    title: '🔮 Predict Revenue',
    question: "Predict next month's revenue",
    responses: [
      {
        role: 'user' as const,
        content: "Predict next month's revenue"
      },
      {
        role: 'assistant' as const,
        content: `🤖 **ML Model Trained Successfully!**\n\nBased on 12 months of historical data:\n\n**Prediction for Next Month:**\n• Expected Revenue: **$142,500**\n• Confidence Range: $135,000 - $150,000\n• Confidence Level: 87%\n\n**Model Details:**\n• Algorithm: XGBoost (auto-selected)\n• Accuracy: 94.2%\n• Training time: 2.3 seconds\n\n📊 **Key Drivers:**\n1. Seasonal trend (+15%)\n2. Marketing spend correlation\n3. Customer acquisition rate\n\n💡 **Recommendation:** Increase inventory for Laptops and Monitors based on predicted demand.\n\n[View Detailed Forecast] [Train Better Model]`,
        delay: 2500
      }
    ]
  }
];

const InteractiveLiveDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Removed auto-scroll - let users control their scrolling

  const playScenario = async (scenarioIndex: number) => {
    setIsPlaying(true);
    setMessages([]);
    setCurrentResponse('');
    setSelectedScenario(scenarioIndex);

    const scenario = DEMO_SCENARIOS[scenarioIndex];
    
    for (const message of scenario.responses) {
      // Add user message immediately
      if (message.role === 'user') {
        setMessages(prev => [...prev, message]);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Type out assistant message
      if (message.role === 'assistant') {
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Typing effect
        const words = message.content.split('');
        for (let i = 0; i <= words.length; i++) {
          setCurrentResponse(words.slice(0, i).join(''));
          await new Promise(resolve => setTimeout(resolve, 15)); // Fast typing
        }
        
        // Add complete message
        setMessages(prev => [...prev, { ...message, content: message.content }]);
        setCurrentResponse('');
        setIsTyping(false);
      }
    }
    
    setIsPlaying(false);
  };

  // Auto-play first scenario on mount
  useEffect(() => {
    setTimeout(() => playScenario(0), 1000);
  }, []);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
      {/* Demo Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Try it live - No signup required</h3>
              <p className="text-sm text-white/80">Ask questions about sample sales data</p>
            </div>
          </div>
          {!isPlaying && (
            <button
              onClick={() => playScenario(selectedScenario)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Replay
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 divide-x divide-gray-200">
        {/* Left - Scenario Selector */}
        <div className="p-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Try These Examples:
          </p>
          <div className="space-y-2">
            {DEMO_SCENARIOS.map((scenario, idx) => (
              <button
                key={scenario.id}
                onClick={() => !isPlaying && playScenario(idx)}
                disabled={isPlaying}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  selectedScenario === idx
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                } ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="font-medium text-sm mb-1">{scenario.title}</div>
                <div className={`text-xs ${selectedScenario === idx ? 'text-white/80' : 'text-gray-500'}`}>
                  {scenario.question}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-xs font-semibold text-indigo-900 mb-2">💡 This is just a demo!</p>
            <p className="text-xs text-indigo-700 leading-relaxed">
              With your own data, you can ask unlimited questions, transform tables, train models, and more.
            </p>
          </div>
        </div>

        {/* Right - Chat Interface */}
        <div className="md:col-span-2 flex flex-col h-[500px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
            {messages.length === 0 && !isTyping && (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select an example to see AI in action</p>
              </div>
            )}

            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl px-4 py-3 bg-gray-100">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {currentResponse}
                    <span className="inline-block w-2 h-4 bg-indigo-600 ml-1 animate-pulse" />
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Demo Input (disabled - for show) */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 opacity-60">
              <input
                type="text"
                placeholder="Ask anything about your data..."
                disabled
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-not-allowed"
              />
              <button
                disabled
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              ✨ Sign up free to use with your own data
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Like what you see?</p>
            <p className="text-xs text-gray-600">Get started with your own data in under 60 seconds</p>
          </div>
          <a
            href="/signin"
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all hover:shadow-lg text-sm"
          >
            Start for free →
          </a>
        </div>
      </div>
    </div>
  );
};

export default InteractiveLiveDemo;

