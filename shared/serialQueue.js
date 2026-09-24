// A failed write must not prevent the next queued edit from being saved.
export function createSerialQueue() {
  const pending = new Map();
  return function enqueue(key, operation) {
    const next = (pending.get(key) || Promise.resolve()).catch(() => {}).then(operation);
    pending.set(key, next);
    const cleanup = () => { if (pending.get(key) === next) pending.delete(key); };
    next.then(cleanup, cleanup);
    return next;
  };
}
