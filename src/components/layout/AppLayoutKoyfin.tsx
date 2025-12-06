// App Layout with Koyfin Dark Theme
// Consistent terminal aesthetic throughout the app

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { KeyboardShortcuts } from '../common/KeyboardShortcuts';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const AppLayoutKoyfin: React.FC = () => {
  const { showHelp, setShowHelp } = useKeyboardShortcuts();

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-950 text-gray-100">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcuts isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};

export default AppLayoutKoyfin;

