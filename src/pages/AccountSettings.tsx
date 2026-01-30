import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useAuth } from '../components/auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { Moon, Sun, Lock, LogOut, Save, Loader2, Mail, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const AccountSettings: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useUser();
  const { user, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications'>('general');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Password change errors
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Email change form
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    password: ''
  });
  
  // Email change errors
  const [emailErrors, setEmailErrors] = useState({
    newEmail: '',
    password: ''
  });
  
  // Preferences form
  const [preferences, setPreferences] = useState({
    theme: userProfile?.preferences?.theme || 'system',
    emailNotifications: userProfile?.preferences?.emailNotifications || true,
    twoFactorAuth: userProfile?.preferences?.twoFactorAuth || false,
    linkedinAdsTrackingUrl: userProfile?.preferences?.linkedinAdsTrackingUrl || ''
  });

  // Handle preference changes
  const handlePreferenceChange = (name: string, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save preferences
  const savePreferences = async () => {
    if (!userProfile) return;
    
    try {
      setIsUpdating(true);
      
      await updateUserProfile({
        preferences: preferences
      });
      
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    setPasswordErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    
    // Return true if no errors
    return !Object.values(errors).some(error => error);
  };

  // Submit password change
  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    try {
      setIsChangingPassword(true);
      
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordForm.currentPassword
      });
      
      if (signInError) {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      
      if (updateError) throw updateError;
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      if (!passwordErrors.currentPassword) {
        toast.error('Failed to update password');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle email form changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    setEmailErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  // Validate email form
  const validateEmailForm = () => {
    const errors = {
      newEmail: '',
      password: ''
    };
    
    if (!emailForm.newEmail) {
      errors.newEmail = 'New email is required';
    } else if (!/\S+@\S+\.\S+/.test(emailForm.newEmail)) {
      errors.newEmail = 'Please enter a valid email address';
    }
    
    if (!emailForm.password) {
      errors.password = 'Password is required to change email';
    }
    
    setEmailErrors(errors);
    
    // Return true if no errors
    return !Object.values(errors).some(error => error);
  };

  // Submit email change
  const submitEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmailForm()) return;
    
    try {
      setIsUpdating(true);
      
      // First verify password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: emailForm.password
      });
      
      if (signInError) {
        setEmailErrors(prev => ({
          ...prev,
          password: 'Password is incorrect'
        }));
        throw new Error('Password is incorrect');
      }
      
      // Update email
      const { error: updateError } = await supabase.auth.updateUser({
        email: emailForm.newEmail
      });
      
      if (updateError) throw updateError;
      
      // Reset form
      setEmailForm({
        newEmail: '',
        password: ''
      });
      
      toast.success('Email update initiated. Please check your new email for verification.');
    } catch (error) {
      console.error('Error changing email:', error);
      if (!emailErrors.password) {
        toast.error('Failed to update email');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      toast.success('Signed out successfully');
      // AuthProvider handles redirect - no need for additional navigation
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
      setIsSigningOut(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-primary-600">Account Not Found</h2>
        <p className="mt-2 text-gray-600">Please sign in to view your account settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-primary-600 mb-6">Account Settings</h1>
      
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'general'
                  ? 'border-b-2 border-primary text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'security'
                  ? 'border-b-2 border-primary text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-primary text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Theme Preferences</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose how the application looks for you.
                </p>
                
                <div className="mt-4 space-y-4">
                  <div className="flex items-center">
                    <input
                      id="theme-light"
                      name="theme"
                      type="radio"
                      checked={preferences.theme === 'light'}
                      onChange={() => handlePreferenceChange('theme', 'light')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="theme-light" className="ml-3 flex items-center">
                      <Sun className="w-5 h-5 text-amber-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Light</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="theme-dark"
                      name="theme"
                      type="radio"
                      checked={preferences.theme === 'dark'}
                      onChange={() => handlePreferenceChange('theme', 'dark')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="theme-dark" className="ml-3 flex items-center">
                      <Moon className="w-5 h-5 text-primary mr-2" />
                      <span className="text-sm font-medium text-gray-700">Dark</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="theme-system"
                      name="theme"
                      type="radio"
                      checked={preferences.theme === 'system'}
                      onChange={() => handlePreferenceChange('theme', 'system')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="theme-system" className="ml-3 flex items-center">
                      <span className="text-sm font-medium text-gray-700">System Default</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Email Settings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Update your email address.
                </p>
                
                <form onSubmit={submitEmailChange} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      id="newEmail"
                      name="newEmail"
                      value={emailForm.newEmail}
                      onChange={handleEmailChange}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                        emailErrors.newEmail 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-primary focus:ring-primary'
                      }`}
                    />
                    {emailErrors.newEmail && (
                      <p className="mt-1 text-sm text-red-600">{emailErrors.newEmail}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={emailForm.password}
                      onChange={handleEmailChange}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                        emailErrors.password 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-primary focus:ring-primary'
                      }`}
                    />
                    {emailErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{emailErrors.password}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      icon={isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    >
                      {isUpdating ? 'Updating...' : 'Update Email'}
                    </Button>
                  </div>
                </form>
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">LinkedIn Ads Tracking</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the URL you want to track visits to from your LinkedIn ads.
                </p>
                
                <div className="mt-4">
                  <label htmlFor="linkedinAdsTrackingUrl" className="block text-sm font-medium text-gray-700">
                    Tracking URL
                  </label>
                  <input
                    type="url"
                    id="linkedinAdsTrackingUrl"
                    name="linkedinAdsTrackingUrl"
                    value={preferences.linkedinAdsTrackingUrl}
                    onChange={(e) => handlePreferenceChange('linkedinAdsTrackingUrl', e.target.value)}
                    placeholder="https://yourdomain.com/landing-page"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    This URL will be used to track conversions and visits from your LinkedIn advertising campaigns.
                  </p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Account Management</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your account settings.
                </p>
                
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    icon={isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  >
                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  onClick={savePreferences}
                  disabled={isUpdating}
                  icon={isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                >
                  {isUpdating ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Update your password to keep your account secure.
                </p>
                
                <form onSubmit={submitPasswordChange} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                        passwordErrors.currentPassword 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-primary focus:ring-primary'
                      }`}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                        passwordErrors.newPassword 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-primary focus:ring-primary'
                      }`}
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                        passwordErrors.confirmPassword 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-primary focus:ring-primary'
                      }`}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      icon={isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    >
                      {isChangingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication Reminder</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Remember to enable 2FA for added security. This is a preference toggle only—actual 2FA must be configured through your authentication provider.
                </p>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Switch
                      checked={preferences.twoFactorAuth}
                      onChange={(checked) => handlePreferenceChange('twoFactorAuth', checked)}
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {preferences.twoFactorAuth ? 'Reminder Enabled' : 'Reminder Disabled'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-900">Note: Preference Only</h3>
                      <div className="mt-2 text-sm text-blue-800">
                        <p className="mb-2">
                          This toggle is a <strong>reminder preference only</strong> and does not enable actual two-factor authentication.
                        </p>
                        <p>
                          To set up real 2FA security, configure MFA in your Supabase authentication settings or contact your administrator.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  onClick={savePreferences}
                  disabled={isUpdating}
                  icon={isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                >
                  {isUpdating ? 'Saving...' : 'Save Security Settings'}
                </Button>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose what types of emails you'd like to receive.
                </p>
                
                <div className="mt-4 space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email-notifications"
                        name="emailNotifications"
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="email-notifications" className="font-medium text-gray-700">
                        Email Notifications
                      </label>
                      <p className="text-gray-500">
                        Receive email notifications about your account, models, and platform updates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Notification Types</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select the types of notifications you want to receive.
                </p>
                
                <div className="mt-4 space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="model-training"
                        name="modelTraining"
                        type="checkbox"
                        checked={true}
                        disabled={!preferences.emailNotifications}
                        className="h-4 w-4 text-primary-600 focus:ring-primary border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="model-training" className="font-medium text-gray-700">
                        Model Training
                      </label>
                      <p className="text-gray-500">
                        Notifications about model training completion, failures, and performance.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="deployment"
                        name="deployment"
                        type="checkbox"
                        checked={true}
                        disabled={!preferences.emailNotifications}
                        className="h-4 w-4 text-primary-600 focus:ring-primary border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="deployment" className="font-medium text-gray-700">
                        Deployment
                      </label>
                      <p className="text-gray-500">
                        Notifications about model deployments, updates, and issues.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="security"
                        name="security"
                        type="checkbox"
                        checked={true}
                        disabled={!preferences.emailNotifications}
                        className="h-4 w-4 text-primary-600 focus:ring-primary border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="security" className="font-medium text-gray-700">
                        Security
                      </label>
                      <p className="text-gray-500">
                        Security alerts, login attempts, and account changes.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="marketing"
                        name="marketing"
                        type="checkbox"
                        checked={false}
                        disabled={!preferences.emailNotifications}
                        className="h-4 w-4 text-primary-600 focus:ring-primary border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="marketing" className="font-medium text-gray-700">
                        Marketing
                      </label>
                      <p className="text-gray-500">
                        Product updates, new features, and promotional offers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  onClick={savePreferences}
                  disabled={isUpdating}
                  icon={isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                >
                  {isUpdating ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Switch component
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, className = '' }) => {
  return (
    <button
      type="button"
      className={`${checked ? 'bg-primary-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full ${className}`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`${
          checked ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </button>
  );
};

export default AccountSettings;
