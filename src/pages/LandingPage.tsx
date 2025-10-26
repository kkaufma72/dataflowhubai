import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, BrainCircuit, Rocket, LogIn } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-800">
            <Link to="/">DataflowHub AI</Link>
          </div>
          <nav className="flex items-center space-x-4">
            <Link to="/features" className="text-gray-600 hover:text-gray-800">Features</Link>
            <Link to="/pricing" className="text-gray-600 hover:text-gray-800">Pricing</Link>
            <Link to="/documentation" className="text-gray-600 hover:text-gray-800">Documentation</Link>
            <div className="pl-4 border-l border-gray-200 flex items-center space-x-2">
                <Link
                  to="/signin"
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-lg shadow-sm hover:bg-gray-200 transition-colors duration-300"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
                <Link
                  to="/signup-complete"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
                >
                  Sign Up
                </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          Welcome to DataflowHub AI
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
          Your integrated solution for building, deploying, and monitoring intelligent data pipelines. Turn raw data into actionable insights with unparalleled speed and scale.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/signin"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
          >
            Get Started
          </Link>
          <Link
            to="/documentation"
            className="px-8 py-3 bg-white text-gray-800 font-semibold rounded-lg shadow-md border border-gray-200 hover:bg-gray-100 transition-colors duration-300"
          >
            View Documentation
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Why DataflowHub AI?</h2>
            <p className="mt-2 text-lg text-gray-600">A powerful toolkit for the entire data lifecycle.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Real-time Data Pipelines</h3>
              <p className="mt-2 text-gray-600">
                Build and manage complex dataflows with our intuitive visual editor. Process streaming and batch data with low latency.
              </p>
            </div>
            <div className="p-8 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">AI-Powered Analytics</h3>
              <p className="mt-2 text-gray-600">
                Leverage built-in ML models for predictive maintenance, anomaly detection, and demand forecasting.
              </p>
            </div>
            <div className="p-8 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 text-purple-600">
                <Rocket className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Seamless Deployment</h3>
              <p className="mt-2 text-gray-600">
                Deploy your data applications with a single click. Our managed infrastructure automatically scales to meet your demands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Empowering Industries</h2>
            <p className="mt-2 text-lg text-gray-600">From factory floors to financial markets, we provide the tools to innovate.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-gray-800">Manufacturing</h3>
              <ul className="mt-4 space-y-2 text-gray-600">
                <li>• Predictive maintenance</li>
                <li>• Quality control & defect detection</li>
                <li>• Supply chain optimization</li>
              </ul>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-gray-800">Retail & E-commerce</h3>
              <ul className="mt-4 space-y-2 text-gray-600">
                <li>• Demand forecasting</li>
                <li>• Customer segmentation</li>
                <li>• Personalized marketing</li>
              </ul>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-gray-800">Finance</h3>
              <ul className="mt-4 space-y-2 text-gray-600">
                <li>• Real-time fraud detection</li>
                <li>• Algorithmic trading analysis</li>
                <li>• Credit risk modeling</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="bg-blue-600">
        <div className="container mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-bold text-white">Ready to unlock your data's potential?</h2>
          <p className="mt-2 text-lg text-blue-100 max-w-2xl mx-auto">
            Start building your first intelligent data pipeline today. No credit card required.
          </p>
          <div className="mt-8">
          <Link
            to="/signin"
              className="px-10 py-4 bg-white text-blue-600 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-colors duration-300 text-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} DataflowHub AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
