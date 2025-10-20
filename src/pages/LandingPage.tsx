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
  Eye
} from 'lucide-react';

const LandingPage = () => {
  const navigate = (path) => {
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
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Feature Engineering',
      description: 'Intelligent feature selection and transformation to boost model performance',
      color: 'pink',
      path: '/app/feature-engineering'
    },
    {
      icon: <BarChart2 className="w-8 h-8" />,
      title: 'Interactive Visualizations',
      description: 'Explore your data with beautiful, interactive charts and dashboards',
      color: 'green',
      path: '/app/visualizations'
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: 'One-Click Deployment',
      description: 'Deploy models as production-ready APIs in seconds',
      color: 'orange',
      path: '/app/deploy'
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: 'Real-Time Monitoring',
      description: 'Track model performance and detect drift automatically',
      color: 'red',
      path: '/app/monitoring'
    },
    {
      icon: <GitBranch className="w-8 h-8" />,
      title: 'Pipeline Builder',
      description: 'Create end-to-end ML pipelines with drag-and-drop interface',
      color: 'cyan',
      path: '/app/pipeline'
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: 'RESTful API',
      description: 'Integrate with any application using our comprehensive API',
      color: 'violet',
      path: '/app/api-reference'
    }
  ];

  const stats = [
    { label: 'Models Deployed', value: '10,000+' },
    { label: 'Data Processed', value: '5TB+' },
    { label: 'Active Users', value: '2,500+' },
    { label: 'API Uptime', value: '99.9%' }
  ];

  const benefits = [
    'No coding required - build ML models visually',
    'AutoML finds the best model for your data',
    'Deploy models in minutes, not weeks',
    'Built-in data quality checks and profiling',
    'Real-time monitoring and drift detection',
    'Enterprise-grade security and compliance'
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Data Scientist at TechCorp',
      content: 'DataFlowHub AI reduced our model training time from weeks to hours. The AutoML feature is a game-changer!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'ML Engineer at StartupXYZ',
      content: 'The deployment process is incredibly smooth. We went from trained model to production API in under 10 minutes.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'CTO at DataCo',
      content: 'Finally, a platform that makes ML accessible to our entire team. The chat interface is brilliant!',
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$49',
      period: 'per month',
      description: 'Perfect for individuals and small projects',
      features: [
        '5 datasets',
        '10 models',
        '100K predictions/month',
        'Community support',
        'Basic visualizations'
      ],
      cta: 'Start Free Trial',
      highlighted: false
    },
    {
      name: 'Professional',
      price: '$149',
      period: 'per month',
      description: 'For growing teams and businesses',
      features: [
        'Unlimited datasets',
        'Unlimited models',
        '1M predictions/month',
        'Priority support',
        'Advanced visualizations',
        'API access',
        'Custom pipelines'
      ],
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For large organizations with specific needs',
      features: [
        'Everything in Professional',
        'Unlimited predictions',
        'Dedicated support',
        'On-premise deployment',
        'Custom integrations',
        'SLA guarantee',
        'Training & onboarding'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Rocket className="w-8 h-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">DataFlowHub AI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-indigo-600">Features</a>
              <a href="#demo" className="text-gray-700 hover:text-indigo-600">Demo</a>
              <a href="#pricing" className="text-gray-700 hover:text-indigo-600">Pricing</a>
              <button onClick={() => navigate('/app/documentation')} className="text-gray-700 hover:text-indigo-600">Docs</button>
              <button 
                onClick={() => navigate('/signin')}
                className="text-gray-700 hover:text-indigo-600"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/signin')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </nav>

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
                onClick={() => navigate('/signin')}
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

      {/* Stats Section */}
      <section className="py-12 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-indigo-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Demo Section */}
      <section id="demo" className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Chat with Your Data
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ask questions in plain English and get instant insights powered by AI
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                <MessageSquare className="w-5 h-5 text-white mr-2" />
                <span className="text-white font-medium">AI Data Assistant</span>
                <span className="ml-auto text-indigo-200 text-sm">Live Demo</span>
              </div>
              
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                        msg.type === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-900 shadow-md border border-gray-200'
                      }`}
                    >
                      {msg.type === 'bot' && (
                        <div className="flex items-center mb-2">
                          <Brain className="w-4 h-4 text-indigo-600 mr-2" />
                          <span className="text-xs font-medium text-indigo-600">AI Assistant</span>
                        </div>
                      )}
                      <p className="whitespace-pre-line text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Chat Input (Disabled Demo) */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
                  <input
                    type="text"
                    placeholder="Try it yourself after signing up..."
                    disabled
                    className="flex-1 bg-transparent outline-none text-gray-500"
                  />
                  <button disabled className="bg-indigo-600 text-white px-4 py-2 rounded-lg opacity-50">
                    Send
                  </button>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-6">
              <button 
                onClick={() => navigate('/signin')}
                className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Sign up to try the AI assistant
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Build ML Models
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From data upload to production deployment, we've got you covered
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-600 transition cursor-pointer group"
                onClick={() => navigate(feature.path)}
              >
                <div className={`w-14 h-14 bg-${feature.color}-100 rounded-lg flex items-center justify-center text-${feature.color}-600 mb-4 group-hover:scale-110 transition`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center text-indigo-600 group-hover:text-indigo-700">
                  <span className="text-sm font-medium">Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why DataFlowHub AI?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We make machine learning accessible to everyone. Whether you're a data scientist or business analyst, you can build production-ready models in minutes.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <TrendingUp className="w-8 h-8 text-indigo-600 mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">10x</div>
                <p className="text-gray-600 text-sm">Faster deployment</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <Users className="w-8 h-8 text-green-600 mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">95%</div>
                <p className="text-gray-600 text-sm">Customer satisfaction</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <Zap className="w-8 h-8 text-yellow-600 mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">50%</div>
                <p className="text-gray-600 text-sm">Cost reduction</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <Shield className="w-8 h-8 text-blue-600 mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">99.9%</div>
                <p className="text-gray-600 text-sm">Uptime SLA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Data Teams Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-indigo-600 font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that's right for you
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'ring-2 ring-indigo-600 shadow-2xl scale-105'
                    : 'border border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-indigo-600 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <button
                  onClick={() => navigate('/signin')}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    plan.highlighted
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your ML Workflow?
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
                <li><button onClick={() => navigate('/app/documentation')} className="hover:text-white">Documentation</button></li>
                <li><button onClick={() => navigate('/app/api-reference')} className="hover:text-white">API</button></li>
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