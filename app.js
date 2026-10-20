const $ = (id) => document.getElementById(id);
const S = { state: null, queue: null, history: [], whitelist: [], scans: [], onboarded: false };
const selected = new Set();
let activeTab = "notFollowingBack";

// ---------- profil resimleri: uzantı indirir (host izni sayesinde), yalnızca ekrana girenler ----------
const picCache = new Map();
const picObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      picObserver.unobserve(e.target);
      loadPic(e.target);
    }
  },
  { rootMargin: "200px" }
);

async function loadPic(el) {
  const url = el.dataset.pic;
  try {
    if (!picCache.has(url)) {
      const res = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" });
      if (!res.ok) throw new Error(res.status);
      picCache.set(url, URL.createObjectURL(await res.blob()));
    }
    const img = document.createElement("img");
    img.alt = "";
    img.src = picCache.get(url);
    el.replaceChildren(img);
  } catch {
    // baş harf kalır
  }
}

function avatar(u) {
  const el = document.createElement("div");
  el.className = "avatar";
  el.textContent = (u.username || "?")[0].toUpperCase();
  if (u.pic) {
    el.dataset.pic = u.pic;
    picObserver.observe(el);
  }
  return el;
}

// ---------- yardımcılar ----------
const todayScansLeft = () => LIMITS.dailyScans - S.scans.filter(isToday).length;
const todayUnfollows = () => S.history.filter((h) => isToday(h.ts)).length;
const whitelistNames = () => new Set(S.whitelist.map((u) => u.username));
const fmtDate = (ts) => new Date(ts).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

let localError = ""; // arayüzden kaynaklanan hata; tarama hatası state'ten gelir
function showError() {
  const err = S.state?.phase === "error" ? S.state.error : localError;
  $("error").hidden = !err;
  $("error").textContent = err || "";
}
let noticeTimer;
function notify(text) {
  $("notice").hidden = false;
  $("notice").textContent = text;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => ($("notice").hidden = true), 4000);
}
function setError(text) {
  localError = text || "";
  showError();
}

function listFor(tab) {
  const r = S.state?.result;
  const wl = whitelistNames();
  switch (tab) {
    case "notFollowingBack": return (r?.notFollowingBack || []).filter((u) => !wl.has(u.username));
    case "notFollowedBack": return r?.notFollowedBack || [];
    case "mutual": return r?.mutual || [];
    case "whitelist": return S.whitelist;
    case "history": return S.history.slice().reverse();
    default: return [];
  }
}

// ---------- satır ----------
function button(label, cls, onClick, disabled = false) {
  const b = document.createElement("button");
  b.className = cls;
  b.textContent = label;
  b.disabled = disabled;
  b.addEventListener("click", () => onClick(b));
  return b;
}

const isLocked = () => !!S.state?.result?.incomplete;

function row(u, queued) {
  const li = document.createElement("li");
  if (activeTab === "notFollowingBack" && !queued.has(u.username) && !isLocked()) {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = selected.has(u.username);
    cb.addEventListener("change", () => {
      cb.checked ? selected.add(u.username) : selected.delete(u.username);
      renderBulk();
    });
    li.append(cb);
  }

  const info = document.createElement("div");
  info.className = "who-info";
  const a = document.createElement("a");
  a.href = `https://www.instagram.com/${u.username}/`;
  a.target = "_blank";
  a.rel = "noreferrer";
  a.textContent = u.username;
  info.append(a);
  if (u.verified) {
    const b = document.createElement("span");
    b.className = "badge";
    b.textContent = "✓";
    info.append(b);
  }
  if (u.isPrivate) {
    const l = document.createElement("span");
    l.className = "lock";
    l.textContent = "🔒";
    info.append(l);
  }
  const sub = activeTab === "history" ? fmtDate(u.ts) : u.fullName;
  if (sub) {
    const s = document.createElement("small");
    s.textContent = sub;
    info.append(s);
  }
  li.append(avatar(u), info);

  const actions = document.createElement("div");
  actions.className = "row-actions";
  if (activeTab === "notFollowingBack") {
    actions.append(
      button("Koru", "ghost small", () => protect(u)),
      queued.has(u.username)
        ? button("Sırada", "ghost small", () => {}, true)
        : button("Çıkar", "act", () => enqueue([u.username]), isLocked())
    );
  } else if (activeTab === "whitelist") {
    actions.append(button("Korumayı kaldır", "ghost small", () => unprotect(u)));
  } else if (activeTab === "history") {
    actions.append(button("Geri takip et", "ghost small", (b) => refollow(u, b)));
  }
  li.append(actions);
  return li;
}

