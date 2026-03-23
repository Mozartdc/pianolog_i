const DB_NAME = "pianolog-recordings";
const DB_VERSION = 1;
const STORE_NAME = "recording-files";

const openRecordingDb = async (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("녹음 DB를 열 수 없습니다."));
  });

const withStore = async <T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void
): Promise<T> => {
  const db = await openRecordingDb();

  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);

    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("녹음 저장소 처리 중 오류가 발생했습니다."));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error("녹음 저장소 작업이 중단되었습니다."));
    };

    handler(store, resolve, reject);
  });
};

export const saveRecordingBlob = async (recordingId: string, blob: Blob): Promise<void> => {
  await withStore<void>("readwrite", (store, resolve, reject) => {
    const request = store.put(blob, recordingId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getRecordingBlob = async (recordingId: string): Promise<Blob | null> =>
  withStore<Blob | null>("readonly", (store, resolve, reject) => {
    const request = store.get(recordingId);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });

export const deleteRecordingBlob = async (recordingId: string): Promise<void> => {
  await withStore<void>("readwrite", (store, resolve, reject) => {
    const request = store.delete(recordingId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAudioDurationMs = async (blob: Blob): Promise<number> =>
  new Promise((resolve) => {
    const audio = document.createElement("audio");
    const objectUrl = URL.createObjectURL(blob);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      audio.remove();
    };

    audio.preload = "metadata";
    audio.src = objectUrl;

    audio.onloadedmetadata = () => {
      const durationSec = Number.isFinite(audio.duration) ? audio.duration : 0;
      cleanup();
      resolve(Math.max(0, Math.round(durationSec * 1000)));
    };

    audio.onerror = () => {
      cleanup();
      resolve(0);
    };
  });

export const getMediaKindFromMimeType = (mimeType: string): "audio" | "video" => {
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  return "audio";
};
