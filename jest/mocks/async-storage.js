// In-memory AsyncStorage stand-in — redux-persist reads/writes through this in tests.
const store = new Map();

module.exports = {
  getItem: jest.fn(key => Promise.resolve(store.has(key) ? store.get(key) : null)),
  setItem: jest.fn((key, value) => {
    store.set(key, value);
    return Promise.resolve(null);
  }),
  removeItem: jest.fn((key) => {
    store.delete(key);
    return Promise.resolve(null);
  }),
  clear: jest.fn(() => {
    store.clear();
    return Promise.resolve(null);
  }),
  getAllKeys: jest.fn(() => Promise.resolve([...store.keys()])),
  multiGet: jest.fn(keys => Promise.resolve(keys.map(k => [k, store.get(k) ?? null]))),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([k, v]) => store.set(k, v));
    return Promise.resolve(null);
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach(k => store.delete(k));
    return Promise.resolve(null);
  }),
};
