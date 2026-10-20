// DEV: dev/server.js çalışırken dosya değişince uzantıyı ve Instagram sekmelerini yeniler.
// Yayın öncesi bu dosyayı, manifest'teki background/alarms/localhost girdilerini kaldır.
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
