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

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMenuOpen(false); // Close mobile menu after click
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
              <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xl mr-2">D</div>
              <span className={`text-xl font-bold ${isScrolled || !isLandingPage ? 'text-gray-900 dark:text-white' : isLandingPage ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>DataFlowHub AI</span>
            </Link>
            
            <nav className="hidden md:flex ml-10 space-x-8">
              {isLandingPage ? (
                <>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className={`${isScrolled ? 'text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400' : 'text-gray-800 hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400'}`}
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => scrollToSection('pricing')}
                    className={`${isScrolled ? 'text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400' : 'text-gray-800 hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400'}`}
                  >
                    Pricing
                  </button>
                </>
              ) : (
                <>
                  <Link to="/#features" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">Features</Link>
                  <Link to="/#pricing" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">Pricing</Link>
                </>
              )}
              <Link to="/documentation" className={`${isScrolled || !isLandingPage ? 'text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400' : isLandingPage ? 'text-gray-800 hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400' : 'text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'}`}>Documentation</Link>
              <Link to="/api-reference" className={`${isScrolled || !isLandingPage ? 'text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400' : isLandingPage ? 'text-gray-800 hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400' : 'text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'}`}>API Reference</Link>
            </nav>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Link to="/app" className="text-primary-600 hover:text-primary font-medium dark:text-primary-400 dark:hover:text-primary-400">Dashboard</Link>
            ) : (
              <>
                <Link to="/signin" className={`${isScrolled || !isLandingPage ? 'text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400' : isLandingPage ? 'text-gray-800 hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400' : 'text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'}`}>Sign In</Link>
                <Link to="/signin" className="btn btn-primary dark:bg-indigo-700 dark:hover:bg-primary-600">Get Started</Link>
              </>
            )}
          </div>
          
          <div className="md:hidden">
            <button onClick={toggleMenu} className={`${isScrolled || !isLandingPage ? 'text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400' : isLandingPage ? 'text-gray-800 hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400' : 'text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'}`}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4">
            <nav className="flex flex-col space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              {isLandingPage ? (
                <>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-left text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => scrollToSection('pricing')}
                    className="text-left text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                  >
                    Pricing
                  </button>
                </>
              ) : (
                <>
                  <Link to="/#features" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">Features</Link>
                  <Link to="/#pricing" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">Pricing</Link>
                </>
              )}
              <Link to="/documentation" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">Documentation</Link>
              <Link to="/api-reference" className="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400">API Reference</Link>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {user ? (
                  <Link to="/app" className="block text-primary-600 hover:text-primary font-medium dark:text-primary-400 dark:hover:text-primary-400">Dashboard</Link>
                ) : (
                  <>
                    <Link to="/signin" className="block text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 mb-4">Sign In</Link>
                    <Link to="/signin" className="btn btn-primary w-full dark:bg-indigo-700 dark:hover:bg-primary-600">Get Started</Link>
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