// ---------- çizim ----------
function renderTop() {
  $("onboarding").hidden = S.onboarded;
  $("start").hidden = !S.onboarded;
  if (!S.onboarded) return;

  const state = S.state;
  const phase = state?.phase || "idle";
  const busy = phase === "running" || phase === "waiting";
  const left = todayScansLeft();
  $("quota").textContent = `Bugün ${Math.max(left, 0)}/${LIMITS.dailyScans} tarama hakkın kaldı`;
  $("run").disabled = busy || left <= 0;
  $("banner").hidden = !busy;
  $("status").textContent = busy ? state.text || "Çalışıyor…" : "";
  showError();
}

function renderQueue() {
  const q = S.queue;
  $("queue").hidden = !(q && q.total > 0);
  if (!q || !q.total) return;
  const finished = !q.items.length;
  $("q-title").textContent = finished ? "Tamamlandı" : q.paused ? "Duraklatıldı" : "Takipten çıkarılıyor";
  const secs = Math.max(0, Math.round((q.nextAt - Date.now()) / 1000));
  $("q-sub").textContent = `${q.done}/${q.total}` + (!finished && !q.paused && secs ? ` · sonraki ${secs} sn` : "");
  $("q-bar").style.width = `${Math.round(((q.done + q.failed.length) / q.total) * 100)}%`;
  $("q-note").hidden = !q.note;
  $("q-note").textContent = q.note || "";
  $("q-fail").hidden = !q.failed.length;
  $("q-fail").textContent = q.failed.length ? `${q.failed.length} kişi çıkarılamadı: ${q.failed.map((f) => `${f.username} (${f.error})`).join(", ")}` : "";
  $("q-pause").hidden = finished;
  $("q-pause").textContent = q.paused ? "Devam et" : "Durdur";
  $("q-clear").textContent = finished ? "Kapat" : "İptal et";
}

function renderBulk() {
  const show = activeTab === "notFollowingBack";
  $("bulk").hidden = !show;
  $("wl-tools").hidden = activeTab !== "whitelist";
  if (!show) return;
  $("bulk-run").textContent = `Seçilenleri yavaşça çıkar (${selected.size})`;
  $("bulk-run").disabled = selected.size === 0 || isLocked();
  $("select-all").disabled = isLocked();
}

function renderResults() {
  const r = S.state?.result;
  const has = r || S.history.length || S.whitelist.length;
  $("results").hidden = !has;
  if (!has) return;

  $("who").replaceChildren();
  if (r) {
    const b = document.createElement("b");
    b.textContent = r.label;
    $("who").append(b, ` için sonuçlar · ${fmtDate(r.ts)}`);
  }
  const exp = r?.expected || {};
  $("incomplete").hidden = !r?.incomplete;
  $("incomplete").textContent = r?.incomplete
    ? `Tarama eksik görünüyor (Instagram ${exp.followers ?? "?"} takipçi / ${exp.following ?? "?"} takip diyor, ${r.followerCount} / ${r.followingCount} alındı). Yanlış kişileri çıkarmamak için takipten çıkarma kilitlendi. Taramayı yenile.`
    : "";
  $("s-followers").textContent = r?.followerCount ?? 0;
  $("s-following").textContent = r?.followingCount ?? 0;
  $("s-nfb").textContent = listFor("notFollowingBack").length;
  $("s-mutual").textContent = r?.mutual.length ?? 0;
  document.querySelectorAll("#tabs button").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === activeTab);
    b.querySelector("i").textContent = listFor(b.dataset.tab).length;
  });

  const q = $("search").value.trim().toLowerCase();
  const items = listFor(activeTab).filter((u) => !q || u.username.toLowerCase().includes(q) || (u.fullName || "").toLowerCase().includes(q));
  const queued = new Set(S.queue?.items || []);
  $("list").replaceChildren(...items.map((u) => row(u, queued)));
  $("list").hidden = items.length === 0;
  $("empty").hidden = items.length > 0;
  renderBulk();
}

