import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import InAppHelp from '../common/InAppHelp';
import GlobalAIAssistant from '../ai/GlobalAIAssistant';
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
        
        {/* Help Button - moved up to avoid AI button */}
        <button
          className="fixed bottom-24 right-6 bg-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all hover:scale-110 z-40"
          onClick={() => setShowHelp(true)}
          aria-label="Open Help"
          title="Help & Support"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
        
        {/* In-App Help Panel */}
        <InAppHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
        
        {/* Global AI Assistant - Always Available */}
        <GlobalAIAssistant />
      </div>
    </div>
  );
};

export default AppLayout;