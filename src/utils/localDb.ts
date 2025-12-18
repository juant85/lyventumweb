// src/utils/localDb.ts
import { PendingScanPayload } from '../types';

const DB_NAME = 'evently-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_scans';

let db: IDBDatabase | null = null;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening IndexedDB.');
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const tempDb = request.result;
      if (!tempDb.objectStoreNames.contains(STORE_NAME)) {
        tempDb.createObjectStore(STORE_NAME, { keyPath: 'localId' });
      }
    };
  });
};

export const addPendingScan = async (scan: PendingScanPayload): Promise<void> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(scan);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Failed to add pending scan to local DB.');
    transaction.oncomplete = () => console.log(`LocalDB: Scan for ${scan.attendeeId} saved.`);
    transaction.onerror = () => reject(`Transaction error while adding pending scan.`);
  });
};

export const getPendingScans = async (): Promise<PendingScanPayload[]> => {
  const currentDb = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = currentDb.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as PendingScanPayload[]);
    request.onerror = () => reject('Failed to retrieve pending scans from local DB.');
  });
};

export const deletePendingScan = async (localId: string): Promise<void> => {
    const currentDb = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(localId);
  
      request.onsuccess = () => resolve();
      request.onerror = () => reject(`Failed to delete pending scan ID ${localId} from local DB.`);
      transaction.oncomplete = () => console.log(`LocalDB: Scan ${localId} deleted after sync.`);
    });
};

export const clearPendingScans = async (): Promise<void> => {
    const currentDb = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = currentDb.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(`Failed to clear pending scans.`);
    });
};