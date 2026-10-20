// Konsol sürümü için chrome.storage / chrome.runtime benzeri katman: localStorage üzerinde çalışır.
const chrome = (() => {
  const PREFIX = "unfollowRadar:";
  const listeners = [];
  const read = (k) => {
    try {
      const v = localStorage.getItem(PREFIX + k);
      return v == null ? undefined : JSON.parse(v);
    } catch {
      return undefined;
    }
  };
  const emit = (changes) => listeners.forEach((f) => { try { f(changes); } catch (e) { console.error(e); } });
  const local = {
    async get(keys) {
      const list = keys == null ? [] : Array.isArray(keys) ? keys : [keys];
      const out = {};
      for (const k of list) { const v = read(k); if (v !== undefined) out[k] = v; }
      return out;
    },
    async set(obj) {
      const changes = {};
      for (const [k, v] of Object.entries(obj)) {
        const json = JSON.stringify(v);
        try {
          localStorage.setItem(PREFIX + k, json);
        } catch {
          localStorage.removeItem(PREFIX + "scanProgress"); // kota dolduysa önbelleği feda et
          localStorage.setItem(PREFIX + k, json);
        }
        changes[k] = { newValue: v };
      }
      emit(changes);
    },
    async remove(keys) {
      const changes = {};
      for (const k of [].concat(keys)) { localStorage.removeItem(PREFIX + k); changes[k] = { newValue: undefined }; }
      emit(changes);
    },
    async clear() {
      const changes = {};
      for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) { localStorage.removeItem(k); changes[k.slice(PREFIX.length)] = { newValue: undefined }; }
      emit(changes);
    },
  };
  return {
    storage: { local, onChanged: { addListener: (f) => listeners.push(f) } },
    runtime: { sendMessage: (msg) => consoleRouter(msg) },
  };
})();
const store = { get: (k) => chrome.storage.local.get(k), set: (o) => chrome.storage.local.set(o) };
