// Landing Page - Linear-Inspired Design
// Minimalist, elegant, with subtle animations and clean typography

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Shield, BarChart3, MessageSquare, ChevronRight } from 'lucide-react';
import InteractiveLiveDemo from '../components/landing/InteractiveLiveDemo';
import LiveDataTransformDemo from '../components/landing/LiveDataTransformDemo';

const LandingPageLinear: React.FC = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Linear-Style Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 20 
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DF</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">DataFlowHub</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <Link to="/documentation" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Docs</Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                to="/signin"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signin"
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all hover:shadow-lg"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Linear Style */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
        
        {/* Grid pattern (subtle) */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }} />

        <div className="relative max-w-6xl mx-auto">
          {/* Beta Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Now in Beta</span>
            <ChevronRight className="w-4 h-4 text-indigo-600" />
          </div>

          {/* Main Headline */}
          <h1 className="text-[64px] font-bold leading-[1.1] tracking-tight text-gray-900 mb-6">
            Talk to your data
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Get AI insights
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
            Transform, analyze, and understand your business data using natural language. 
            No SQL. No formulas. Just ask.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4 mb-12">
            <Link
              to="/signin"
              className="group px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all hover:shadow-xl flex items-center gap-2"
            >
              Start for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/demo"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-all"
            >
              Watch demo
            </Link>
          </div>

          {/* Social Proof */}
          <p className="text-sm text-gray-500">
            Join 2,500+ professionals who save 10+ hours per week
          </p>
        </div>

        {/* Interactive Demo */}
        <div className="relative max-w-6xl mx-auto mt-16">
          <InteractiveLiveDemo />
        </div>
      </section>

      {/* Features Section - Linear Grid Style */}
      <section id="features" className="py-32 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for modern teams
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to understand your data and make better decisions
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Natural language queries
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ask questions in plain English. No SQL, Python, or formulas required.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI-powered transformations
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Clean and transform data with simple commands. Undo/redo at any time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Instant visualizations
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Beautiful charts generated automatically. Interactive and exportable.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Data quality scoring
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Instant 0-100 score tells you if your data is ready to use.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                One-click ML models
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Train machine learning models without writing code. Just select your target.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Industry-specific AI
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Personalized for your role. Accountant, marketer, or CEO - AI adapts to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Transformation Demo Section */}
      <section className="py-32 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transform data with natural language
            </h2>
            <p className="text-lg text-gray-600">
              Watch how easy it is to clean and manipulate data - no coding required
            </p>
          </div>
          <LiveDataTransformDemo />
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Before */}
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full mb-4">
                Without DataFlowHub
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Stop wrestling with spreadsheets
              </h2>
              <div className="space-y-3">
                {[
                  'Hours wasted on Excel formulas',
                  'Hire expensive data analysts',
                  'Learn SQL, Python, or R',
                  'Wait days for insights',
                  'Struggle with messy data'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-xs">✗</span>
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - After */}
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full mb-4">
                With DataFlowHub
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Ask questions, get answers
              </h2>
              <div className="space-y-3">
                {[
                  'Ask in plain English - AI understands',
                  'Get insights in seconds, not days',
                  'No coding or formulas needed',
                  'Clean data with one command',
                  'Train ML models with one click'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-gray-900">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Linear Style */}
      <section id="pricing" className="py-32 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600">
              Start free. Scale when you need to.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="p-8 bg-white rounded-xl border border-gray-200">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '3 datasets',
                  '20 AI questions/month',
                  'Basic visualizations',
                  'CSV export'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/signin"
                className="block w-full px-4 py-2 bg-gray-100 text-gray-900 text-center font-medium rounded-lg hover:bg-gray-200 transition-all"
              >
                Get started
              </Link>
            </div>

            {/* Pro - Highlighted */}
            <div className="p-8 bg-gray-900 text-white rounded-xl border-2 border-gray-900 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                Most popular
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Professional</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$49</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited datasets',
                  'Unlimited AI questions',
                  'Advanced analytics',
                  'ML model training',
                  'Priority support',
                  'All export formats'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-1 h-1 rounded-full bg-white/60" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/signin"
                className="block w-full px-4 py-2 bg-white text-gray-900 text-center font-medium rounded-lg hover:bg-gray-100 transition-all"
              >
                Start free trial
              </Link>
            </div>

            {/* Team */}
            <div className="p-8 bg-white rounded-xl border border-gray-200">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Team</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">$149</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Pro',
                  'Team collaboration',
                  'Shared workspaces',
                  'Admin controls',
                  'SSO integration',
                  'Dedicated support'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/signin"
                className="block w-full px-4 py-2 bg-gray-100 text-gray-900 text-center font-medium rounded-lg hover:bg-gray-200 transition-all"
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Ready to transform
            <br />
            how you work with data?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Start analyzing your data in under 60 seconds
          </p>
          <Link
            to="/signin"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-medium text-lg rounded-lg hover:bg-gray-800 transition-all hover:shadow-xl group"
          >
            Get started for free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Free forever for 3 datasets
          </p>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="border-t border-gray-200 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">DF</span>
              </div>
              <span className="text-sm font-medium text-gray-900">DataFlowHub AI</span>
            </div>
            
            <div className="flex gap-8 text-sm text-gray-600">
              <Link to="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
              <Link to="/documentation" className="hover:text-gray-900 transition-colors">Docs</Link>
              <a href="mailto:hello@dataflowhub.ai" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            © 2025 DataFlowHub AI. Built for modern data teams.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageLinear;

