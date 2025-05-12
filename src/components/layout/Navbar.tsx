import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  FolderKanban, 
  Bell, 
  Settings, 
  HelpCircle, 
  User,
  Search,
  ChevronDown,
  LogOut,
  Plus,
  Server
} from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useUser } from '../../context/UserContext';
import { useNotifications, NotificationCenter } from '../common/NotificationSystem'; 
import SkeletonLoader from '../common/SkeletonLoader';
import ThemeToggle from '../common/ThemeToggle';
import NewProjectModal from '../common/NewProjectModal';

interface NotificationProps {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const Navbar: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { userProfile, isLoadingProfile } = useUser();
  const { signOut } = useAuth();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-10 flex-shrink-0 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left section */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                DataFlowHub AI
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <Home className="w-5 h-5 mr-1" />
                Dashboard
              </Link>
              <Link
                to="/projects"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <FolderKanban className="w-5 h-5 mr-1" />
                Projects
              </Link>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button
                type="button"
                className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600" 
                onClick={() => setShowNewProjectModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>New Project</span>
              </button>
            </div>
            
            <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
              {/* Search */}
              <div className="relative mr-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Search"
                />
              </div>
              
              {/* Theme toggle */}
              <div className="ml-3">
                <ThemeToggle />
              </div>
              
              {/* Notifications */}
              <div className="ml-3 relative">
                <NotificationCenter />
              </div>

              {/* Settings */}
              <Link
                to="/app/settings"
                className="ml-3 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:text-gray-300 dark:hover:text-white"
              >
                <span className="sr-only">Settings</span>
                <Settings className="h-6 w-6" />
              </Link>

              {/* Help */}
              <Link
                to="/app/documentation"
                className="ml-3 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:text-gray-300 dark:hover:text-white"
              >
                <span className="sr-only">Help</span>
                <HelpCircle className="h-6 w-6" />
              </Link>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700"
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifications(false);
                    }}
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
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </button>
                </div>
                
                {showUserMenu && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 dark:bg-gray-800 dark:ring-gray-700">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      {isLoadingProfile ? (
                        <>
                          <SkeletonLoader height={16} className="mb-1" />
                          <SkeletonLoader height={14} width="80%" />
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{userProfile?.fullName || 'User'}</p>
                          <p className="text-sm text-gray-500 truncate dark:text-gray-400">{userProfile?.email}</p>
                        </>
                      )}
                    </div>
                    <Link
                      to="/app/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/app/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Settings
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleSignOut();
                      }}
                    >
                      <div className="flex items-center">
                        <LogOut className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Sign out
                      </div>
                    </button>
                  </div>
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