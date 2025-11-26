// Global Keyboard Shortcuts Component
import React, { useEffect, useState } from 'react';
import { Keyboard, X, Command, Search, Upload, Database, MessageSquare, TrendingUp } from 'lucide-react';

interface KeyboardShortcutsProps {
  onCommandPalette?: () => void;
  onSearch?: () => void;
  onUpload?: () => void;
  onFRED?: () => void;
  onChat?: () => void;
  onHelp?: () => void;
}

interface Shortcut {
  keys: string[];
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'actions' | 'help';
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onCommandPalette,
  onSearch,
  onUpload,
  onFRED,
  onChat,
  onHelp
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Shortcut[] = [
    {
      keys: ['⌘', 'K'],
      label: 'Open Command Palette',
      icon: <Command className="w-4 h-4" />,
      action: onCommandPalette || (() => {}),
      category: 'navigation'
    },
    {
      keys: ['⌘', '/'],
      label: 'Focus Search',
      icon: <Search className="w-4 h-4" />,
      action: onSearch || (() => {}),
      category: 'navigation'
    },
    {
      keys: ['⌘', 'U'],
      label: 'Upload Dataset',
      icon: <Upload className="w-4 h-4" />,
      action: onUpload || (() => {}),
      category: 'actions'
    },
    {
      keys: ['⌘', 'E'],
      label: 'FRED Economic Data',
      icon: <TrendingUp className="w-4 h-4" />,
      action: onFRED || (() => {}),
      category: 'actions'
    },
    {
      keys: ['⌘', 'J'],
      label: 'Open AI Assistant',
      icon: <MessageSquare className="w-4 h-4" />,
      action: onChat || (() => {}),
      category: 'actions'
    },
    {
      keys: ['?'],
      label: 'Show Keyboard Shortcuts',
      icon: <Keyboard className="w-4 h-4" />,
      action: () => setShowHelp(true),
      category: 'help'
    }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for modifier keys
      const isMod = e.metaKey || e.ctrlKey;
      
      // ⌘/Ctrl + K → Command Palette
      if (isMod && e.key === 'k') {
        e.preventDefault();
        onCommandPalette?.();
      }
      
      // ⌘/Ctrl + / → Focus Search
      if (isMod && e.key === '/') {
        e.preventDefault();
        onSearch?.();
      }
      
      // ⌘/Ctrl + U → Upload
      if (isMod && e.key === 'u') {
        e.preventDefault();
        onUpload?.();
      }
      
      // ⌘/Ctrl + E → FRED
      if (isMod && e.key === 'e') {
        e.preventDefault();
        onFRED?.();
      }
      
      // ⌘/Ctrl + J → AI Chat
      if (isMod && e.key === 'j') {
        e.preventDefault();
        onChat?.();
      }
      
      // ? → Show shortcuts help (without modifier)
      if (e.key === '?' && !isMod && !e.shiftKey) {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
      
      // Escape → Close help
      if (e.key === 'Escape') {
        setShowHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCommandPalette, onSearch, onUpload, onFRED, onChat, onHelp]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-popIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-xl">
              <Keyboard className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-500">Speed up your workflow</p>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 space-y-6">
          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Navigation
            </h3>
            <div className="space-y-2">
              {shortcuts.filter(s => s.category === 'navigation').map((shortcut, idx) => (
                <ShortcutRow key={idx} shortcut={shortcut} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {shortcuts.filter(s => s.category === 'actions').map((shortcut, idx) => (
                <ShortcutRow key={idx} shortcut={shortcut} />
              ))}
            </div>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Help
            </h3>
            <div className="space-y-2">
              {shortcuts.filter(s => s.category === 'help').map((shortcut, idx) => (
                <ShortcutRow key={idx} shortcut={shortcut} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 font-mono">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};

const ShortcutRow: React.FC<{ shortcut: Shortcut }> = ({ shortcut }) => (
  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
    <div className="flex items-center gap-3">
      <span className="text-gray-400">{shortcut.icon}</span>
      <span className="text-sm text-gray-700">{shortcut.label}</span>
    </div>
    <div className="flex items-center gap-1">
      {shortcut.keys.map((key, idx) => (
        <React.Fragment key={idx}>
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-700 shadow-sm">
            {key}
          </kbd>
          {idx < shortcut.keys.length - 1 && (
            <span className="text-gray-400 text-xs">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

export default KeyboardShortcuts;

