// Firebase client initialization (modular SDK)
// Import this only where needed to avoid increasing bundle size unnecessarily.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { checkFirebaseConfig } from '@/lib/firebase-diagnostics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Run diagnostics in development
if (import.meta.env.DEV) {
  const isValid = checkFirebaseConfig();
  if (!isValid) {
    console.error('⚠️ Firebase will not work properly without complete configuration');
  }
}

// Validate required fields
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration is incomplete. Required fields missing.');
  console.error('Check that all VITE_FIREBASE_* environment variables are set in .env.local');
  throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Register service worker for Firebase Cloud Messaging
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered:', registration);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

// Export Firebase Auth instance
export { firebaseApp as app };
