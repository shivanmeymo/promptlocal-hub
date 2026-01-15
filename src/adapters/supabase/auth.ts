/**
 * Supabase Authentication Adapter
 * Implements IAuthAdapter interface for Supabase Auth
 * 
 * NOTE: Currently this app uses Firebase for auth, so Supabase auth is not fully configured.
 * This adapter provides a path for future migration if needed.
 */

import type { IAuthAdapter, AuthUser, AuthError, AuthStateCallback } from '../interfaces';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, AuthError as SupabaseAuthError } from '@supabase/supabase-js';

/**
 * Convert Supabase User to our generic AuthUser interface
 */
function convertSupabaseUser(user: SupabaseUser): AuthUser {
  return {
    id: user.id,
    uid: user.id,
    email: user.email || null,
    displayName: user.user_metadata?.full_name || user.user_metadata?.display_name || null,
    photoURL: user.user_metadata?.avatar_url || null,
    emailVerified: user.email_confirmed_at !== null,
    providerData: user.identities || [],
  };
}

/**
 * Convert Supabase error to our generic AuthError
 */
function convertSupabaseError(error: SupabaseAuthError | null): AuthError | null {
  if (!error) return null;
  
  return {
    code: error.status?.toString() || 'unknown',
    message: error.message || 'An unknown error occurred',
  };
}

export class SupabaseAuthAdapter implements IAuthAdapter {
  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    metadata?: { displayName?: string }
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata?.displayName,
          },
        },
      });

      if (error) {
        return {
          user: null,
          error: convertSupabaseError(error),
        };
      }

      return {
        user: data.user ? convertSupabaseUser(data.user) : null,
        error: null,
      };
    } catch (error: any) {
      console.error('Supabase sign up error:', error);
      return {
        user: null,
        error: { code: 'unknown', message: error.message },
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          user: null,
          error: convertSupabaseError(error),
        };
      }

      return {
        user: data.user ? convertSupabaseUser(data.user) : null,
        error: null,
      };
    } catch (error: any) {
      console.error('Supabase sign in error:', error);
      return {
        user: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return {
          user: null,
          error: convertSupabaseError(error),
        };
      }

      // OAuth returns immediately without user data (user comes via callback)
      return {
        user: null,
        error: null,
      };
    } catch (error: any) {
      console.error('Supabase Google sign in error:', error);
      return {
        user: null,
        error: { code: 'unknown', message: error.message },
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: convertSupabaseError(error) };
    } catch (error: any) {
      console.error('Supabase sign out error:', error);
      return { error: { code: 'unknown', message: error.message } };
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    // Note: getUser() returns a promise, but we need sync method
    // In practice, use onAuthStateChanged or fetch session
    console.warn('SupabaseAuthAdapter.getCurrentUser() is async in nature. Use onAuthStateChanged instead.');
    return null;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: AuthStateCallback): () => void {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      callback(data.session?.user ? convertSupabaseUser(data.session.user) : null);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ? convertSupabaseUser(session.user) : null);
    });

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error: convertSupabaseError(error) };
    } catch (error: any) {
      console.error('Supabase password reset error:', error);
      return { error: { code: 'unknown', message: error.message } };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error: convertSupabaseError(error) };
    } catch (error: any) {
      console.error('Supabase update password error:', error);
      return { error: { code: 'unknown', message: error.message } };
    }
  }

  /**
   * Link password to existing account
   * Note: Supabase handles this differently than Firebase
   */
  async linkPassword(password: string): Promise<{ error: AuthError | null }> {
    try {
      // In Supabase, you update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      return { error: convertSupabaseError(error) };
    } catch (error: any) {
      console.error('Supabase link password error:', error);
      return { error: { code: 'unknown', message: error.message } };
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<{ error: AuthError | null }> {
    try {
      // Supabase doesn't have built-in delete user from client
      // You need to call an Edge Function or use Admin API
      // For now, return an error indicating this needs server-side implementation
      
      console.error('Supabase account deletion requires server-side implementation');
      return {
        error: {
          code: 'not_implemented',
          message: 'Account deletion requires calling the delete-user-account Edge Function',
        },
      };
    } catch (error: any) {
      console.error('Supabase delete account error:', error);
      return { error: { code: 'unknown', message: error.message } };
    }
  }
}
