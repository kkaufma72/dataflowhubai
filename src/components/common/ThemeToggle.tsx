import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { userProfile, updateUserProfile, isLoadingProfile } = useUser();
  const currentTheme = userProfile?.preferences?.theme || 'light';

  const toggleTheme = async () => {
    if (isLoadingProfile || !userProfile) return;
    
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    try {
      await updateUserProfile({
        preferences: {
          ...userProfile.preferences,
          theme: newTheme
        }
      });
      
      // Apply theme to document
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Failed to update theme preference:', error);
    }
  };

  // Apply theme on component mount
  React.useEffect(() => {
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

  return (
    <button
      onClick={toggleTheme}
      disabled={isLoadingProfile}
      aria-label={currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`p-2 rounded-full transition-colors ${
        currentTheme === 'dark' 
          ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${className}`}
    >
      {currentTheme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;