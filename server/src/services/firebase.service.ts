import * as admin from 'firebase-admin';
import { appConfig } from '../config';
import { readFileSync } from 'fs';

/**
 * Firebase Admin SDK Service
 * 
 * PURPOSE: Verify Firebase ID tokens sent from the frontend.
 * This runs ONLY on the backend - never in the browser.
 */

let firebaseApp: admin.app.App | null = null;

export function initializeFirebaseAdmin(): void {
  if (firebaseApp) {
    console.log('✅ Firebase Admin already initialized');
    return;
  }

  try {
    let credential: admin.credential.Credential;

    // Option 1: Use service account JSON file
    if (appConfig.firebase.serviceAccountPath) {
      const serviceAccount = JSON.parse(
        readFileSync(appConfig.firebase.serviceAccountPath, 'utf8')
      );
      credential = admin.credential.cert(serviceAccount);
      console.log('🔑 Using Firebase service account from file');
    }
    // Option 2: Use individual environment variables
    else if (
      appConfig.firebase.projectId &&
      appConfig.firebase.clientEmail &&
      appConfig.firebase.privateKey
    ) {
      credential = admin.credential.cert({
        projectId: appConfig.firebase.projectId,
        clientEmail: appConfig.firebase.clientEmail,
        privateKey: appConfig.firebase.privateKey.replace(/\\n/g, '\n'),
      });
      console.log('🔑 Using Firebase credentials from environment variables');
    } else {
      throw new Error('No Firebase credentials provided');
    }

    firebaseApp = admin.initializeApp({
      credential,
      projectId: appConfig.firebase.projectId,
    });

    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

export function getFirebaseAdmin(): admin.app.App {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK not initialized. Call initializeFirebaseAdmin() first.');
  }
  return firebaseApp;
}

/**
 * Verify Firebase ID token
 * 
 * @param idToken - The Firebase ID token from the frontend
 * @returns Decoded token with user information
 */
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  try {
    const decodedToken = await getFirebaseAdmin().auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get Firebase user by UID
 */
export async function getFirebaseUser(uid: string): Promise<admin.auth.UserRecord> {
  try {
    return await getFirebaseAdmin().auth().getUser(uid);
  } catch (error) {
    console.error(`❌ Failed to get Firebase user ${uid}:`, error);
    throw new Error('User not found');
  }
}
