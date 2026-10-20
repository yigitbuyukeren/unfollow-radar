importScripts("shared.js", "i18n.js", "queue-core.js");

const store = { get: (k) => chrome.storage.local.get(k), set: (o) => chrome.storage.local.set(o) };
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));
initLang(chrome.storage.local, chrome.storage.onChanged);

// --- Panel: simgeye tıklayınca tam sayfa uygulamayı aç / öne getir ---
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL("app.html");
  const [existing] = await chrome.tabs.query({ url });
  if (existing) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url });
  }
});

// --- Tarama: giriş yapılmış hesap; günlük limit uygulanır ---
async function startCompare() {
  await assertScanQuota();
  const tabs = await chrome.tabs.query({ url: "https://www.instagram.com/*" });
  let tab = tabs.find((t) => !t.url.includes("#ift-"));
  if (!tab) {
    tab = await chrome.tabs.create({ url: "https://www.instagram.com/", active: false });
    await store.set({ tempTab: tab.id });
    for (let i = 0; i < 40; i++) {
      if ((await chrome.tabs.get(tab.id)).status === "complete") break;
      await sleepMs(500);
    }
  }
  for (let i = 0; i < 20; i++) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "compare" });
      return;
    } catch {
      await sleepMs(500); // content script henüz hazır değil
    }
  }
  throw new Error(tx("errConnect"));
}

// İş bitince (ya da hata verince) bizim açtığımız arka plan sekmesini kapat.
chrome.storage.onChanged.addListener(async (changes) => {
  const phase = changes.state?.newValue?.phase;
  if (phase !== "done" && phase !== "error") return;
  const { tempTab } = await store.get("tempTab");
  if (tempTab) {
    chrome.tabs.remove(tempTab).catch(() => {});
    chrome.storage.local.remove("tempTab");
  }
});

// --- Takip / takipten çık: profili arka plan sekmesinde açar, content.js arayüzü sürer ---
async function uiAction(kind, username) {
  if (!USERNAME_RE.test(username)) return { ok: false, error: tx("invalidUser") };
  const tab = await chrome.tabs.create({ url: `https://www.instagram.com/${username}/#ift-${kind}`, active: false });
  const result = await new Promise((resolve) => {
    const onMsg = (m, sender) => {
      if (m?.type === "uiActionResult" && sender.tab?.id === tab.id) {
        chrome.runtime.onMessage.removeListener(onMsg);
        resolve(m);
      }
    };
    chrome.runtime.onMessage.addListener(onMsg);
    setTimeout(() => resolve({ ok: false, error: tx("errTimeout") }), 30000);
  });
  chrome.tabs.remove(tab.id).catch(() => {});
  return result;
}

// queue-core.js'in beklediği platform arayüzü
const host = {
  unfollow: (u) => uiAction("unfollow", u),
  follow: (u) => uiAction("follow", u),
  schedule: (when) => chrome.alarms.create("queue", { when }),
};

chrome.alarms.onAlarm.addListener((a) => a.name === "queue" && pump());
chrome.runtime.onStartup.addListener(pump);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const reply = (p) => p.then(() => sendResponse({ ok: true })).catch((e) => sendResponse({ ok: false, error: e.message }));
  switch (msg?.type) {
    case "startCompare":
      reply(startCompare());
      return true;
    case "enqueue":
      reply(enqueue(msg.usernames || []));
      return true;
    case "queueControl":
      reply(queueControl(msg.op));
      return true;
    case "follow":
      follow(msg.username).then(sendResponse);
      return true;
  }
});

// <dev-reload>
// DEV: dev/server.js çalışırken dosya değişince uzantıyı ve Instagram sekmelerini yeniler.
// `npm run build` bu bölümü yayın paketinden çıkarır.
const DEV = "http://127.0.0.1:8765/";

async function watch() {
  let version = "";
  for (;;) {
    try {
      const res = await fetch(`${DEV}?since=${version}`);
      const next = await res.text();
      if (version && next !== version) return chrome.runtime.reload();
      version = next;
    } catch {
      await sleepMs(3000); // sunucu kapalı
    }
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: "https://www.instagram.com/*" });
  tabs.forEach((t) => chrome.tabs.reload(t.id));
});
chrome.alarms.create("keepalive", { periodInMinutes: 0.5 });
watch();
// </dev-reload>