const render = () => {
  renderTop();
  renderQueue();
  renderResults();
};

// Tarayıcının hazır confirm() penceresi dili tarayıcıdan aldığı için kendi onay penceremizi kullanıyoruz.
function askConfirm(message, yesLabel = "Onayla") {
  return new Promise((resolve) => {
    const d = $("dlg");
    $("dlg-msg").textContent = message;
    $("dlg-yes").textContent = yesLabel;
    $("dlg-yes").onclick = () => { d.close(); resolve(true); };
    $("dlg-no").onclick = () => { d.close(); resolve(false); };
    d.oncancel = () => resolve(false); // Esc
    d.showModal();
  });
}

// ---------- işlemler ----------
const send = (msg) => chrome.runtime.sendMessage(msg);

async function enqueue(names) {
  const left = LIMITS.dailyUnfollows - todayUnfollows();
  if (names.length > 1) {
    const minutes = Math.round((names.length * (LIMITS.gapMinMs + LIMITS.gapMaxMs)) / 2 / 60000);
    let msg = `${names.length} kişi takipten çıkarılacak. Aralarında ${LIMITS.gapMinMs / 1000}–${LIMITS.gapMaxMs / 1000} sn beklenir (yaklaşık ${minutes} dk); tarayıcı açık kalmalı.`;
    if (names.length > left) {
      msg += `\n\nGünlük limit (${LIMITS.dailyUnfollows}) nedeniyle bugün yalnızca ${Math.max(left, 0)} kişi çıkarılır; kalanı için yarın "Devam et"e basman gerekir.`;
    }
    if (!(await askConfirm(msg, "Çıkar"))) return;
  }
  const res = await send({ type: "enqueue", usernames: names });
  if (!res?.ok) return setError(res?.error || "Kuyruğa eklenemedi.");
  names.forEach((n) => selected.delete(n));
}

const protect = (u) => {
  selected.delete(u.username);
  return chrome.storage.local.set({
    whitelist: [...S.whitelist, { username: u.username, fullName: u.fullName, pic: u.pic, verified: u.verified, isPrivate: u.isPrivate }],
  });
};
const unprotect = (u) => chrome.storage.local.set({ whitelist: S.whitelist.filter((w) => w.username !== u.username) });

async function refollow(entry, btn) {
  btn.disabled = true;
  btn.textContent = "…";
  setError("");
  const res = await send({ type: "follow", username: entry.username });
  if (!res?.ok) {
    btn.disabled = false;
    btn.textContent = "Geri takip et";
    setError(res?.error || "Takip edilemedi.");
  }
}

// ---------- beyaz liste: dışa / içe aktarma, toplu ekleme ----------
const VALID_NAME = /^[A-Za-z0-9._]{1,30}$/;
const addToWhitelist = (entries) => {
  const have = whitelistNames();
  const add = entries.filter((e) => !have.has(e.username) && have.add(e.username));
  return chrome.storage.local.set({ whitelist: [...S.whitelist, ...add] }).then(() => add.length);
};

