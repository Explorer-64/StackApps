import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getFirebaseAuth } from '@/lib/firebase';
import { updatePassword, deleteUser, EmailAuthProvider, linkWithCredential, updateProfile, updateEmail, User } from 'firebase/auth';
import { useLocation } from 'wouter';
import { isAdmin } from '@/lib/admins';
import { SiteFooter } from '@/components/SiteFooter';
import { ImageUpload } from '@/components/ImageUpload';
import { ArrowLeft, Shield, UserCircle, Trash2 } from 'lucide-react';
import { NoIndex } from '@/components/NoIndex';

export default function SettingsPage() {
  const { user, loading } = useCurrentUser();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Settings user={user} />;
}

function Settings({ user }: { user: User }) {
  const [, navigate] = useLocation();
  
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [email, setEmail] = useState(user.email || '');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isUserAdmin = isAdmin(user);
  
  const hasPasswordProvider = user.providerData.some(p => p.providerId === 'password');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    try {
      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL
      });

      if (email !== user.email) {
        await updateEmail(user, email);
      }

      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'For security, please log out and log back in before changing your email.' });
      } else if (error.code === 'auth/email-already-in-use') {
        setMessage({ type: 'error', text: 'This email is already in use by another account.' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setIsUpdating(true);
    setMessage(null);

    try {
      await updatePassword(user, password);
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'For security, please log out and log back in before changing your password.' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to update password' });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match' });
        return;
    }
    
    setIsUpdating(true);
    setMessage(null);

    try {
        const credential = EmailAuthProvider.credential(user.email!, password);
        await linkWithCredential(user, credential);
        setMessage({ type: 'success', text: 'Password added successfully. You can now sign in with email/password.' });
        setPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        setMessage({ type: 'error', text: error.message || 'Failed to add password' });
    } finally {
        setIsUpdating(false);
    }
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsUpdating(true);
    try {
      await deleteUser(user);
      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'For security, please log out and log back in before deleting your account.' });
        setShowDeleteConfirm(false);
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to delete account' });
        setShowDeleteConfirm(false);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NoIndex />
      <header className="bg-cyber-black/80 backdrop-blur-md border-b border-cyber-light sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-white" data-testid="text-page-title">Account Settings</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-neon-blue hover:text-white font-medium transition-colors"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        
        {message && (
          <div className={`mb-6 p-4 rounded-sm border ${message.type === 'success' ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-red-900/20 border-red-800 text-red-400'}`} data-testid="message-status">
            {message.text}
          </div>
        )}

        <section className="bg-cyber-gray border border-cyber-light rounded-lg p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-neon-blue" />
            Profile Information
          </h2>
          
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Avatar
                </label>
                <div className="w-32">
                   <ImageUpload 
                      currentImageUrl={photoURL}
                      onImageUploaded={setPhotoURL}
                   />
                </div>
              </div>
              
              <div className="flex-grow space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 bg-cyber-dark border border-cyber-light rounded-sm text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                    placeholder="Enter your display name"
                    data-testid="input-display-name"
                  />
                  <p className="mt-1 text-xs text-gray-500">This is how you will appear to other users.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-cyber-dark border border-cyber-light rounded-sm text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                    placeholder="Enter your email"
                    required
                    data-testid="input-email"
                  />
                  <div className="mt-2 flex gap-2 flex-wrap">
                     {user.providerData.map((provider) => (
                        <span key={provider.providerId} className="px-2 py-0.5 rounded text-xs bg-cyber-dark border border-cyber-light text-gray-300">
                            {provider.providerId === 'google.com' ? 'Google' : 'Email/Password'}
                        </span>
                     ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-6 py-2 bg-neon-blue hover:bg-white text-black font-bold rounded-sm transition-colors disabled:opacity-50"
                    data-testid="button-save-profile"
                  >
                    {isUpdating ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>

        {isUserAdmin && (
          <section className="bg-cyber-gray border border-cyber-light rounded-lg p-6 mb-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-neon-purple" />
              Admin Control Center
            </h2>
            <p className="text-gray-400 mb-6">
              Access the moderation dashboard to review app submissions and manage the platform.
            </p>
            <button
              onClick={() => navigate('/admin')}
              className="px-6 py-2 bg-neon-purple hover:bg-white text-white hover:text-black font-bold rounded-sm transition-colors shadow-[0_0_10px_rgba(189,0,255,0.3)]"
              data-testid="button-admin-dashboard"
            >
              Go to Admin Dashboard
            </button>
          </section>
        )}

        <section className="bg-cyber-gray border border-cyber-light rounded-lg p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-neon-green" />
            Security
          </h2>

          <form onSubmit={hasPasswordProvider ? handleUpdatePassword : handleAddPassword} className="space-y-4 max-w-md">
            <h3 className="text-lg font-medium text-white">
                {hasPasswordProvider ? 'Change Password' : 'Add Password'}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
                {hasPasswordProvider 
                    ? 'Update your existing password.' 
                    : 'Add a password to sign in with your email address in addition to Google.'}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-cyber-dark border border-cyber-light rounded-sm text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                placeholder="Minimum 6 characters"
                minLength={6}
                required
                data-testid="input-new-password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-cyber-dark border border-cyber-light rounded-sm text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                placeholder="Re-enter password"
                minLength={6}
                required
                data-testid="input-confirm-password"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="mt-2 px-6 py-2 bg-transparent border border-neon-green text-neon-green hover:bg-neon-green hover:text-black font-bold rounded-sm transition-colors disabled:opacity-50"
              data-testid="button-update-password"
            >
              {isUpdating ? 'Processing...' : (hasPasswordProvider ? 'Update Password' : 'Set Password')}
            </button>
          </form>
        </section>

        <section className="bg-red-900/10 border border-red-900/30 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </h2>
          <p className="text-gray-400 mb-6">
            Once you delete your account, there is no going back. All your data will be permanently removed.
          </p>
          
          {showDeleteConfirm ? (
            <div className="space-y-4 bg-red-900/20 p-4 rounded-sm border border-red-900/50">
              <p className="text-white font-medium">Are you absolutely sure?</p>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-sm transition-colors disabled:opacity-50"
                  data-testid="button-confirm-delete"
                >
                  {isUpdating ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-transparent hover:bg-white/10 text-white font-medium rounded-sm transition-colors"
                  data-testid="button-cancel-delete"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-2 bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-sm transition-colors"
              data-testid="button-delete-account"
            >
              Delete Account
            </button>
          )}
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
