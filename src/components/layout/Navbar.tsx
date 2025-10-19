import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  Settings, 
  HelpCircle, 
  User,
  LogOut,
  Plus
} from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useUser } from '../../context/UserContext';
import { useNotifications, NotificationCenter } from '../common/NotificationSystem'; 
import SkeletonLoader from '../common/SkeletonLoader';
import ThemeToggle from '../common/ThemeToggle';
import NewProjectModal from '../common/NewProjectModal';

const Navbar: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { userProfile, isLoadingProfile } = useUser();
  const { signOut } = useAuth();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-10 flex-shrink-0 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
      <div className="px-4 mx-auto max-w-full">
        <div className="flex justify-between h-16">
          {/* Left section - Logo only */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DF</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                DataFlowHub AI
              </span>
            </Link>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {/* Theme toggle */}
              <ThemeToggle />
              
              {/* Notifications */}
              <NotificationCenter />

              {/* Settings */}
              <Link
                to="/app/settings"
                className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:text-gray-300 dark:hover:text-white transition-colors"
                title="Settings"
              >
                <span className="sr-only">Settings</span>
                <Settings className="h-5 w-5" />
              </Link>

              {/* Help */}
              <Link
                to="/app/documentation"
                className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:text-gray-300 dark:hover:text-white transition-colors"
                title="Help & Documentation"
              >
                <span className="sr-only">Help</span>
                <HelpCircle className="h-5 w-5" />
              </Link>

              {/* Profile dropdown */}
              <div className="relative">
                <div>
                  <button
                    type="button"
                    className="bg-white dark:bg-gray-700 rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover:ring-2 hover:ring-indigo-400 transition-all"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    {isLoadingProfile ? (
                      <SkeletonLoader circle width={32} height={32} />
                    ) : userProfile?.avatarUrl ? (
                      <img 
                        src={userProfile.avatarUrl} 
                        alt={userProfile.fullName || 'User'} 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </button>
                </div>
                
                {showUserMenu && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    
                    {/* Dropdown Menu */}
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-20 divide-y divide-gray-100 dark:divide-gray-700">
                      {/* User Info Section */}
                      <div className="px-4 py-3">
                        {isLoadingProfile ? (
                          <>
                            <SkeletonLoader height={16} className="mb-2" />
                            <SkeletonLoader height={14} width="80%" />
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {userProfile?.fullName || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {userProfile?.email}
                            </p>
                          </>
                        )}
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to="/app/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="mr-3 h-4 w-4 text-gray-400" />
                          Your Profile
                        </Link>
                        <Link
                          to="/app/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="mr-3 h-4 w-4 text-gray-400" />
                          Settings
                        </Link>
                        <Link
                          to="/app/documentation"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <HelpCircle className="mr-3 h-4 w-4 text-gray-400" />
                          Help & Docs
                        </Link>
                      </div>
                      
                      {/* Sign Out */}
                      <div className="py-1">
                        <button
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
      
      {/* New Project Modal */}
      <NewProjectModal 
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </nav>
  );
};

export default Navbar;