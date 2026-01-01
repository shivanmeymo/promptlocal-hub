// Firebase client initialization (modular SDK)
// Import this only where needed to avoid increasing bundle size unnecessarily.
import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Lazy import example for services to keep bundles smaller:
// export const getAuthInstance = async () => (await import('firebase/auth')).getAuth(firebaseApp);
// export const getFirestoreInstance = async () => (await import('firebase/firestore')).getFirestore(firebaseApp);
// export const getAnalyticsInstance = async () => (await import('firebase/analytics')).getAnalytics(firebaseApp);
