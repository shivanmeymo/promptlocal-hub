/**
 * Firebase Authentication Adapter
 * Implements IAuthAdapter interface for Firebase Auth
 */

import type { IAuthAdapter, AuthUser, AuthError, AuthStateCallback } from '../interfaces';
import {
  auth,
  signUpWithEmail as firebaseSignUp,
  signInWithEmail as firebaseSignIn,
  signInWithGoogle as firebaseGoogleSignIn,
  signOut as firebaseSignOut,
  resetPassword as firebaseResetPassword,
  getCurrentUser as firebaseGetCurrentUser,
  onAuthStateChange as firebaseOnAuthStateChange,
  updatePassword as firebaseUpdatePassword,
  linkPasswordToAccount as firebaseLinkPassword,
  deleteUserAccount as firebaseDeleteAccount,
} from '@/integrations/firebase/auth';

/**
 * Convert Firebase User to our generic AuthUser interface
 */
function convertFirebaseUser(user: any): AuthUser {
  return {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    providerData: user.providerData,
  };
}

/**
 * Convert Firebase error to our generic AuthError
 */
function convertFirebaseError(error: any): AuthError {
  return {
    code: error.code || 'unknown',
    message: error.message || 'An unknown error occurred',
  };
}

export class FirebaseAuthAdapter implements IAuthAdapter {
  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    metadata?: { displayName?: string }
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const userCredential = await firebaseSignUp(email, password, metadata?.displayName);
      return {
        user: convertFirebaseUser(userCredential.user),
        error: null,
      };
    } catch (error) {
      console.error('Firebase sign up error:', error);
      return {
        user: null,
        error: convertFirebaseError(error),
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const userCredential = await firebaseSignIn(email, password);
      return {
        user: convertFirebaseUser(userCredential.user),
        error: null,
      };
    } catch (error) {
      console.error('Firebase sign in error:', error);
      return {
        user: null,
        error: convertFirebaseError(error),
      };
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const userCredential = await firebaseGoogleSignIn();
      return {
        user: convertFirebaseUser(userCredential.user),
        error: null,
      };
    } catch (error) {
      console.error('Firebase Google sign in error:', error);
      return {
        user: null,
        error: convertFirebaseError(error),
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      await firebaseSignOut();
      return { error: null };
    } catch (error) {
      console.error('Firebase sign out error:', error);
      return { error: convertFirebaseError(error) };
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    const user = firebaseGetCurrentUser();
    return user ? convertFirebaseUser(user) : null;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: AuthStateCallback): () => void {
    return firebaseOnAuthStateChange((user) => {
      callback(user ? convertFirebaseUser(user) : null);
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<{ error: AuthError | null }> {
    try {
      await firebaseResetPassword(email);
      return { error: null };
    } catch (error) {
      console.error('Firebase password reset error:', error);
      return { error: convertFirebaseError(error) };
    }
  }

  /**
   * Update user password (requires current user to be signed in)
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      await firebaseUpdatePassword(newPassword);
      return { error: null };
    } catch (error) {
      console.error('Firebase update password error:', error);
      return { error: convertFirebaseError(error) };
    }
  }

  /**
   * Link password to existing account (for social auth users)
   */
  async linkPassword(password: string): Promise<{ error: AuthError | null }> {
    try {
      await firebaseLinkPassword(password);
      return { error: null };
    } catch (error) {
      console.error('Firebase link password error:', error);
      return { error: convertFirebaseError(error) };
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<{ error: AuthError | null }> {
    try {
      await firebaseDeleteAccount();
      return { error: null };
    } catch (error) {
      console.error('Firebase delete account error:', error);
      return { error: convertFirebaseError(error) };
    }
  }

  /**
   * Get Firebase ID token (useful for authenticating with other services)
   */
  async getIdToken(forceRefresh = false): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Error getting Firebase ID token:', error);
      return null;
    }
  }
}
