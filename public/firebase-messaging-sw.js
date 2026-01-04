// Firebase Cloud Messaging Service Worker
// This file handles background notifications

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAhGmqZ6j2TNGzJIGVNOIgKMZzYVAXcVCk",
  authDomain: "nowintown.firebaseapp.com",
  projectId: "nowintown",
  storageBucket: "nowintown.firebasestorage.app",
  messagingSenderId: "952844850642",
  appId: "1:952844850642:web:23fc9836e25f3684c5240b",
  measurementId: "G-Z79MH31ZCJ"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Event';
  const notificationOptions = {
    body: payload.notification?.body || 'Check out this new event!',
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
