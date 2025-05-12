import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import Benefits from '../components/Benefits';
import Process from '../components/Process';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import CTA from '../components/CTA';
import UseCases from '../components/UseCases';
import { useAuth } from '../components/auth/AuthProvider';

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  
  // Check if user is authenticated and redirect if needed
  useEffect(() => {
    if (user) {
      navigate('/app');
    } else {
      // Show content after a short delay to ensure we don't flash content before redirect
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);
  
  // If we're still checking auth status or user is authenticated, don't render content
  if (!showContent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <Hero />
      
      {/* Features Section */}
      {/* Features section moved to its own page */}
      
      {/* Benefits Section */}
      <Benefits />
      
      {/* Process Section */}
      <Process />
      
      {/* Use Cases Section */}
      <UseCases />
      
      {/* Testimonials Section */}
      <Testimonials />
      
      {/* Pricing Section */}
      <Pricing />
      
      {/* CTA Section */}
      <CTA />
    </div>
  );
};

export default LandingPage;