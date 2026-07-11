// lib/taskCache.ts
// Lightweight IndexedDB wrapper for task + list caching

const DB_NAME    = "taskflow-cache";
const DB_VERSION = 1;
const STORES     = {
  tasks: "tasks",
  lists: "lists",
  meta:  "meta",
} as const;

// ─── Open DB ──────────────────────────────────────────────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result;

      // Tasks store — keyed by id
      if (!db.objectStoreNames.contains(STORES.tasks)) {
        db.createObjectStore(STORES.tasks, { keyPath: "id" });
      }

      // Lists store — keyed by id
      if (!db.objectStoreNames.contains(STORES.lists)) {
        db.createObjectStore(STORES.lists, { keyPath: "id" });
      }

      // Meta store — for timestamps etc
      if (!db.objectStoreNames.contains(STORES.meta)) {
        db.createObjectStore(STORES.meta);
      }
    };

    req.onsuccess = e => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror   = e => reject((e.target as IDBOpenDBRequest).error);
  });
}

// ─── Generic helpers ──────────────────────────────────────────────────────────
function txGet<T>(
  db:    IDBDatabase,
  store: string,
  key:   IDBValidKey
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(store, "readonly")
      .objectStore(store)
      .get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
}

function txGetAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(store, "readonly")
      .objectStore(store)
      .getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror   = () => reject(req.error);
  });
}

function txPutAll<T extends object>(
  db:    IDBDatabase,
  store: string,
  items: T[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx       = db.transaction(store, "readwrite");
    const objStore = tx.objectStore(store);

    // Clear existing + write fresh
    objStore.clear();
    for (const item of items) objStore.put(item);

    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

function txPut(
  db:    IDBDatabase,
  store: string,
  key:   IDBValidKey,
  value: unknown
): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(store, "readwrite")
      .objectStore(store)
      .put(value, key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────
import type { TaskDTO, TaskListDTO } from "@/types/task";

// Save tasks to cache
export async function cacheTasks(tasks: TaskDTO[]): Promise<void> {
  try {
    const db = await openDB();
    await txPutAll(db, STORES.tasks, tasks);
    await txPut(db, STORES.meta, "tasks_cached_at", Date.now());
  } catch (err) {
    console.warn("[taskCache] Failed to cache tasks:", err);
  }
}

// Save lists to cache
export async function cacheLists(lists: TaskListDTO[]): Promise<void> {
  try {
    const db = await openDB();
    await txPutAll(db, STORES.lists, lists);
    await txPut(db, STORES.meta, "lists_cached_at", Date.now());
  } catch (err) {
    console.warn("[taskCache] Failed to cache lists:", err);
  }
}

// Get cached tasks
export async function getCachedTasks(): Promise<TaskDTO[]> {
  try {
    const db = await openDB();
    return await txGetAll<TaskDTO>(db, STORES.tasks);
  } catch (err) {
    console.warn("[taskCache] Failed to get cached tasks:", err);
    return [];
  }
}

// Get cached lists
export async function getCachedLists(): Promise<TaskListDTO[]> {
  try {
    const db = await openDB();
    return await txGetAll<TaskListDTO>(db, STORES.lists);
  } catch (err) {
    console.warn("[taskCache] Failed to get cached lists:", err);
    return [];
  }
}

// Get cache age in minutes
export async function getCacheAge(
  key: "tasks_cached_at" | "lists_cached_at"
): Promise<number | null> {
  try {
    const db        = await openDB();
    const timestamp = await txGet<number>(db, STORES.meta, key);
    if (!timestamp) return null;
    return Math.round((Date.now() - timestamp) / 60000);
  } catch {
    return null;
  }
}

// Clear all cache
export async function clearCache(): Promise<void> {
  try {
    const db = await openDB();
    await Promise.all([
      txPutAll(db, STORES.tasks, []),
      txPutAll(db, STORES.lists, []),
    ]);
  } catch (err) {
    console.warn("[taskCache] Failed to clear cache:", err);
  }
}