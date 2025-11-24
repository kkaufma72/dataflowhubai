// Landing Page - Linear-Inspired Design
// Minimalist, elegant, with subtle animations and clean typography

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Shield, BarChart3, MessageSquare, CheckCircle, Menu, X } from 'lucide-react';
import InteractiveLiveDemo from '../components/landing/InteractiveLiveDemo';
import LiveTransformationDemo from '../components/data/LiveTransformationDemo';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { PricingTable } from '../components/pricing/PricingTable';
import { FeatureComparisonTable } from '../components/pricing/FeatureComparisonTable';
import { useAuth } from '../components/auth/AuthProvider';
import toast from 'react-hot-toast';
import { TrustBadges } from '../components/common/TrustBadges';
import { testimonials } from '../data/testimonials';
import { TestimonialCard } from '../components/social/TestimonialCard';
import { VideoHeroDemo } from '../components/landing/VideoHeroDemo';

const LandingPageLinear: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { startCheckout } = useStripeCheckout();
  const { user } = useAuth();

  const handlePlanSelect = useCallback(async (tier: string, billing: 'monthly' | 'annual') => {
    const normalizedTier = tier.toLowerCase();

    if (normalizedTier === 'free') {
      window.location.href = '/signin';
      return;
    }

    if (normalizedTier === 'enterprise') {
      window.location.href = 'mailto:sales@dataflowhub.ai?subject=Enterprise Plan Inquiry';
      return;
    }

    if (normalizedTier !== 'starter' && normalizedTier !== 'professional') {
      toast.error('Unsupported plan selected.');
      return;
    }

    let emailToUse = user?.email || '';

    if (!emailToUse) {
      emailToUse = window.prompt('Enter your work email to continue to checkout')?.trim() || '';
      if (!emailToUse) {
        toast.error('Email is required to continue.');
        return;
      }
    }

    try {
      await startCheckout({
        tier: normalizedTier as 'starter' | 'professional',
        billing,
        email: emailToUse,
      });
    } catch (error) {
      console.error('Failed to start checkout:', error);
      toast.error('Unable to open checkout. Please try again.');
    }
  }, [startCheckout, user?.email]);

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
              <svg viewBox="0 0 800 800" className="w-8 h-8">
                <defs>
                  <linearGradient id="landing-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#5B21B6', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path d="M 100 200 L 100 650 L 350 650 C 500 650 600 550 600 425 C 600 300 500 200 350 200 Z M 200 300 L 350 300 C 430 300 480 350 480 425 C 480 500 430 550 350 550 L 200 550 Z" 
                      fill="url(#landing-logo-gradient)"/>
                <line x1="500" y1="250" x2="650" y2="250" stroke="url(#landing-logo-gradient)" strokeWidth="8"/>
                <line x1="500" y1="300" x2="650" y2="300" stroke="url(#landing-logo-gradient)" strokeWidth="8"/>
                <line x1="500" y1="350" x2="650" y2="350" stroke="url(#landing-logo-gradient)" strokeWidth="8"/>
                <line x1="500" y1="400" x2="650" y2="400" stroke="url(#landing-logo-gradient)" strokeWidth="8"/>
                <line x1="500" y1="450" x2="650" y2="450" stroke="url(#landing-logo-gradient)" strokeWidth="8"/>
                <line x1="500" y1="500" x2="650" y2="500" stroke="url(#landing-logo-gradient)" strokeWidth="8"/>
                <line x1="500" y1="550" x2="650" y2="550" stroke="url(#landing-logo-gradient)" strokeWidth="8"/>
                <line x1="500" y1="600" x2="650" y2="600" stroke="url(#landing-logo-gradient)" strokeWidth="8"/>
                <circle cx="650" cy="250" r="15" fill="url(#landing-logo-gradient)"/>
                <circle cx="650" cy="300" r="15" fill="url(#landing-logo-gradient)"/>
                <circle cx="650" cy="350" r="15" fill="url(#landing-logo-gradient)"/>
                <circle cx="650" cy="400" r="15" fill="url(#landing-logo-gradient)"/>
                <circle cx="650" cy="450" r="15" fill="url(#landing-logo-gradient)"/>
                <circle cx="650" cy="500" r="15" fill="url(#landing-logo-gradient)"/>
                <circle cx="650" cy="550" r="15" fill="url(#landing-logo-gradient)"/>
                <circle cx="650" cy="600" r="15" fill="url(#landing-logo-gradient)"/>
              </svg>
              <span className="text-xl font-semibold text-gray-900">DataFlowHub.AI</span>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <Link to="/product-tour" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Product Tour</Link>
              <Link to="/documentation" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Docs</Link>
            </div>

            {/* CTA Buttons - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
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

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg">
            <div className="px-6 py-4 space-y-4">
              <a 
                href="#features" 
                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <Link 
                to="/product-tour" 
                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Product Tour
              </Link>
              <Link 
                to="/documentation" 
                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link
                  to="/signin"
                  className="block w-full px-4 py-2 text-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/signin"
                  className="block w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Linear Style */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/30 via-purple-50/20 to-white pointer-events-none" />
        
        {/* Grid pattern (subtle) */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }} />

        <div className="relative max-w-6xl mx-auto text-center">
          {/* Beta Badge */}
          <div className="badge-premium inline-flex items-center gap-2 mb-8 hover:shadow-lg transition-shadow">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold">Powered by Advanced AI • Enterprise Ready</span>
          </div>

          {/* Main Headline */}
          <h1 className="page-title text-5xl sm:text-6xl lg:text-7xl leading-[1.08]">
            Build ML Models
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Without Code
            </span>
          </h1>

          {/* Subheadline */}
          <p className="page-subtitle text-xl sm:text-2xl max-w-3xl mx-auto mb-12">
            Enterprise AutoML platform that transforms how businesses build, deploy, and scale machine learning models. 
            <span className="block mt-2 font-semibold text-gray-700">
              Go from raw data to production in minutes, not months.
            </span>
          </p>

          {/* Social Proof Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="label-text text-gray-700">10K+ datasets processed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="label-text text-gray-700">500+ models deployed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="label-text text-gray-700">95% faster than traditional ML</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              to="/product-tour"
              className="btn-primary-improved w-full sm:w-auto text-lg flex items-center justify-center gap-3"
            >
              <Sparkles className="w-5 h-5" />
              See Interactive Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/signin"
              className="btn-secondary-improved w-full sm:w-auto text-lg flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mb-8">
            <TrustBadges variant="compact" className="justify-center" />
          </div>

          {/* Trust Signals */}
          <p className="text-sm text-gray-500 mb-4">
            ✓ No credit card required  •  ✓ Free 14-day trial  •  ✓ Cancel anytime
          </p>

          {/* Social Proof */}
          <p className="text-sm text-gray-500">
            Join 2,500+ professionals who save 10+ hours per week
          </p>
        </div>

        {/* Video Demo - Shown First */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <VideoHeroDemo
            videoUrl="" // TODO: Add your YouTube embed URL after recording
            thumbnailUrl="/demo-thumbnail.jpg"
            title="See DataFlowHub Build ML Models in 3 Minutes"
          />
        </div>

        {/* Interactive Demo - Below Video */}
        <div className="relative max-w-6xl mx-auto mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Or Try It Yourself (Interactive)
            </h2>
            <p className="text-lg text-gray-600">
              Click through our live demo - no sign-up required
            </p>
          </div>
          <InteractiveLiveDemo />
        </div>
      </section>

      {/* Features Section - Linear Grid Style */}
      <section id="features" className="py-32 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="section-title mb-4">
              Built for modern teams
            </h2>
            <p className="page-subtitle max-w-2xl mx-auto">
              Everything you need to understand your data and make better decisions
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-improved group hover:shadow-lg">
              <div className="icon-container-info mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="card-title mb-2">
                Natural language queries
              </h3>
              <p className="body-text text-sm">
                Ask questions in plain English. No SQL, Python, or formulas required.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-improved group hover:shadow-lg">
              <div className="icon-container-primary mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="card-title mb-2">
                AI-powered transformations
              </h3>
              <p className="body-text text-sm">
                Clean and transform data with simple commands. Undo/redo at any time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-improved group hover:shadow-lg">
              <div className="icon-container-warning mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="card-title mb-2">
                Instant visualizations
              </h3>
              <p className="body-text text-sm">
                Beautiful charts generated automatically. Interactive and exportable.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card-improved group hover:shadow-lg">
              <div className="icon-container-success mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="card-title mb-2">
                Data quality scoring
              </h3>
              <p className="body-text text-sm">
                Instant 0-100 score tells you if your data is ready to use.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card-improved group hover:shadow-lg">
              <div className="icon-container-warning mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="card-title mb-2">
                One-click ML models
              </h3>
              <p className="body-text text-sm">
                Train machine learning models without writing code. Just select your target.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card-improved group hover:shadow-lg">
              <div className="icon-container-info mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="card-title mb-2">
                Industry-specific AI
              </h3>
              <p className="body-text text-sm">
                Personalized for your role. Accountant, marketer, or CEO - AI adapts to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud Platform Integrations Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-gray-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">
              Connect your entire data stack
            </h2>
            <p className="page-subtitle max-w-2xl mx-auto">
              Seamlessly integrate with cloud platforms and databases you're already using
            </p>
          </div>

          {/* Cloud Platforms Row */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-8">Cloud Platforms</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 items-center justify-items-center">
              {/* Google Cloud Platform */}
              <div className="group flex flex-col items-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all cursor-pointer relative" title="Google Cloud Platform - BigQuery, Cloud SQL, Firestore">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-white font-bold text-sm">☁️</span>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">Google Cloud</span>
              </div>

              {/* Amazon AWS */}
              <div className="group flex flex-col items-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all cursor-pointer" title="Amazon AWS - S3, RDS, DynamoDB, Redshift">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-white font-bold text-sm">⚡</span>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">Amazon AWS</span>
              </div>

              {/* Microsoft Azure */}
              <div className="group flex flex-col items-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all cursor-pointer" title="Microsoft Azure - SQL Database, Cosmos DB, Blob Storage">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-white font-bold text-sm">🔷</span>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">Microsoft Azure</span>
              </div>

              {/* IBM Cloud */}
              <div className="group flex flex-col items-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all cursor-pointer" title="IBM Cloud - Db2, Cloudant, Watson">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-white font-bold text-sm">🌐</span>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">IBM Cloud</span>
              </div>

              {/* Oracle Cloud */}
              <div className="group flex flex-col items-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all cursor-pointer" title="Oracle Cloud - Autonomous Database, MySQL HeatWave">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-white font-bold text-sm">🔶</span>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">Oracle Cloud</span>
              </div>
            </div>
          </div>

          {/* Databases Row */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-8">Popular Databases</h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-center justify-items-center">
              {/* PostgreSQL */}
              <div className="group flex flex-col items-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all cursor-pointer" title="PostgreSQL - Advanced open-source relational database">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-white font-bold text-sm">🐘</span>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">PostgreSQL</span>
              </div>

              {/* MySQL */}
              <div className="group flex flex-col items-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all cursor-pointer" title="MySQL - World's most popular open-source database">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-white font-bold text-sm">🐬</span>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">MySQL</span>
              </div>

              {/* MongoDB */}
              <div className="group flex flex-col items-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all cursor-pointer" title="MongoDB - Leading NoSQL document database">
                <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-white font-bold text-sm">🍃</span>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">MongoDB</span>
              </div>

              {/* Snowflake */}
              <div className="group flex flex-col items-center p-4 rounded-xl hover:bg-white hover:shadow-lg transition-all cursor-pointer" title="Snowflake - Cloud data warehouse platform">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-white font-bold text-sm">❄️</span>
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">Snowflake</span>
              </div>
            </div>
          </div>

          {/* Integration Benefits */}
          <div className="text-center">
            <div className="flex flex-wrap justify-center gap-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Enterprise Security</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">5-minute Setup</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">No Code Required</span>
              </div>
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
          <LiveTransformationDemo />
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50/30 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by data professionals worldwide
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              See how teams are transforming their data workflows
            </p>
            {/* Note about testimonials */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <span className="font-medium">📝 Want to share your story?</span>
              <a href="mailto:success@dataflowhub.ai" className="underline font-bold">Contact us</a>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.slice(0, 3).map((testimonial) => (
              <TestimonialCard 
                key={testimonial.id} 
                testimonial={testimonial}
                variant="default"
              />
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Link
              to="/case-studies"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all"
            >
              Read Customer Success Stories
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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

      {/* Pricing Section - Connected to Stripe */}
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

          <div className="grid gap-8 lg:grid-cols-[2fr,1fr] items-start">
            <PricingTable onSelectPlan={handlePlanSelect} showComparison={false} />

            <div className="rounded-2xl border border-gray-200 bg-white shadow-lg p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-indigo-600">
                <Sparkles className="w-4 h-4" />
                Start in 60 seconds
              </div>
              <h3 className="mt-2 text-xl font-bold text-gray-900">Launch your workspace in three steps</h3>
              <p className="mt-1 text-sm text-gray-600">
                No sales calls. Just follow the checklist and you’ll be exploring sample data with AI in under a minute.
              </p>

              <ol className="mt-4 space-y-4 text-sm text-gray-900">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-semibold">Create your account</p>
                    <p className="text-gray-500">Use email or OAuth. No credit card required.</p>
                    <Link
                      to="/signin"
                      className="mt-2 inline-flex items-center text-indigo-600 font-medium"
                    >
                      Sign up free
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-semibold">Load sample data</p>
                    <p className="text-gray-500">Automatically seeds six clean datasets so you can explore instantly.</p>
                    <Link
                      to="/app/data"
                      className="mt-2 inline-flex items-center text-indigo-600 font-medium"
                    >
                      Jump to Data Management
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-semibold">Train your first model</p>
                    <p className="text-gray-500">Pick the sample dataset, choose a target, and let AutoML do the rest.</p>
                    <Link
                      to="/app/train"
                      className="mt-2 inline-flex items-center text-indigo-600 font-medium"
                    >
                      Go to Model Training
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <div className="mt-16">
            <FeatureComparisonTable />
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

      {/* Product Tour CTA Banner */}
      <section className="py-20 px-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-full">
              <Sparkles className="w-4 h-4" />
              Interactive Demo
            </span>
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            See DataFlowHub AI in Action
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience the full platform with enterprise-scale data, 5 AI models, and 2.4B daily predictions. 
            No signup required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/product-tour"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 transform"
            >
              <Sparkles className="w-6 h-6" />
              🚀 Start Interactive Tour
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <div className="text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  96.7% AI Accuracy
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  25.6GB Data Scale
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  8ms Latency
                </span>
              </div>
            </div>
          </div>
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
              <Link to="/security" className="hover:text-gray-900 transition-colors">Security</Link>
              <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
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
