import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

const LandingNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  const linkClass = `${isLandingPage && !isScrolled
    ? 'text-white/90 hover:text-white'
    : 'text-gray-800 hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400'} text-sm font-medium`;

  const navLinks = [
    { key: 'features', label: 'Features', scrollId: 'features', href: '/#features' },
    { key: 'pricing', label: 'Pricing', scrollId: 'pricing', href: '/#pricing' },
    { key: 'documentation', label: 'Documentation', href: '/documentation' },
    { key: 'api', label: 'API Reference', href: '/api-reference' },
  ];

  const buttonNavClass = `${linkClass} p-0 bg-transparent border-0 text-left`;
  const mobileButtonClass = 'block w-full text-left text-sm font-medium text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 p-0 bg-transparent border-0';
  const mobileLinkClass = 'block w-full text-left text-sm font-medium text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
    <header
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        isLandingPage && !isScrolled
          ? 'bg-black/60 backdrop-blur-xl border-white/10'
          : 'bg-white/90 backdrop-blur-md border-gray-200 shadow-sm dark:bg-gray-900'
      }`}
    >
      <div className="container-custom px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xl mr-2">D</div>
              <span className={`text-xl font-bold ${isLandingPage && !isScrolled ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                DataFlowHub AI
              </span>
            </Link>
            
            <nav className="hidden md:flex ml-10 space-x-8">
              {navLinks.map((link) => {
                if (isLandingPage && link.scrollId) {
                  return (
                    <button
                      key={link.key}
                      onClick={() => scrollToSection(link.scrollId!)}
                      className={buttonNavClass}
                    >
                      {link.label}
                    </button>
                  );
                }

                return (
                  <Link key={link.key} to={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Link
                to="/app"
                className="text-sm font-medium text-primary-600 hover:text-primary dark:text-primary-400 dark:hover:text-primary-400"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/signin" className={linkClass}>Sign In</Link>
                <Link to="/signin" className={`btn btn-primary ${isLandingPage && !isScrolled ? 'bg-white text-gray-900 hover:bg-white/90' : 'dark:bg-indigo-700 dark:hover:bg-primary-600'}`}>
                  Get Started
                </Link>
              </>
            )}
          </div>
          
          <div className="md:hidden">
            <button onClick={toggleMenu} className={linkClass}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4">
            <nav className="flex flex-col space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              {navLinks.map((link) => {
                if (isLandingPage && link.scrollId) {
                  return (
                    <button
                      key={link.key}
                      onClick={() => scrollToSection(link.scrollId!)}
                      className={mobileButtonClass}
                    >
                      {link.label}
                    </button>
                  );
                }

                return (
                  <Link
                    key={link.key}
                    to={link.href}
                    className={mobileLinkClass}
                  >
                    {link.label}
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {user ? (
                  <Link
                    to="/app"
                    className="block text-sm font-medium text-primary-600 hover:text-primary dark:text-primary-400 dark:hover:text-primary-400"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/signin" className="block text-left text-sm font-medium text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 mb-4">Sign In</Link>
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