$("wl-export").addEventListener("click", () => {
  if (!S.whitelist.length) return setError("Dışa aktarılacak korunan hesap yok.");
  const blob = new Blob([JSON.stringify(S.whitelist, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `takip-analizi-korunanlar-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$("wl-import").addEventListener("click", () => $("wl-file").click());
$("wl-file").addEventListener("change", async (ev) => {
  const file = ev.target.files[0];
  ev.target.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error();
    const entries = data
      .map((e) => (typeof e === "string" ? { username: e } : e))
      .filter((e) => e && typeof e.username === "string" && VALID_NAME.test(e.username))
      .map((e) => ({ username: e.username, fullName: e.fullName, pic: e.pic, verified: !!e.verified, isPrivate: !!e.isPrivate }));
    if (!entries.length) throw new Error();
    setError("");
    const n = await addToWhitelist(entries);
    notify(`${n} yeni hesap korunanlara eklendi.`);
  } catch {
    setError("Geçersiz dosya: kullanıcı adı içeren bir JSON listesi bekleniyordu.");
  }
});

$("wl-paste").addEventListener("click", () => {
  $("paste-text").value = "";
  $("dlg-paste").showModal();
});
$("paste-no").addEventListener("click", () => $("dlg-paste").close());
$("paste-yes").addEventListener("click", async () => {
  const names = $("paste-text").value
    .split(/[\s,;]+/)
    .map((t) => t.match(/instagram\.com\/([A-Za-z0-9._]+)/i)?.[1] || t.replace(/^@/, ""))
    .filter((n) => VALID_NAME.test(n));
  $("dlg-paste").close();
  if (!names.length) return setError("Geçerli bir kullanıcı adı bulunamadı.");
  setError("");
  notify(`${await addToWhitelist(names.map((username) => ({ username })))} yeni hesap korunanlara eklendi.`);
});

// ---------- olaylar ----------
document.querySelectorAll("#tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    activeTab = b.dataset.tab;
    renderResults();
  })
);
$("search").addEventListener("input", renderResults);

$("select-all").addEventListener("change", (e) => {
  const queued = new Set(S.queue?.items || []);
  const q = $("search").value.trim().toLowerCase();
  listFor("notFollowingBack")
    .filter((u) => !queued.has(u.username) && (!q || u.username.toLowerCase().includes(q)))
    .forEach((u) => (e.target.checked ? selected.add(u.username) : selected.delete(u.username)));
  renderResults();
});
$("bulk-run").addEventListener("click", () => enqueue([...selected]));

$("run").addEventListener("click", async () => {
  setError("");
  $("run").disabled = true;
  const res = await send({ type: "startCompare" });
  if (!res?.ok) {
    setError(res?.error || "Başlatılamadı.");
    renderTop();
  }
});

$("ack").addEventListener("click", () => chrome.storage.local.set({ onboarded: true }));
$("q-pause").addEventListener("click", () => send({ type: "queueControl", op: S.queue?.paused ? "resume" : "pause" }));
$("q-clear").addEventListener("click", () => send({ type: "queueControl", op: "clear" }));
$("wipe").addEventListener("click", async () => {
  if (!(await askConfirm("Tarama sonuçları, korunanlar, geçmiş ve ayarlar dahil tüm verilerin bu tarayıcıdan silinecek. Emin misin?", "Sil"))) return;
  await send({ type: "queueControl", op: "clear" });
  await chrome.storage.local.clear();
  location.reload();
});

// ---------- veri ----------
const KEYS = ["state", "queue", "history", "whitelist", "scans", "onboarded"];
function apply(values) {
  if ("state" in values) S.state = values.state || null;
  if ("queue" in values) S.queue = values.queue || null;
  if ("history" in values) S.history = values.history || [];
  if ("whitelist" in values) S.whitelist = values.whitelist || [];
  if ("scans" in values) S.scans = values.scans || [];
  if ("onboarded" in values) S.onboarded = !!values.onboarded;
}

chrome.storage.local.get(KEYS).then((v) => {
  apply(v);
  render();
});
chrome.storage.onChanged.addListener((changes) => {
  const v = {};
  for (const k of KEYS) if (k in changes) v[k] = changes[k].newValue;
  apply(v);
  render();
});
setInterval(renderQueue, 1000); // geri sayım
