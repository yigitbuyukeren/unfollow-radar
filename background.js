// Takipten çıkarma işi (popup kapansa da sürer) + DEV: dev/server.js çalışırken dosya değişince uzantıyı yeniler.
// Yayın öncesi aşağıdaki DEV bölümünü, manifest'teki alarms ve localhost girdilerini kaldır.
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
      await new Promise((r) => setTimeout(r, 3000)); // sunucu kapalı
    }
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: "https://www.instagram.com/*" });
  tabs.forEach((t) => chrome.tabs.reload(t.id));
});
chrome.alarms.create("keepalive", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(() => {}); // service worker'ı uyandırır
watch();

// Takipten çıkar: profili arka plan sekmesinde açar, content.js arayüzü sürer, sonuç gelince sekmeyi kapatır.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "unfollowUI" || !/^[A-Za-z0-9._]+$/.test(msg.username)) return;
  (async () => {
    const tab = await chrome.tabs.create({ url: `https://www.instagram.com/${msg.username}/#ift-unfollow`, active: false });
    const result = await new Promise((resolve) => {
      const onMsg = (m, sender) => {
        if (m?.type === "unfollowResult" && sender.tab?.id === tab.id) {
          chrome.runtime.onMessage.removeListener(onMsg);
          resolve(m);
        }
      };
      chrome.runtime.onMessage.addListener(onMsg);
      setTimeout(() => resolve({ ok: false, error: "Zaman aşımı." }), 30000);
    });
    chrome.tabs.remove(tab.id).catch(() => {});
    sendResponse(result);
  })();
  return true;
});

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

// --- Karşılaştırmayı başlat: kullanıcı adı verilirse profili arka plan sekmesinde açar ---
const RESERVED = ["explore", "reels", "direct", "accounts", "p", "stories", "reel", "tv"];
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));

async function startCompare(rawName) {
  const username = (rawName || "").trim().replace(/^@/, "");
  let tab;
  if (username) {
    if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) throw new Error("Geçersiz kullanıcı adı.");
    tab = await chrome.tabs.create({ url: `https://www.instagram.com/${username}/`, active: false });
    await chrome.storage.local.set({ tempTab: tab.id });
    for (let i = 0; i < 40; i++) {
      if ((await chrome.tabs.get(tab.id)).status === "complete") break;
      await sleepMs(500);
    }
  } else {
    const tabs = await chrome.tabs.query({ url: "https://www.instagram.com/*" });
    tab = tabs.find((t) => {
      const first = new URL(t.url).pathname.split("/").filter(Boolean)[0];
      return first && !RESERVED.includes(first);
    });
    if (!tab) throw new Error("Açık bir Instagram profil sekmesi yok. Bir kullanıcı adı yazın.");
  }
  for (let i = 0; i < 20; i++) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "compare" });
      return;
    } catch {
      await sleepMs(500); // content script henüz hazır değil
    }
  }
  throw new Error("Instagram sayfasına bağlanılamadı. Sayfayı yenileyip tekrar deneyin.");
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "startCompare") return;
  startCompare(msg.username)
    .then(() => sendResponse({ ok: true }))
    .catch((e) => sendResponse({ ok: false, error: e.message }));
  return true;
});

// İş bitince (ya da hata verince) bizim açtığımız arka plan sekmesini kapat.
chrome.storage.onChanged.addListener(async (changes) => {
  const phase = changes.state?.newValue?.phase;
  if (phase !== "done" && phase !== "error") return;
  const { tempTab } = await chrome.storage.local.get("tempTab");
  if (tempTab) {
    chrome.tabs.remove(tempTab).catch(() => {});
    chrome.storage.local.remove("tempTab");
  }
});
