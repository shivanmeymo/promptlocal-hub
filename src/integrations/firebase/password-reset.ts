// Firebase-based password reset utilities
// Replaces Supabase auth password reset
import { sendPasswordResetEmail as firebaseSendReset } from 'firebase/auth';
import { auth } from './auth';

/**
 * Send password reset email using Firebase
 * @param email - User's email address
 * @returns Promise that resolves when email is sent
 */
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  // Firebase automatically generates and sends the reset link
  // The user will receive an email with a link to reset their password
  // The link goes to the Firebase-hosted reset page by default
  // To use a custom domain, configure Action URL in Firebase Console
  await firebaseSendReset(auth, email, {
    url: `${window.location.origin}/auth`, // Where to redirect after reset
    handleCodeInApp: false,
  });
};

/**
 * Update user password (requires recent authentication)
 * @param newPassword - The new password
 * @returns Promise that resolves when password is updated
 */
export const updatePassword = async (newPassword: string): Promise<void> => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  // Import updatePassword from firebase/auth
  const { updatePassword: fbUpdatePassword } = await import('firebase/auth');
  
  // This will fail if the user hasn't authenticated recently
  // In that case, you need to re-authenticate first using
  // reauthenticateWithCredential or reauthenticateWithPopup
  await fbUpdatePassword(user, newPassword);
};
