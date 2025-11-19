// IBM Watson-Inspired App Layout
// Clean white background with professional navigation

import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarIBM from './SidebarIBM';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

const AppLayoutIBM: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <SidebarIBM />

      {/* Main Content Area */}
      <div className="ml-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between px-8 py-4">
            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search datasets, models, or documentation..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-600">View profile</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayoutIBM;
