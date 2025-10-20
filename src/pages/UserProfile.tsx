import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useAuth } from '../components/auth/AuthProvider';
import { User, Mail, Briefcase, MapPin, Globe, Twitter, Linkedin, Github, Save, Camera, Loader2 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const UserProfile: React.FC = () => {
  const { userProfile, isLoadingProfile, updateUserProfile } = useUser();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // DEBUG: Log what we have
  useEffect(() => {
    console.log('🔍 UserProfile Debug:', {
      hasUserProfile: !!userProfile,
      userProfile,
      hasAuthUser: !!user,
      authUser: user,
      isLoadingProfile,
      userEmail: user?.email,
      profileEmail: userProfile?.email
    });
  }, [userProfile, user, isLoadingProfile]);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    company: '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    linkedin: '',
    github: ''
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || '',
        jobTitle: userProfile.jobTitle || '',
        company: userProfile.company || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        website: userProfile.website || '',
        twitter: userProfile.socialLinks?.twitter || '',
        linkedin: userProfile.socialLinks?.linkedin || '',
        github: userProfile.socialLinks?.github || ''
      });
    }
  }, [userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateUserProfile({
        fullName: formData.fullName,
        jobTitle: formData.jobTitle,
        company: formData.company,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        socialLinks: {
          twitter: formData.twitter,
          linkedin: formData.linkedin,
          github: formData.github
        }
      });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);
        
      // Update profile with new avatar URL
      await updateUserProfile({
        avatarUrl: publicUrl
      });
      
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // FALLBACK: If no userProfile but we have auth user, show basic info
  if (!userProfile && user) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">User Profile</h1>
        
        <Card>
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome, {user.email}
            </h2>
            <p className="text-gray-600 mb-4">
              Your profile is being set up. Please refresh the page.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Debug Info:</p>
              <p>Auth User ID: {user.id}</p>
              <p>Email: {user.email}</p>
              <p>Profile Loading: {isLoadingProfile ? 'Yes' : 'No'}</p>
            </div>
            <Button 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!userProfile && !user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Profile Not Found</h2>
        <p className="mt-2 text-gray-600">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                  {userProfile?.avatarUrl ? (
                    <img 
                      src={userProfile.avatarUrl} 
                      alt={userProfile.fullName || user?.email || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-100">
                      <User className="w-16 h-16 text-indigo-500" />
                    </div>
                  )}
                </div>
                {!isEditing ? null : (
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
              
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                {userProfile?.fullName || user?.email?.split('@')[0] || 'User'}
              </h2>
              
              {userProfile?.jobTitle && (
                <p className="text-gray-600">{userProfile.jobTitle}</p>
              )}
              
              {userProfile?.company && (
                <p className="text-gray-500 text-sm">{userProfile.company}</p>
              )}
              
              <div className="mt-6 w-full">
                <div className="flex items-center text-gray-600 mb-3">
                  <Mail className="w-5 h-5 mr-2" />
                  <span>{userProfile?.email || user?.email}</span>
                </div>
                
                {userProfile?.location && (
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{userProfile.location}</span>
                  </div>
                )}
                
                {userProfile?.website && (
                  <div className="flex items-center text-gray-600 mb-3">
                    <Globe className="w-5 h-5 mr-2" />
                    <a 
                      href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {userProfile.website}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex space-x-3">
                {userProfile?.socialLinks?.twitter && (
                  <a 
                    href={`https://twitter.com/${userProfile.socialLinks.twitter}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-400"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                
                {userProfile?.socialLinks?.linkedin && (
                  <a 
                    href={`https://linkedin.com/in/${userProfile.socialLinks.linkedin}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-700"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                
                {userProfile?.socialLinks?.github && (
                  <a 
                    href={`https://github.com/${userProfile.socialLinks.github}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-900"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
              </div>
              
              {!isEditing && (
                <Button 
                  className="mt-6 w-full"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </Card>
        </div>
        
        {/* Profile Details / Edit Form */}
        <div className="md:col-span-2">
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {isEditing ? 'Edit Profile' : 'Profile Details'}
            </h3>
            
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
                        Job Title
                      </label>
                      <input
                        type="text"
                        id="jobTitle"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                        Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={3}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                        Website
                      </label>
                      <input
                        type="text"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Social Links</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                          Twitter
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                            @
                          </span>
                          <input
                            type="text"
                            id="twitter"
                            name="twitter"
                            value={formData.twitter}
                            onChange={handleInputChange}
                            className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
                          LinkedIn
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                            in/
                          </span>
                          <input
                            type="text"
                            id="linkedin"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleInputChange}
                            className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="github" className="block text-sm font-medium text-gray-700">
                          GitHub
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                            github.com/
                          </span>
                          <input
                            type="text"
                            id="github"
                            name="github"
                            value={formData.github}
                            onChange={handleInputChange}
                            className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      icon={<Save className="w-4 h-4" />}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {userProfile?.bio && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">About</h4>
                    <p className="mt-2 text-gray-600">{userProfile.bio}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Account Information</h4>
                  <dl className="mt-2 divide-y divide-gray-200">
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{userProfile?.email || user?.email}</dd>
                    </div>
                    
                    {userProfile?.createdAt && (
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(userProfile.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    
                    {userProfile?.updatedAt && (
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(userProfile.updatedAt).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Preferences</h4>
                  <dl className="mt-2 divide-y divide-gray-200">
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Theme</dt>
                      <dd className="text-sm text-gray-900 capitalize">
                        {userProfile?.preferences?.theme || 'Light'}
                      </dd>
                    </div>
                    
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Email Notifications</dt>
                      <dd className="text-sm text-gray-900">
                        {userProfile?.preferences?.emailNotifications ? 'Enabled' : 'Disabled'}
                      </dd>
                    </div>
                    
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Two-Factor Authentication</dt>
                      <dd className="text-sm text-gray-900">
                        {userProfile?.preferences?.twoFactorAuth ? 'Enabled' : 'Disabled'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;