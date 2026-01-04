import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
  deleteUserAccount as firebaseDeleteAccount,
  onAuthStateChange,
} from '@/integrations/firebase/auth';
import { syncUserProfile, deleteUserProfile } from '@/integrations/supabase/auth-sync';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        console.log('👤 Firebase user authenticated:', firebaseUser.email);
        
        // Sync Firebase user with Supabase profile
        const { error: syncError } = await syncUserProfile(
          firebaseUser.uid,
          firebaseUser.email || '',
          firebaseUser.displayName,
          firebaseUser.photoURL
        );
        
        if (syncError) {
          console.error('Failed to sync user profile to Supabase:', syncError);
        }
        
        // Fetch profile from Supabase
        await fetchProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Sign up with Firebase
      await signUpWithEmail(email, password, fullName);
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Sign in with Firebase
      await signInWithEmail(email, password);
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Sign in with Google via Firebase
      await firebaseSignInWithGoogle();
      return { error: null };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) {
      return { error: new Error('No user email available') };
    }

    try {
      // Verify current password by re-authenticating
      await signInWithEmail(user.email, currentPassword);
      
      // Update to new password
      await firebaseUpdatePassword(newPassword);
      
      return { error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: new Error('Current password is incorrect or failed to update') };
    }
  };

  const deleteAccount = async () => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      // Delete user profile from Supabase first
      await deleteUserProfile(user.uid);
      
      // Delete Firebase account
      await firebaseDeleteAccount();

      // Clear local state
      setUser(null);
      setProfile(null);

      return { error: null };
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
