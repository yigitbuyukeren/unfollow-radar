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
