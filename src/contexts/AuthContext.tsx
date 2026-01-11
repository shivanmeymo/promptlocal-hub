import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthAdapter, getDatabaseAdapter } from '@/adapters/factory';
import type { AuthUser } from '@/adapters/interfaces';
import { syncUserProfile, deleteUserProfile } from '@/integrations/supabase/auth-sync';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  linkPassword: (password: string) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get adapters
  const authAdapter = getAuthAdapter();
  const dbAdapter = getDatabaseAdapter();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await dbAdapter.getProfile(userId);

    if (!error && data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    // Listen to auth state changes using adapter
    const unsubscribe = authAdapter.onAuthStateChanged(async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        console.log('👤 User authenticated:', authUser.email);
        
        // Sync user with Supabase profile
        const { error: syncError } = await syncUserProfile(
          authUser.id,
          authUser.email || '',
          authUser.displayName,
          authUser.photoURL
        );
        
        if (syncError) {
          console.error('Failed to sync user profile to Supabase:', syncError);
        }
        
        // Fetch profile from database
        await fetchProfile(authUser.id);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await authAdapter.signUp(email, password, { displayName: fullName });
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await authAdapter.signIn(email, password);
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async () => {
    const { error } = await authAdapter.signInWithGoogle();
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    const { error } = await authAdapter.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
    } else {
      console.error('Sign out error:', error);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) {
      return { error: new Error('No user email available') };
    }

    try {
      // Verify current password by re-authenticating
      const { error: signInError } = await authAdapter.signIn(user.email, currentPassword);
      if (signInError) {
        return { error: new Error('Current password is incorrect') };
      }
      
      // Update to new password
      const { error } = await authAdapter.updatePassword(newPassword);
      
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: new Error('Current password is incorrect or failed to update') };
    }
  };

  const linkPassword = async (password: string) => {
    const { error } = await authAdapter.linkPassword(password);
    return { error: error ? new Error(error.message) : null };
  };

  const deleteAccount = async () => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      // Delete user profile from database first
      await deleteUserProfile(user.id);
      
      // Delete account using adapter
      const { error } = await authAdapter.deleteAccount();

      if (!error) {
        // Clear local state
        setUser(null);
        setProfile(null);
      }

      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      console.error('Error deleting account:', err);
      return { error: err as Error };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updatePassword,
        linkPassword,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
