import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

const LandingNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Add scroll event listener to change header style on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled || !isLandingPage 
        ? 'bg-white shadow-sm dark:bg-gray-900' 
        : isLandingPage 
          ? 'bg-transparent' 
          : 'bg-white shadow-sm dark:bg-gray-900'
    }`}>
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl mr-2">D</div>
              <span className={`text-xl font-bold ${isScrolled || !isLandingPage ? 'text-gray-900 dark:text-white' : isLandingPage ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>DataFlowHub AI</span>
            </Link>
            
            <nav className="hidden md:flex ml-10 space-x-8">
              <div className="relative">
                <button 
                  className={`flex items-center ${isScrolled || !isLandingPage ? 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400' : isLandingPage ? 'text-gray-800 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400'}`}
                  onClick={() => toggleDropdown('products')}
                  aria-expanded={activeDropdown === 'products'}
                  aria-haspopup="true"
                >
                  Products
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {activeDropdown === 'products' && (
                  <div 
                    className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 dark:bg-gray-800 dark:ring-gray-700"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="py-1">
                      <Link to="/features" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">AutoML Platform</Link>
                      <Link to="/features" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">Data Processing</Link>
                      <Link to="/features" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">Model Deployment</Link>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button 
                  className={`flex items-center ${isScrolled || !isLandingPage ? 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400' : isLandingPage ? 'text-gray-800 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400'}`}
                  onClick={() => toggleDropdown('solutions')}
                >
                  Solutions
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {activeDropdown === 'solutions' && (
                  <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 dark:bg-gray-800 dark:ring-gray-700">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <Link to="/#benefits" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">For Enterprise</Link>
                      <Link to="/#benefits" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">For Startups</Link>
                      <Link to="/#benefits" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">For Data Scientists</Link>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Use Cases</div>
                      <Link to="/#use-cases" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">Customer Churn Prediction</Link>
                      <Link to="/#use-cases" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">Fraud Detection</Link>
                      <Link to="/#use-cases" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">Demand Forecasting</Link>
                      <Link to="/#use-cases" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">View All Use Cases</Link>
                    </div>
                  </div>
                )}
              </div>
              <Link to="/features" className={`${isScrolled || !isLandingPage ? 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400' : isLandingPage ? 'text-gray-800 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400'}`}>Features</Link>
              <Link to="/#pricing" className={`${isScrolled || !isLandingPage ? 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400' : isLandingPage ? 'text-gray-800 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400'}`}>Pricing</Link>
              <Link to="/documentation" className={`${isScrolled || !isLandingPage ? 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400' : isLandingPage ? 'text-gray-800 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400'}`}>Documentation</Link>
              <Link to="/api-reference" className={`${isScrolled || !isLandingPage ? 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400' : isLandingPage ? 'text-gray-800 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400'}`}>API Reference</Link>
            </nav>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Link to="/app" className="text-indigo-600 hover:text-indigo-500 font-medium dark:text-indigo-400 dark:hover:text-indigo-300">Dashboard</Link>
            ) : (
              <>
                <Link to="/signin" className={`${isScrolled || !isLandingPage ? 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400' : isLandingPage ? 'text-gray-800 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400'}`}>Sign In</Link>
                <Link to="/signin" className="btn btn-primary dark:bg-indigo-700 dark:hover:bg-indigo-600">Get Started</Link>
              </>
            )}
          </div>
          
          <div className="md:hidden">
            <button onClick={toggleMenu} className={`${isScrolled || !isLandingPage ? 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400' : isLandingPage ? 'text-gray-800 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400'}`}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <nav className="flex flex-col space-y-4">
              <div>
                <button 
                  className="flex items-center justify-between w-full text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                  onClick={() => toggleDropdown('mobileProducts')}
                >
                  Products
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {activeDropdown === 'mobileProducts' && (
                  <div className="mt-2 ml-4 space-y-2">
                    <Link to="/#features" className="block text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">AutoML Platform</Link>
                    <Link to="/#features" className="block text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">Data Processing</Link>
                    <Link to="/#features" className="block text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">Model Deployment</Link>
                  </div>
                )}
              </div>
              
              <div>
                <button 
                  className="flex items-center justify-between w-full text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                  onClick={() => toggleDropdown('mobileSolutions')}
                >
                  Solutions
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {activeDropdown === 'mobileSolutions' && (
                  <div className="mt-2 ml-4 space-y-2">
                    <Link to="/#benefits" className="block text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">For Enterprise</Link>
                    <Link to="/#benefits" className="block text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">For Startups</Link>
                    <Link to="/#benefits" className="block text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">For Data Scientists</Link>
                    <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Use Cases</p>
                      <Link to="/#use-cases" className="block text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 mt-1">Customer Churn Prediction</Link>
                      <Link to="/#use-cases" className="block text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">Fraud Detection</Link>
                      <Link to="/#use-cases" className="block text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">Demand Forecasting</Link>
                      <Link to="/#use-cases" className="block text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">View All Use Cases</Link>
                    </div>
                  </div>
                )}
              </div>
              
              <Link to="/#features" className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">Features</Link>
              <Link to="/#pricing" className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">Pricing</Link>
              <Link to="/documentation" className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">Documentation</Link>
              <Link to="/api-reference" className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">API Reference</Link>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {user ? (
                  <Link to="/app" className="block text-indigo-600 hover:text-indigo-500 font-medium dark:text-indigo-400 dark:hover:text-indigo-300">Dashboard</Link>
                ) : (
                  <>
                    <Link to="/signin" className="block text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 mb-4">Sign In</Link>
                    <Link to="/signin" className="btn btn-primary w-full dark:bg-indigo-700 dark:hover:bg-indigo-600">Get Started</Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default LandingNav;