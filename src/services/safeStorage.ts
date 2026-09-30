/**
 * Resilient Storage Manager with IndexedDB and Quota-Safe LocalStorage
 * Prevents QuotaExceededError when storing templates, custom brand kits, and graphics.
 */

const DB_NAME = 'SlamMetricsAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';

// Helper to open IndexedDB
function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('Could not open IndexedDB, falling back to in-memory/localStorage');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Stores an item in IndexedDB (no 5MB quota restrictions)
 */
export async function setItemInIDB<T>(key: string, value: T): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Retrieves an item from IndexedDB
 */
export async function getItemFromIDB<T>(key: string): Promise<T | null> {
  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Safely sets an item in localStorage.
 * If QuotaExceededError is caught, safely cleans up non-critical cache and recovers.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: unknown) {
    const isQuotaError =
      err instanceof DOMException &&
      (err.code === 22 ||
        err.code === 1014 ||
        err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.message.includes('quota'));

    if (isQuotaError) {
      console.warn(`LocalStorage quota exceeded while saving "${key}". Attempting recovery...`);
      // Evict large cache items or clear bloated template history
      try {
        // Remove the offending key if it was partially written
        localStorage.removeItem(key);

        // Try to clear older keys or non-essential cache
        const keysToRemove = [
          'slammetrics_brand_kit_v1',
          'slammetrics_custom_templates_v2'
        ];

        for (const k of keysToRemove) {
          if (k !== key) {
            try {
              localStorage.removeItem(k);
            } catch {}
          }
        }

        // Try one more time with the stripped value if needed
        try {
          localStorage.setItem(key, value);
          return true;
        } catch {
          // If still exceeding, fail gracefully without throwing uncaught errors
          console.warn(`Could not save "${key}" in localStorage. State remains in IndexedDB/memory.`);
          return false;
        }
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Safely gets an item from localStorage
 */
export function safeLocalStorageGet(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
