/**
 * Firebase Configuration Diagnostics
 * Run this to check if all Firebase environment variables are properly loaded
 */

export const checkFirebaseConfig = () => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  console.group('🔥 Firebase Configuration Check');
  
  const issues: string[] = [];
  
  Object.entries(config).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const displayValue = value 
      ? (key === 'apiKey' || key === 'appId' ? `${value.substring(0, 10)}...${value.slice(-4)}` : value)
      : 'MISSING';
    
    console.log(`${status} ${key}: ${displayValue}`);
    
    if (!value) {
      issues.push(key);
    }
  });

  if (issues.length > 0) {
    console.error('❌ Missing configuration:', issues.join(', '));
    console.error('Please check your .env.local file and restart the dev server');
    return false;
  } else {
    console.log('✅ All Firebase configuration values are present');
    return true;
  }
  
  console.groupEnd();
};

// Auto-run on import in development
if (import.meta.env.DEV) {
  checkFirebaseConfig();
}
