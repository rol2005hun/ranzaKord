import type { OfflineTrack } from '../types/offline.types';

const DB_NAME = 'ranzaKord-offline';
const DB_VERSION = 1;
const META_STORE = 'track-meta';
const BLOB_STORE = 'track-blobs';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('indexedDB is not defined in this environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'videoId' });
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: 'videoId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTrack(meta: OfflineTrack, audioBlob: Blob): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
  await Promise.all([
    promisify(tx.objectStore(META_STORE).put(meta)),
    promisify(tx.objectStore(BLOB_STORE).put({ videoId: meta.videoId, blob: audioBlob }))
  ]);
}

export async function getTrackBlob(videoId: string): Promise<Blob | undefined> {
  const db = await getDb();
  const tx = db.transaction(BLOB_STORE, 'readonly');
  const result = await promisify<{ videoId: string; blob: Blob } | undefined>(
    tx.objectStore(BLOB_STORE).get(videoId)
  );
  return result?.blob;
}

export async function getTrackMeta(videoId: string): Promise<OfflineTrack | undefined> {
  const db = await getDb();
  const tx = db.transaction(META_STORE, 'readonly');
  return promisify<OfflineTrack | undefined>(tx.objectStore(META_STORE).get(videoId));
}

export async function getAllMetas(): Promise<OfflineTrack[]> {
  const db = await getDb();
  const tx = db.transaction(META_STORE, 'readonly');
  return promisify<OfflineTrack[]>(tx.objectStore(META_STORE).getAll());
}

export async function deleteTrack(videoId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
  await Promise.all([
    promisify(tx.objectStore(META_STORE).delete(videoId)),
    promisify(tx.objectStore(BLOB_STORE).delete(videoId))
  ]);
}

export async function isDownloaded(videoId: string): Promise<boolean> {
  const meta = await getTrackMeta(videoId);
  return meta !== undefined;
}

export function useOfflineDb() {
  return {
    saveTrack,
    getTrackBlob,
    getTrackMeta,
    getAllMetas,
    deleteTrack,
    isDownloaded
  };
}
