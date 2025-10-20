import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Database, 
  BarChart2, 
  Zap, 
  Shield, 
  Globe,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Brain,
  TrendingUp,
  Users,
  Star,
  MessageSquare,
  Code,
  GitBranch,
  Activity,
  Layers,
  Eye,
  Send
} from 'lucide-react';

const LandingPage = () => {
  const navigate = (path: string) => {
    window.location.href = path;
  };

  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: 'Hi! I can help you understand your data. What would you like to know?' }
  ]);
  const [currentDemoStep, setCurrentDemoStep] = useState(0);

  const demoConversation = [
    { type: 'user', text: 'What are the key patterns in my sales data?' },
    { type: 'bot', text: 'I found 3 key patterns:\n• Sales peak during weekends (35% higher)\n• Premium products drive 60% of revenue\n• Customer retention rate is 78%' },
    { type: 'user', text: 'Which features are most important?' },
    { type: 'bot', text: 'Based on your data, the top features are:\n1. Customer Age (importance: 0.85)\n2. Purchase History (0.72)\n3. Geographic Location (0.64)' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDemoStep(prev => {
        if (prev < demoConversation.length) {
          setChatMessages(prevMessages => [...prevMessages, demoConversation[prev]]);
          return prev + 1;
        }
        return prev;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Database className="w-8 h-8" />,
      title: 'Smart Data Management',
      description: 'Upload, connect, and manage datasets with automatic quality checks and profiling',
      color: 'blue',
      path: '/app/data'
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: 'AI Chat Assistant',
      description: 'Ask questions about your data in natural language and get instant insights',
      color: 'purple',
      path: '/app/data'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AutoML Training',
      description: 'Automatically train and optimize machine learning models with one click',
      color: 'indigo',
      path: '/app/train'
    },
    {
      icon: <BarChart2 className="w-8 h-8" />,
      title: 'Advanced Analytics',
      description: 'Get deep insights with interactive visualizations and custom dashboards',
      color: 'green',
      path: '/app/visualizations'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'One-Click Deployment',
      description: 'Deploy models to production with automated scaling and monitoring',
      color: 'yellow',
      path: '/app/deploy'
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: 'Real-Time Monitoring',
      description: 'Track model performance and data drift with comprehensive monitoring',
      color: 'red',
      path: '/app/monitoring'
    }
  ];

  const metrics = [
    { value: '10M+', label: 'Predictions Daily', icon: <TrendingUp className="w-6 h-6" /> },
    { value: '99.9%', label: 'Uptime SLA', icon: <Shield className="w-6 h-6" /> },
    { value: '5,000+', label: 'Active Users', icon: <Users className="w-6 h-6" /> },
    { value: '50ms', label: 'Avg Response Time', icon: <Zap className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-50 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-indigo-600 mr-2" />
              <span className="text-sm font-medium text-indigo-600">AI-Powered Machine Learning Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Build ML Models in
              <span className="text-indigo-600"> Minutes</span>
              <br />
              Not Months
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The only no-code ML platform you need. Upload data, train models, and deploy to production with just a few clicks. No PhD required.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate('/signin')}
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button 
                onClick={() => navigate('/documentation')}
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-indigo-600 hover:text-indigo-600 transition"
              >
                View Documentation
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Demo Section - AI Chat Interface */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ask Questions, Get Instant Insights
            </h2>
            <p className="text-xl text-gray-600">
              Our AI assistant understands your data and provides actionable recommendations
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">AI Data Assistant</h3>
                  <p className="text-sm text-green-600">● Online</p>
                </div>
              </div>
              
              <div className="space-y-4 h-96 overflow-y-auto mb-4">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-lg ${
                      msg.type === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Ask about your data..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled
                />
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for End-to-End ML
            </h2>
            <p className="text-xl text-gray-600">
              From data preparation to production deployment, all in one platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className={`w-16 h-16 bg-${feature.color}-100 rounded-lg flex items-center justify-center mb-4 text-${feature.color}-600`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-indigo-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {metrics.map((metric, idx) => (
              <div key={idx} className="text-center">
                <div className="flex justify-center mb-4 text-white">
                  {metric.icon}
                </div>
                <div className="text-4xl font-bold text-white mb-2">{metric.value}</div>
                <div className="text-indigo-200">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Data Teams Worldwide
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">
                  "DataFlowHub AI has completely transformed how we approach machine learning. What used to take weeks now takes hours."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">Data Scientist</p>
                    <p className="text-sm text-gray-500">Fortune 500 Company</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, scale as you grow
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Up to 3 datasets
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Basic visualizations
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Community support
                </li>
              </ul>
              <button 
                onClick={() => navigate('/signin')}
                className="w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Get Started
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-indigo-600 p-8 rounded-xl shadow-2xl border-4 border-indigo-700 transform scale-105">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">Pro</h3>
                <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
                  POPULAR
                </span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$99</span>
                <span className="text-indigo-200">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-indigo-300 mr-3" />
                  Unlimited datasets
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-indigo-300 mr-3" />
                  Advanced AutoML
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-indigo-300 mr-3" />
                  Priority support
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-indigo-300 mr-3" />
                  API access
                </li>
              </ul>
              <button 
                onClick={() => navigate('/signin')}
                className="w-full bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Start Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Everything in Pro
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Dedicated support
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  Custom integrations
                </li>
                <li className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  SLA guarantees
                </li>
              </ul>
              <button 
                onClick={() => navigate('/signin')}
                className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Data?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of data teams building better models faster
          </p>
          <button
            onClick={() => navigate('/signin')}
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition inline-flex items-center"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          <p className="text-indigo-200 mt-4">
            No credit card required • 14-day free trial
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Rocket className="w-6 h-6 text-indigo-400" />
                <span className="ml-2 text-lg font-bold text-white">DataFlowHub AI</span>
              </div>
              <p className="text-sm">
                The no-code ML platform for everyone. Build, train, and deploy models in minutes.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><button onClick={() => navigate('/documentation')} className="hover:text-white">Documentation</button></li>
                <li><button onClick={() => navigate('/api-reference')} className="hover:text-white">API</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            <p>&copy; 2025 DataFlowHub AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;