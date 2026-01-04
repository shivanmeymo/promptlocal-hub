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
