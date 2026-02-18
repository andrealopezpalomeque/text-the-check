// Firebase Messaging Service Worker
// Handles push notifications when the app is in background or closed

console.log('[firebase-messaging-sw.js] Service Worker loaded');

// ============================================
// Sentry error reporting (lightweight, no SDK)
// ============================================
const SENTRY_DSN = 'https://ca4d274b77449c12c943bc986c31cc36@o4510864892624896.ingest.us.sentry.io/4510864895508480';

function sendToSentry(error, context = {}) {
  try {
    const dsn = new URL(SENTRY_DSN);
    const projectId = dsn.pathname.replace('/', '');
    const sentryKey = dsn.username;
    const envelopeUrl = `${dsn.protocol}//${dsn.host}/api/${projectId}/envelope/?sentry_key=${sentryKey}&sentry_version=7`;

    const envelope = [
      JSON.stringify({ dsn: SENTRY_DSN, sent_at: new Date().toISOString() }),
      JSON.stringify({ type: 'event' }),
      JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ''),
        timestamp: Date.now() / 1000,
        platform: 'javascript',
        environment: 'production',
        tags: { source: 'firebase-messaging-sw', ...context.tags },
        exception: {
          values: [{
            type: error.name || 'Error',
            value: error.message || String(error),
            stacktrace: error.stack ? { frames: parseStack(error.stack) } : undefined
          }]
        },
        extra: context.extra || {}
      })
    ].join('\n');

    fetch(envelopeUrl, { method: 'POST', body: envelope }).catch(() => {});
  } catch (e) {
    console.error('[firebase-messaging-sw.js] Failed to send to Sentry:', e);
  }
}

function parseStack(stack) {
  return stack.split('\n').slice(1, 10).map(line => {
    const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/) ||
                  line.match(/at\s+(.+):(\d+):(\d+)/);
    if (!match) return { filename: line.trim(), lineno: 0, colno: 0, function: '?' };
    if (match.length === 5) {
      return { function: match[1], filename: match[2], lineno: +match[3], colno: +match[4] };
    }
    return { function: '?', filename: match[1], lineno: +match[2], colno: +match[3] };
  }).reverse();
}

// Catch unhandled SW errors
self.addEventListener('error', (event) => {
  sendToSentry(event.error || new Error(event.message), {
    tags: { handler: 'onerror' }
  });
});

self.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
  sendToSentry(error, { tags: { handler: 'unhandledrejection' } });
});

// ============================================
// NOTE: We intentionally do NOT import or initialize the Firebase Messaging
// SDK (firebase-messaging-compat.js) in this service worker.
//
// Why: The FCM SDK registers its own internal `push` event listener that
// auto-displays notifications when the payload contains a `notification` field.
// Since we handle push explicitly below with showNotification(), having the
// FCM SDK active causes DUPLICATE notifications (one from FCM, one from us).
//
// This has been a recurring issue — especially visible on Safari/iOS which
// also auto-displays push payloads with a notification field.
//
// Token registration (getToken) works independently via the client-side FCM
// SDK in firebase.ts — it only needs this SW to be registered, not for it
// to run firebase.messaging() internally.
// ============================================

// Log when service worker is activated
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
});

// Handle push events explicitly — required for reliable iOS Safari delivery.
// iOS aggressively kills service workers and silently drops notifications
// if event.waitUntil() + showNotification() aren't called synchronously.
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received');

  let title = 'PayTrackr';
  let options = {
    body: '',
    icon: '/img/new-logo.png',
    badge: '/img/new-logo.png',
    data: { url: '/fijos' }
  };

  try {
    const payload = event.data?.json();
    if (payload) {
      title = payload.notification?.title || title;
      options.body = payload.notification?.body || '';
      options.icon = payload.notification?.icon || options.icon;
      options.badge = payload.notification?.badge || options.badge;
      options.data = payload.data || options.data;
    }
  } catch (e) {
    console.warn('[firebase-messaging-sw.js] Could not parse push payload:', e);
    sendToSentry(e, {
      tags: { handler: 'push_parse' },
      extra: { rawData: event.data?.text() }
    });
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Get the URL to open (from notification data or default)
  const urlToOpen = event.notification.data?.url || '/fijos';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
