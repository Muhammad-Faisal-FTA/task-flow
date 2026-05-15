// public/sw-custom.js
// Custom service worker — handles offline cache + background sync

const CACHE_NAME    = "taskflow-v1";
const SYNC_TAG      = "taskflow-sync";
const QUEUE_DB_NAME = "taskflow-queue";
const QUEUE_STORE   = "pending-requests";

// ── Assets to precache ────────────────────────────────────────────────────────
const PRECACHE_URLS = [
  "/",
  "/offline.html",
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB_NAME, 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(QUEUE_STORE, {
        keyPath:       "id",
        autoIncrement: true,
      });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function enqueueRequest(request) {
  const db    = await openQueueDB();
  const body  = await request.clone().text().catch(() => null);
  const entry = {
    url:     request.url,
    method:  request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(QUEUE_STORE, "readwrite");
    const store = tx.objectStore(QUEUE_STORE);
    store.add(entry).onsuccess = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

async function getQueuedRequests() {
  const db = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx      = db.transaction(QUEUE_STORE, "readonly");
    const store   = tx.objectStore(QUEUE_STORE);
    const all     = store.getAll();
    all.onsuccess = e => resolve(e.target.result);
    all.onerror   = e => reject(e.target.error);
  });
}

async function clearQueuedRequest(id) {
  const db = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(QUEUE_STORE, "readwrite");
    const store = tx.objectStore(QUEUE_STORE);
    store.delete(id).onsuccess = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

// ── Fetch handler ─────────────────────────────────────────────────────────────
self.addEventListener("fetch", event => {
  const { request } = event;
  const url         = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // API requests — network first, queue on offline
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Static assets — cache first
  if (
    request.destination === "script" ||
    request.destination === "style"  ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached ?? fetch(request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Page requests — network first, offline fallback
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request) ?? caches.match("/offline.html")
    )
  );
});

// ── API request handler ───────────────────────────────────────────────────────
async function handleApiRequest(request) {
  const isWrite = ["POST", "PATCH", "PUT", "DELETE"].includes(request.method);

  try {
    // Try network first
    const response = await fetch(request.clone());

    // Cache successful GET responses
    if (request.method === "GET" && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    // Network failed

    if (isWrite) {
      // Queue write for background sync
      await enqueueRequest(request);

      // Register background sync if supported
      if ("sync" in self.registration) {
        await self.registration.sync.register(SYNC_TAG);
      }

      // Return optimistic success response
      return new Response(
        JSON.stringify({
          data:    null,
          offline: true,
          message: "Saved offline. Will sync when connection is restored.",
        }),
        {
          status:  202,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Read — return cached response
    const cached = await caches.match(request);
    if (cached) return cached;

    // No cache — return offline response
    return new Response(
      JSON.stringify({
        error:   "You are offline.",
        offline: true,
      }),
      {
        status:  503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// ── Background sync ───────────────────────────────────────────────────────────
self.addEventListener("sync", event => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushQueue());
  }
});

async function flushQueue() {
  const queued = await getQueuedRequests();

  for (const entry of queued) {
    try {
      const response = await fetch(entry.url, {
        method:  entry.method,
        headers: entry.headers,
        body:    entry.body ?? undefined,
      });

      if (response.ok) {
        await clearQueuedRequest(entry.id);
        console.log(`[SW] Synced: ${entry.method} ${entry.url}`);
      }
    } catch (err) {
      // Still offline — leave in queue
      console.warn(`[SW] Sync failed, will retry: ${entry.url}`, err);
      break;
    }
  }

  // Notify all open clients to refresh
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach(client =>
    client.postMessage({ type: "SYNC_COMPLETE" })
  );
}

// ── Online event — trigger sync ───────────────────────────────────────────────
self.addEventListener("message", event => {
  if (event.data?.type === "ONLINE") {
    flushQueue();
  }
});