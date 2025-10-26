import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';

interface UserContextType {
  userProfile: UserProfile | null;
  isLoadingProfile: boolean;
  error: string | null;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      setError(null);

      // Get current user from localStorage to avoid hanging
      const authData = localStorage.getItem('sb-bcobpxgktvgfsffdsiog-auth-token');
      if (!authData) {
        setUserProfile(null);
        return;
      }

      let session: any = null;
      try {
        const parsedAuth = JSON.parse(authData);
        if (parsedAuth?.user && parsedAuth?.access_token) {
          session = {
            user: parsedAuth.user,
            access_token: parsedAuth.access_token,
            refresh_token: parsedAuth.refresh_token
          };
        }
      } catch (e) {
        console.warn('Could not parse session from localStorage');
        setUserProfile(null);
        return;
      }

      if (!session?.user) {
        setUserProfile(null);
        return;
      }

      // Fetch user profile from database
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        // If it's not the "no rows returned" error, throw it
        if (error.code !== 'PGRST116') {
          throw error;
        }
        
        // If profile doesn't exist, create a new one
        const newProfile = {
          user_id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || '',
          avatar_url: session.user.user_metadata?.avatar_url || null,
          job_title: null,
          company: null,
          bio: null,
          location: null,
          website: null,
          social_links: {},
          preferences: {
            theme: 'light',
            emailNotifications: true,
            twoFactorAuth: false
          }
        };

        const { data: newData, error: createError } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        // Transform to our UserProfile type
        setUserProfile({
          id: newData.id,
          userId: newData.user_id,
          email: newData.email,
          fullName: newData.full_name,
          avatarUrl: newData.avatar_url,
          jobTitle: newData.job_title,
          company: newData.company,
          bio: newData.bio,
          location: newData.location,
          website: newData.website,
          socialLinks: newData.social_links || {},
          preferences: newData.preferences || {
            theme: 'light',
            emailNotifications: true,
            twoFactorAuth: false
          },
          createdAt: newData.created_at,
          updatedAt: newData.updated_at
        });
      } else if (data) {
        // Transform to our UserProfile type
        setUserProfile({
          id: data.id,
          userId: data.user_id,
          email: data.email,
          fullName: data.full_name,
          avatarUrl: data.avatar_url,
          jobTitle: data.job_title,
          company: data.company,
          bio: data.bio,
          location: data.location,
          website: data.website,
          socialLinks: data.social_links || {},
          preferences: data.preferences || {
            theme: 'light',
            emailNotifications: true,
            twoFactorAuth: false
          },
          createdAt: data.created_at,
          updatedAt: data.updated_at
        });
      } else {
        // No data returned and no error - create a new profile
        const newProfile = {
          user_id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || '',
          avatar_url: session.user.user_metadata?.avatar_url || null,
          job_title: null,
          company: null,
          bio: null,
          location: null,
          website: null,
          social_links: {},
          preferences: {
            theme: 'light',
            emailNotifications: true,
            twoFactorAuth: false
          }
        };

        const { data: newData, error: createError } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        // Transform to our UserProfile type
        setUserProfile({
          id: newData.id,
          userId: newData.user_id,
          email: newData.email,
          fullName: newData.full_name,
          avatarUrl: newData.avatar_url,
          jobTitle: newData.job_title,
          company: newData.company,
          bio: newData.bio,
          location: newData.location,
          website: newData.website,
          socialLinks: newData.social_links || {},
          preferences: newData.preferences || {
            theme: 'light',
            emailNotifications: true,
            twoFactorAuth: false
          },
          createdAt: newData.created_at,
          updatedAt: newData.updated_at
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();

    // Listen for auth state changes via custom events
    const handleAuthChange = () => {
      fetchUserProfile();
    };

    const handleSignOut = () => {
      setUserProfile(null);
    };

    window.addEventListener('auth-state-changed', handleAuthChange);
    window.addEventListener('auth-signed-out', handleSignOut);

    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
      window.removeEventListener('auth-signed-out', handleSignOut);
    };
  }, []);

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      setError(null);
      
      if (!userProfile) {
        throw new Error('No user profile found');
      }

      // Convert from our UserProfile type to database schema
      const dbUpdates: any = {};
      
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.jobTitle !== undefined) dbUpdates.job_title = updates.jobTitle;
      if (updates.company !== undefined) dbUpdates.company = updates.company;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.website !== undefined) dbUpdates.website = updates.website;
      if (updates.socialLinks !== undefined) dbUpdates.social_links = updates.socialLinks;
      if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences;

      const { error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('user_id', userProfile.userId);

      if (error) throw error;

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError('Failed to update profile');
      toast.error('Failed to update profile');
      throw err;
    }
  };

  const refreshUserProfile = async () => {
    await fetchUserProfile();
  };

  return (
    <UserContext.Provider
      value={{
        userProfile,
        isLoadingProfile,
        error,
        updateUserProfile,
        refreshUserProfile
      }}
    >
      {children}
    </UserContext.Provider>
  );
};