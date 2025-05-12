import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import InAppHelp from '../common/InAppHelp';
import { HelpCircle } from 'lucide-react';

const AppLayout: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 dark:bg-gray-800 dark:text-gray-100">
          <Outlet />
        </main>
        
        {/* Help Button */}
        <button
          className="fixed bottom-6 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => setShowHelp(true)}
          aria-label="Open Help"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
        
        {/* In-App Help Panel */}
        <InAppHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    </div>
  );
};

export default AppLayout;