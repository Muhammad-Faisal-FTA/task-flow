// public/sw-push.js
// Handles incoming push events and notification clicks

self.addEventListener("push", event => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "TaskFlow",
      body:  event.data.text(),
    };
  }

  const options = {
    body:    payload.body  ?? "",
    icon:    payload.icon  ?? "/icons/icon-192x192.png",
    badge:   payload.badge ?? "/icons/icon-72x72.png",
    tag:     payload.taskId ?? "taskflow-notification",
    renotify: true,
    data: {
      url:    payload.url    ?? "/",
      taskId: payload.taskId ?? null,
    },
    actions: [
      { action: "open",    title: "Open Task" },
      { action: "dismiss", title: "Dismiss"   },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// ── Notification click handler ─────────────────────────────────────────────────
self.addEventListener("notificationclick", event => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(windowClients => {
        // If app already open — focus it
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.postMessage({
              type:   "NOTIFICATION_CLICK",
              taskId: event.notification.data?.taskId,
            });
            return;
          }
        }
        // App not open — open it
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});