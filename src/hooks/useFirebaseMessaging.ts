// React hook for Firebase Cloud Messaging
import { useEffect, useState } from 'react';
import { 
  requestNotificationPermission, 
  onForegroundMessage, 
  isNotificationSupported 
} from '@/integrations/firebase/messaging';

export const useFirebaseMessaging = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setIsSupported(isNotificationSupported());
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    const fcmToken = await requestNotificationPermission();
    if (fcmToken) {
      setToken(fcmToken);
      setPermission('granted');
      return fcmToken;
    }
    return null;
  };

  useEffect(() => {
    if (!isSupported) return;

    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      // Show a notification using the Notification API
      if (payload.notification) {
        new Notification(payload.notification.title || 'New Notification', {
          body: payload.notification.body,
          icon: '/favicon.png',
          badge: '/favicon.png',
        });
      }
    });

    return unsubscribe;
  }, [isSupported]);

  return {
    token,
    isSupported,
    permission,
    requestPermission,
  };
};
