
// service-worker.js

// This event is triggered when the service worker is first installed.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  // Ensures the new service worker activates immediately once installed.
  self.skipWaiting();
});

// This event is triggered when the service worker is activated.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  // Forces the activated service worker to take control of the page immediately.
  event.waitUntil(self.clients.claim());
});

// This is the core event for handling push notifications.
// It's triggered when a push message is received from the server.
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received.');

  let notificationData = {
    title: 'New Notification',
    body: 'Something new happened!',
    icon: '/icons/icon-192x192.png', // A default icon
  };

  try {
    // The payload from the server is expected to be a JSON string.
    const payload = event.data.json();
    notificationData = {
        title: payload.title || 'LyVentum Event Reminder',
        body: payload.body || 'You have an upcoming session.',
        icon: payload.icon || '/icons/icon-192x192.png',
    };
  } catch (e) {
    console.error('Service Worker: Push event data parsing error:', e);
    // Use the default data if parsing fails.
    notificationData.body = event.data.text();
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: '/icons/badge-72x72.png', // Small icon for notification bar on Android
    vibrate: [100, 50, 100], // Vibrate pattern
    data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
    },
    actions: [
        { action: 'explore', title: 'Open My Agenda' },
        { action: 'close', title: 'Close' },
    ]
  };

  // Tell the service worker to wait until the notification is shown.
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// This event handles clicks on the notification itself or its action buttons.
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click Received.');
  event.notification.close(); // Close the notification

  if (event.action === 'explore') {
    // When "Open My Agenda" is clicked, open the attendee portal dashboard.
    event.waitUntil(
      clients.openWindow('/portal/dashboard')
    );
  } else {
    // Default action (clicking the notification body) also opens the dashboard.
     event.waitUntil(
      clients.openWindow('/portal/dashboard')
    );
  }
});
