importScripts("shared.js");

const store = { get: (k) => chrome.storage.local.get(k), set: (o) => chrome.storage.local.set(o) };
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));
const QUEUE = "queue";
const emptyQueue = () => ({ items: [], total: 0, done: 0, failed: [], paused: false, nextAt: 0, note: "" });
const getQueue = async () => (await store.get(QUEUE))[QUEUE] || emptyQueue();

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
  const { scans = [] } = await store.get("scans");
  const today = scans.filter(isToday);
  if (today.length >= LIMITS.dailyScans) {
    throw new Error(`Bugünkü ${LIMITS.dailyScans} tarama hakkın doldu. Yarın tekrar dene.`);
  }

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
  throw new Error("Instagram sayfasına bağlanılamadı. Instagram'da giriş yaptığından emin ol ve tekrar dene.");
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
  if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) return { ok: false, error: "Geçersiz kullanıcı adı." };
  const tab = await chrome.tabs.create({ url: `https://www.instagram.com/${username}/#ift-${kind}`, active: false });
  const result = await new Promise((resolve) => {
    const onMsg = (m, sender) => {
      if (m?.type === "uiActionResult" && sender.tab?.id === tab.id) {
        chrome.runtime.onMessage.removeListener(onMsg);
        resolve(m);
      }
    };
    chrome.runtime.onMessage.addListener(onMsg);
    setTimeout(() => resolve({ ok: false, error: "Zaman aşımı." }), 30000);
  });
  chrome.tabs.remove(tab.id).catch(() => {});
  return result;
}

async function recordUnfollow(username) {
  const { state, history = [] } = await store.get(["state", "history"]);
  const u = state?.result?.notFollowingBack?.find((x) => x.username === username);
  history.push({ username, fullName: u?.fullName, pic: u?.pic, ts: Date.now() });
  const patch = { history: history.slice(-200) };
  if (state?.phase === "done" && u) {
    state.result.notFollowingBack = state.result.notFollowingBack.filter((x) => x.username !== username);
    state.result.followingCount--;
    patch.state = state;
  }
  await store.set(patch);
}

// --- Yavaş toplu çıkarma kuyruğu: aralarında rastgele bekleme + günlük limit ---
let pumping = false;
async function pump() {
  if (pumping) return;
  pumping = true;
  try {
    const q = await getQueue();
    if (q.paused || !q.items.length) return;

    const { history = [], whitelist = [] } = await store.get(["history", "whitelist"]);
    if (history.filter((h) => isToday(h.ts)).length >= LIMITS.dailyUnfollows) {
      q.paused = true;
      q.note = `Günlük ${LIMITS.dailyUnfollows} çıkarma limiti doldu. Yarın "Devam et" ile sürdürebilirsin.`;
      await store.set({ [QUEUE]: q });
      return;
    }
    if (q.nextAt - Date.now() > 1000) {
      chrome.alarms.create("queue", { when: q.nextAt });
      return;
    }

    const username = q.items[0];
    let res = { ok: true, skipped: true };
    if (!whitelist.some((w) => w.username === username)) res = await uiAction("unfollow", username);

    const q2 = await getQueue(); // bu arada duraklatılmış / iptal edilmiş olabilir
    if (res.blocked) {
      // Instagram "işlem engellendi" dedi: kişiyi sırada bırak, kuyruğu durdur.
      q2.paused = true;
      q2.note = "Instagram işlemi engelledi. Hesabını korumak için kuyruk durduruldu; birkaç saat bekleyip \"Devam et\"e bas.";
      await store.set({ [QUEUE]: q2 });
      return;
    }
    q2.items = q2.items.filter((u) => u !== username);
    const success = res.ok && !res.skipped;
    if (q2.total) {
      if (success) q2.done++;
      else if (!res.ok) q2.failed.push({ username, error: res.error });
    }
    if (success) await recordUnfollow(username);
    if (!res.ok) q2.failStreak = (q2.failStreak || 0) + 1;
    else if (success) q2.failStreak = 0;
    q2.note = "";
    if (q2.failStreak >= LIMITS.maxFailStreak) {
      q2.paused = true;
      q2.note = `Üst üste ${q2.failStreak} işlem başarısız oldu (Instagram kısıtlıyor olabilir). Güvenlik için kuyruk durduruldu; bir süre bekleyip "Devam et"e bas.`;
      q2.failStreak = 0;
    }
    // Her N çıkarmada bir uzun mola; aksi halde kısa rastgele bekleme.
    const longPause = success && q2.done > 0 && q2.done % LIMITS.longPauseEvery === 0 && q2.items.length > 0;
    const wait = longPause ? randomLongPause() : randomGap();
    if (longPause && !q2.paused) q2.note = `${q2.done} kişi çıkarıldı; hesabını korumak için ${Math.round(wait / 60000)} dk uzun mola veriliyor.`;
    q2.nextAt = Date.now() + wait;
    await store.set({ [QUEUE]: q2 });
    if (q2.items.length && !q2.paused) chrome.alarms.create("queue", { when: q2.nextAt });
  } finally {
    pumping = false;
  }
}

chrome.alarms.onAlarm.addListener((a) => a.name === "queue" && pump());
chrome.runtime.onStartup.addListener(pump);

async function enqueue(usernames) {
  const { state } = await store.get("state");
  if (state?.result?.incomplete) throw new Error("Tarama eksik göründüğü için çıkarma kilitli. Taramayı yenile.");
  const q = await getQueue();
  if (!q.items.length) Object.assign(q, { total: 0, done: 0, failed: [], note: "" });
  const fresh = usernames.filter((u) => /^[A-Za-z0-9._]{1,30}$/.test(u) && !q.items.includes(u));
  q.items.push(...fresh);
  q.total += fresh.length;
  await store.set({ [QUEUE]: q });
  pump();
}

async function queueControl(op) {
  const q = await getQueue();
  if (op === "pause") q.paused = true;
  else if (op === "resume") Object.assign(q, { paused: false, note: "", failStreak: 0 });
  else if (op === "clear") return store.set({ [QUEUE]: emptyQueue() });
  await store.set({ [QUEUE]: q });
  if (op === "resume") pump();
}

async function follow(username) {
  const res = await uiAction("follow", username);
  if (res.ok) {
    const { history = [] } = await store.get("history");
    await store.set({ history: history.filter((h) => h.username !== username) });
  }
  return res;
}

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
