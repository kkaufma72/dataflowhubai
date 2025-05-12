import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, Info, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { createPortal } from 'react-dom';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  createdAt: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children,
  maxNotifications = 5
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Create portal container on mount
  useEffect(() => {
    // Check if container already exists
    const existingContainer = document.getElementById('notification-toast-container');
    
    if (existingContainer) {
      setPortalContainer(existingContainer);
      return;
    }
    
    // Create new container if it doesn't exist
    const newContainer = document.createElement('div');
    newContainer.id = 'notification-toast-container';
    newContainer.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-md';
    document.body.appendChild(newContainer);
    setPortalContainer(newContainer);

    return () => {
      // Only remove the container if it's a child of document.body
      if (newContainer && document.body.contains(newContainer)) {
        document.body.removeChild(newContainer);
      }
    };
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      read: false,
      duration: notification.duration || (notification.type === 'error' ? 8000 : 4000)
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    if (notification.duration) {
      setTimeout(() => {
        markAsRead(id);
      }, notification.duration);
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
      // Only show browser notifications for important alerts
      if (notification.type === 'error' || notification.type === 'warning') {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icon-192.png'
          });
        } catch (error) {
          console.error('Error showing browser notification:', error);
        }
      }
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          // Only show browser notifications for important alerts
          if (notification.type === 'error' || notification.type === 'warning') {
            try {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/icon-192.png'
              });
            } catch (error) {
              console.error('Error showing browser notification:', error);
            }
          }
        }
      });
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        const withDates = parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
        setNotifications(withDates);
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll
      }}
    >
      {children}
      {portalContainer && createPortal(
        <NotificationToasts 
          notifications={notifications.filter(n => !n.read).slice(0, 2)} 
          removeNotification={removeNotification}
          markAsRead={markAsRead}
        />,
        portalContainer
      )}
    </NotificationContext.Provider>
  );
};

interface NotificationToastsProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
}

const NotificationToasts: React.FC<NotificationToastsProps> = ({ 
  notifications, 
  removeNotification,
  markAsRead
}) => {
  if (notifications.length === 0) return null;

  return (
    <>
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => markAsRead(notification.id)}
        />
      ))}
    </>
  );
};

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50';
      case 'warning':
        return 'bg-amber-50';
      case 'error':
        return 'bg-red-50';
      case 'info':
      default:
        return 'bg-blue-50';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-amber-800';
      case 'error':
        return 'text-red-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div 
      className={`${getBgColor()} p-4 rounded-lg shadow-lg border border-gray-200 animate-fade-in transition-all duration-300 transform translate-y-0 opacity-100`}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0" aria-hidden="true">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${getTextColor()}`}>
            {notification.title}
          </h3>
          <div className={`mt-1 text-sm ${getTextColor().replace('800', '700')}`}>
            <p>{notification.message}</p>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className={`inline-flex text-gray-400 focus:outline-none focus:text-gray-500 rounded-md p-1.5 hover:bg-gray-100`}
            aria-label="Close notification"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" aria-live="polite">
      <button
        className="relative p-1 text-gray-400 bg-white rounded-full hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={unreadCount > 0 ? `View notifications (${unreadCount} unread)` : "View notifications"}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="sr-only">View notifications</span>
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-10"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="notification-menu"
        >
          <div className="p-3 border-b border-gray-200 flex justify-between items-center" role="menuitem">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            <div className="flex space-x-2">
              {notifications.length > 0 && (
                <button
                  onClick={unreadCount > 0 ? markAllAsRead : clearAll}
                  className="text-xs text-indigo-600 hover:text-indigo-500 px-2 py-1 rounded hover:bg-indigo-50"
                  aria-label={unreadCount > 0 ? "Mark all notifications as read" : "Clear all notifications"}
                >
                  {unreadCount > 0 ? 'Mark all as read' : 'Clear all'}
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              <div>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                      {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                      {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400" />}
                      {notification.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {notification.createdAt.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationProvider;