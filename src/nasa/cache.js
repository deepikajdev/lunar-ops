export class MemoryCache {
  #entries = new Map();

  async get(key) { return this.#entries.get(key) ?? null; }
  async set(key, value) { this.#entries.set(key, value); }
  async delete(key) { this.#entries.delete(key); }
}

export class IndexedDbCache {
  constructor({ indexedDB = globalThis.indexedDB, databaseName = 'lunar-ops-nasa-cache', storeName = 'entries' } = {}) {
    this.indexedDB = indexedDB;
    this.databaseName = databaseName;
    this.storeName = storeName;
    this.databasePromise = null;
  }

  async #database() {
    if (!this.indexedDB) return null;
    if (!this.databasePromise) {
      this.databasePromise = new Promise((resolve, reject) => {
        const request = this.indexedDB.open(this.databaseName, 1);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(this.storeName)) database.createObjectStore(this.storeName);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('NASA cache database open was blocked.'));
      }).catch((error) => {
        this.databasePromise = null;
        throw error;
      });
    }
    return this.databasePromise;
  }

  async get(key) {
    const database = await this.#database();
    if (!database) return null;
    return new Promise((resolve, reject) => {
      const request = database.transaction(this.storeName, 'readonly').objectStore(this.storeName).get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  async set(key, value) {
    const database = await this.#database();
    if (!database) return;
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(this.storeName, 'readwrite');
      transaction.objectStore(this.storeName).put(value, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('NASA cache write aborted.'));
    });
  }

  async delete(key) {
    const database = await this.#database();
    if (!database) return;
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(this.storeName, 'readwrite');
      transaction.objectStore(this.storeName).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('NASA cache delete aborted.'));
    });
  }
}
