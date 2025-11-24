import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcutHandlers {
  onUpload?: () => void;
  onTrain?: () => void;
  onDeploy?: () => void;
  onSearch?: () => void;
  onToggleSidebar?: () => void;
}

export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers = {}) => {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Command/Ctrl + K - Command Palette (already handled by CommandPalette component)
      // We'll skip this one to avoid conflicts

      // Command/Ctrl + U - Upload Dataset
      if (modifier && e.key === 'u') {
        e.preventDefault();
        if (handlers.onUpload) {
          handlers.onUpload();
        } else {
          navigate('/app/data');
        }
      }

      // Command/Ctrl + T - Train Model
      if (modifier && e.key === 't') {
        e.preventDefault();
        if (handlers.onTrain) {
          handlers.onTrain();
        } else {
          navigate('/app/train');
        }
      }

      // Command/Ctrl + D - Deploy Model
      if (modifier && e.key === 'd') {
        e.preventDefault();
        if (handlers.onDeploy) {
          handlers.onDeploy();
        } else {
          navigate('/app/deploy');
        }
      }

      // Command/Ctrl + B - Toggle Sidebar
      if (modifier && e.key === 'b') {
        e.preventDefault();
        if (handlers.onToggleSidebar) {
          handlers.onToggleSidebar();
        }
      }

      // Command/Ctrl + / - Show Keyboard Shortcuts
      if (modifier && e.key === '/') {
        e.preventDefault();
        setShowHelp(true);
      }

      // / (alone) - Focus Search
      if (e.key === '/' && !modifier && !e.shiftKey) {
        const target = e.target as HTMLElement;
        // Only if not in an input/textarea
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (handlers.onSearch) {
            handlers.onSearch();
          } else {
            // Focus on search input if it exists
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
          }
        }
      }

      // Command/Ctrl + 1-9 - Navigate to sections
      if (modifier && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const sections = [
          '/app',           // 1 - Dashboard
          '/app/data',      // 2 - Data
          '/app/insights',  // 3 - Insights
          '/app/train',     // 4 - Train
          '/app/evaluate',  // 5 - Evaluate
          '/app/deploy',    // 6 - Deploy
          '/app/monitor',   // 7 - Monitor
          '/app/settings',  // 8 - Settings
          '/app/usage'      // 9 - Usage
        ];
        const index = parseInt(e.key) - 1;
        if (sections[index]) {
          navigate(sections[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, navigate]);

  return {
    showHelp,
    setShowHelp
  };
};
