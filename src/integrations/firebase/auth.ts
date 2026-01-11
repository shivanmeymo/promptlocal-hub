// Firebase Authentication module
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  linkWithCredential,
  User,
  UserCredential
} from 'firebase/auth';
import { firebaseApp } from './client';

// Initialize Firebase Auth
let auth: ReturnType<typeof getAuth>;

try {
  auth = getAuth(firebaseApp);
  console.log('Firebase Auth initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Auth:', error);
  throw new Error('Firebase Auth initialization failed. Please check your Firebase configuration.');
}

export { auth };

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Optionally update display name
  if (displayName && userCredential.user) {
    const { updateProfile } = await import('firebase/auth');
    await updateProfile(userCredential.user, { displayName });
  }
  
  return userCredential;
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string, 
  password: string
): Promise<UserCredential> => {
  return await signInWithEmailAndPassword(auth, email, password);
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    console.log('Attempting Google sign-in...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Google sign-in successful');
    return result;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide more helpful error messages
    let userMessage = error.message;
    if (error.code === 'auth/invalid-credential') {
      userMessage = 'Google Sign-In configuration error. Please ensure:\n' +
        '1. Google provider is enabled in Firebase Console\n' +
        '2. OAuth consent screen is configured\n' +
        '3. Your email is added as a test user (if app is in Testing mode)\n' +
        '4. Authorized domains include localhost and your production domain';
    } else if (error.code === 'auth/popup-blocked') {
      userMessage = 'Pop-up was blocked by browser. Please allow pop-ups for this site.';
    } else if (error.code === 'auth/popup-closed-by-user') {
      userMessage = 'Sign-in cancelled. Please try again.';
    } else if (error.code === 'auth/unauthorized-domain') {
      userMessage = 'This domain is not authorized. Please add it in Firebase Console → Authentication → Settings → Authorized domains';
    }
    
    error.message = userMessage;
    throw error;
  }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

/**
 * Update password
 */
export const updatePassword = async (newPassword: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  await firebaseUpdatePassword(user, newPassword);
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Get Firebase ID token
 * 
 * TODO: For production - Send this token in Authorization header
 * to Supabase Edge Functions for server-side validation
 * 
 * Example:
 * const token = await getIdToken();
 * fetch('your-supabase-function', {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 */
export const getIdToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken(forceRefresh);
};

/**
 * Auth state change listener
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  await user.delete();
};

/**
 * Link password to existing account (for Google users who want to add email/password login)
 */
export const linkPasswordToAccount = async (password: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No user logged in or no email available');
  }

  // Check if user already has password provider
  const hasPasswordProvider = user.providerData.some(
    provider => provider.providerId === 'password'
  );

  if (hasPasswordProvider) {
    throw new Error('Account already has password authentication enabled');
  }

  // Create email/password credential
  const credential = EmailAuthProvider.credential(user.email, password);
  
  // Link the credential to the current account
  await linkWithCredential(user, credential);
};
