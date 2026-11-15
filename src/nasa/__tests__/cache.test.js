import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryCache, IndexedDbCache } from '../cache.js';

test('memory cache supports independent get, set and delete operations', async () => {
  const cache = new MemoryCache();
  await cache.set('cme', { events: [] });
  assert.deepEqual(await cache.get('cme'), { events: [] });
  await cache.delete('cme');
  assert.equal(await cache.get('cme'), null);
});

test('IndexedDB cache safely degrades when IndexedDB is unavailable', async () => {
  const cache = new IndexedDbCache({ indexedDB: undefined });
  assert.equal(await cache.get('k'), null);
  assert.equal(await cache.set('k', { events: [] }), undefined);
  assert.equal(await cache.delete('k'), undefined);
});

test('IndexedDB cache opens a versioned object store and supports CRUD', async () => {
  const entries = new Map();
  const storeNames = new Set();
  const database = {
    objectStoreNames: { contains: (name) => storeNames.has(name) },
    createObjectStore: (name) => storeNames.add(name),
    transaction() {
      const transaction = {
        objectStore: () => ({
          get(key) {
            const request = { result: entries.get(key) };
            queueMicrotask(() => request.onsuccess?.());
            return request;
          },
          put(value, key) {
            entries.set(key, value);
            queueMicrotask(() => transaction.oncomplete?.());
          },
          delete(key) {
            entries.delete(key);
            queueMicrotask(() => transaction.oncomplete?.());
          },
        }),
      };
      return transaction;
    },
  };
  const indexedDB = {
    open: () => {
      const request = { result: database };
      queueMicrotask(() => {
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
  const cache = new IndexedDbCache({ indexedDB, databaseName: 'unit-test', storeName: 'events' });
  await cache.set('one', { events: ['cached'] });
  assert.deepEqual(await cache.get('one'), { events: ['cached'] });
  await cache.delete('one');
  assert.equal(await cache.get('one'), null);
});
