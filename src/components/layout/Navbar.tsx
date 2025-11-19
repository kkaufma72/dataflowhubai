import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Settings, 
  HelpCircle, 
  User,
  LogOut,
  Plus,
  Search,
  Command
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useUser } from '../../context/UserContext';
import SkeletonLoader from '../common/SkeletonLoader';
import ThemeToggle from '../common/ThemeToggle';
import NewProjectModal from '../common/NewProjectModal';
import Logo from '../common/Logo';
import NotificationCenter from '../common/NotificationCenter';

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { userProfile, isLoadingProfile } = useUser();
  const { signOut } = useAuth();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Listen for custom event from Sidebar
  React.useEffect(() => {
    const handleOpenNewProjectModal = () => setShowNewProjectModal(true);
    window.addEventListener('openNewProjectModal', handleOpenNewProjectModal);
    return () => window.removeEventListener('openNewProjectModal', handleOpenNewProjectModal);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-10 flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 dark:bg-gray-900/95 dark:border-gray-700 shadow-sm">
      <div className="px-4 mx-auto max-w-full">
        <div className="flex justify-between h-16">
          {/* Left section - Professional Logo */}
          <div className="flex items-center">
            <Link to="/app" className="flex items-center">
              <Logo variant="horizontal" size="md" />
            </Link>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {/* Search Button */}
              <button
                onClick={onOpenCommandPalette}
                className="hidden sm:flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all border border-gray-200 dark:border-gray-700 group"
                title="Search (⌘K)"
              >
                <Search className="h-4 w-4" />
                <span className="text-xs font-medium">Search</span>
                <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded shadow-sm">
                  <Command className="h-3 w-3 mr-0.5" />
                  K
                </kbd>
              </button>

              {/* Mobile search icon only */}
              <button
                onClick={onOpenCommandPalette}
                className="sm:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Theme toggle */}
              <ThemeToggle />
              
              {/* Notifications */}
              <NotificationCenter />

              {/* Settings */}
              <Link
                to="/app/settings"
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>

              {/* Help */}
              <Link
                to="/app/documentation"
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                title="Help & Documentation"
              >
                <HelpCircle className="h-5 w-5" />
              </Link>

              {/* New Project Button */}
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                title="Create New Project"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Project</span>
              </button>

              {/* Divider */}
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                >
                  {isLoadingProfile ? (
                    <SkeletonLoader className="w-8 h-8 rounded-full" />
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white dark:ring-gray-900">
                        {userProfile?.fullName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {userProfile?.fullName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {userProfile?.email}
                        </p>
                      </div>
                    </>
                  )}
                </button>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl bg-white dark:bg-gray-800 shadow-strong ring-1 ring-black ring-opacity-5 animate-fade-in">
                      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {userProfile?.fullName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {userProfile?.email}
                        </p>
                      </div>
                      
                      <div className="py-1">
                        <Link
                          to="/app/profile"
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="mr-3 h-4 w-4 text-gray-400" />
                          Your Profile
                        </Link>
                        <Link
                          to="/app/settings"
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="mr-3 h-4 w-4 text-gray-400" />
                          Settings
                        </Link>
                        <Link
                          to="/app/documentation"
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <HelpCircle className="mr-3 h-4 w-4 text-gray-400" />
                          Help & Docs
                        </Link>
                      </div>
                      
                      <div className="py-1 border-t border-gray-100 dark:border-gray-700">
                        <button
                          className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          onClick={() => {
                            setShowUserMenu(false);
                            handleSignOut();
                          }}
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <NewProjectModal 
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </nav>
  );
};

export default Navbar;