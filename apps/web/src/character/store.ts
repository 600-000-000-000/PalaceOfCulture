import type { Character } from "@600b/shared";

// CharacterStore — the seam between the builder/app and where character rows live.
//
// Plug-and-play today = IndexedDB on the device: the player owns their record, no server needed,
// survives reload. The same interface swaps to the apps/server SQLite truth-tier + append-only
// event log later (ADR 0003) — the builder and the app never change. This mirrors the chat/voice
// transport pattern (ADR 0002).

export interface CharacterStore {
  /** The active player's character (single-character PoC), or null if none created yet. */
  loadCurrent(): Promise<Character | null>;
  /** Persist a character and mark it current. */
  save(character: Character): Promise<void>;
  /** Forget the current character (e.g. "start over"). */
  clearCurrent(): Promise<void>;
}

const DB_NAME = "600b";
const STORE = "characters";
const CURRENT_KEY = "600b:currentCharacterId";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function request<T>(
  store: IDBObjectStore,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = run(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** The plug-and-play store: characters in IndexedDB, the "current" pointer in localStorage. */
export function createIndexedDbCharacterStore(): CharacterStore {
  return {
    async loadCurrent() {
      const id = localStorage.getItem(CURRENT_KEY);
      if (!id) return null;
      const db = await openDb();
      try {
        const record = await request<Character | undefined>(
          db.transaction(STORE, "readonly").objectStore(STORE),
          (store) => store.get(id),
        );
        return record ?? null;
      } finally {
        db.close();
      }
    },
    async save(character) {
      const db = await openDb();
      try {
        await request(db.transaction(STORE, "readwrite").objectStore(STORE), (store) =>
          store.put(character),
        );
        localStorage.setItem(CURRENT_KEY, character.id);
      } finally {
        db.close();
      }
    },
    async clearCurrent() {
      localStorage.removeItem(CURRENT_KEY);
    },
  };
}

/** Factory the app calls. IndexedDB today; SQLite truth-tier + event log later (ADR 0003). */
export function createCharacterStore(): CharacterStore {
  return createIndexedDbCharacterStore();
}
