import React, { useState, useEffect } from 'react';
import { X, Command, Search, Upload, Zap, Rocket, Users, Sidebar } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
}

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  const shortcuts: Shortcut[] = [
    { keys: ['⌘', 'K'], description: 'Open command palette', icon: <Command className="w-4 h-4" /> },
    { keys: ['⌘', 'U'], description: 'Upload dataset', icon: <Upload className="w-4 h-4" /> },
    { keys: ['⌘', 'T'], description: 'Train new model', icon: <Zap className="w-4 h-4" /> },
    { keys: ['⌘', 'D'], description: 'Deploy model', icon: <Rocket className="w-4 h-4" /> },
    { keys: ['⌘', 'B'], description: 'Toggle sidebar', icon: <Sidebar className="w-4 h-4" /> },
    { keys: ['⌘', '/'], description: 'Show keyboard shortcuts' },
    { keys: ['/'], description: 'Focus search', icon: <Search className="w-4 h-4" /> },
    { keys: ['ESC'], description: 'Close modal/dialog' },
    { keys: ['⌘', '1-9'], description: 'Navigate to dashboard sections' },
    { keys: ['⌘', 'Z'], description: 'Undo transformation' },
    { keys: ['⌘', '⇧', 'Z'], description: 'Redo transformation' },
  ];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Command className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                <p className="text-sm text-indigo-100">Work faster with hotkeys</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Shortcuts List */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-3">
              {shortcuts.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors group"
                >
                  {/* Description */}
                  <div className="flex items-center gap-3">
                    {shortcut.icon && (
                      <div className="text-gray-500 group-hover:text-indigo-600 transition-colors">
                        {shortcut.icon}
                      </div>
                    )}
                    <span className="text-gray-700 font-medium">
                      {shortcut.description}
                    </span>
                  </div>

                  {/* Keys */}
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIdx) => (
                      <React.Fragment key={keyIdx}>
                        <kbd className="px-3 py-1.5 bg-white border-2 border-gray-300 rounded-lg text-sm font-mono font-bold text-gray-700 shadow-sm">
                          {key}
                        </kbd>
                        {keyIdx < shortcut.keys.length - 1 && (
                          <span className="text-gray-400 mx-1">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900">
                <strong className="font-bold">💡 Pro tip:</strong> Press{' '}
                <kbd className="px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono">
                  ⌘ /
                </kbd>{' '}
                anytime to see this dialog. On Windows, use{' '}
                <kbd className="px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono">
                  Ctrl
                </kbd>{' '}
                instead of{' '}
                <kbd className="px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono">
                  ⌘
                </kbd>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default KeyboardShortcuts;
