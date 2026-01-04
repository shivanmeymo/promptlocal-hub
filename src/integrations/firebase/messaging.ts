// Firebase Cloud Messaging setup for push notifications
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { firebaseApp } from './client';

let messaging: Messaging | null = null;

/**
 * Initialize Firebase Cloud Messaging
 */
export const initializeMessaging = (): Messaging | null => {
  try {
    if (typeof window === 'undefined') return null;
    
    if (!messaging) {
      messaging = getMessaging(firebaseApp);
    }
    return messaging;
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
    return null;
  }
};

/**
 * Request permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const messaging = initializeMessaging();
      if (!messaging) return null;

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error('VAPID key not found in environment variables');
        return null;
      }

      const token = await getToken(messaging, { vapidKey });
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = (callback: (payload: any) => void) => {
  const messaging = initializeMessaging();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

/**
 * Check if notifications are supported
 */
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};
