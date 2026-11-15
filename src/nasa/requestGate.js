/** Generational guard for async view requests; invalidating a token prevents stale/unmounted writes. */
export function createRequestGate() {
  let generation = 0;
  return Object.freeze({
    begin: () => ++generation,
    invalidate: () => { generation += 1; },
    isCurrent: (token) => token === generation,
  });
}
