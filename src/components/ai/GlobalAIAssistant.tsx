import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Bot, X } from 'lucide-react';
import { SplineScene } from '../ui/splite';

const ChatComponent = React.lazy(() => import('./EnhancedAIChat'));

interface AIChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
}

export const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within AIChatProvider');
  }
  return context;
};

export const AIChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenChat = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(true);
  };

  const handleCloseChat = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
  };

  return (
    <AIChatContext.Provider value={{ isOpen, openChat: handleOpenChat, closeChat: handleCloseChat }}>
      {children}
      
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpenChat}
          className={`fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-primary-600 to-primary-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 group ${
            showPulse ? 'animate-pulse' : ''
          }`}
          title="Open Robot Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6" />
            {showPulse && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            )}
          </div>
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Ask Robot Assistant
          </div>
        </button>
      )}

      {/* Full Screen Chat Modal */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleCloseChat}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full h-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col relative">
              <button
                type="button"
                onClick={handleCloseChat}
                className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <div className="border-b border-gray-200">
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-900">
                    <SplineScene
                      scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">Robot Copilot</div>
                    <div className="text-xs text-gray-500">Ask questions about your workspace and data</div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <React.Suspense fallback={<div className="flex items-center justify-center h-full"><p>Loading chat...</p></div>}>
                  <ChatComponent />
                </React.Suspense>
              </div>
            </div>
          </div>
        </>
      )}
    </AIChatContext.Provider>
  );
};

export { AIChatProvider as GlobalAIAssistant };
export default AIChatProvider;