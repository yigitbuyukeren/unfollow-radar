// Panel mantığı: uzantı sayfası ve konsol sürümü ortak kullanır.
// host = { chrome, mode: "extension" | "console", logoSrc, reload(), open(url) }
async function mountApp(document, host) {
  const chrome = host.chrome;
  const win = document.defaultView;
  await initLang(chrome.storage.local, chrome.storage.onChanged);
  document.documentElement.lang = LANG;
  document.body.append(buildPanel(document, { logoSrc: host.logoSrc }));

  const $ = (id) => document.getElementById(id);
  const S = { state: null, queue: null, history: [], whitelist: [], scans: [], onboarded: false };
  const selected = new Set();
  let activeTab = "notFollowingBack";

  // ---------- profil resimleri: önce indirmeyi dener (uzantı host izni), olmazsa doğrudan <img> ----------
  const picCache = new Map();
  const picObserver = new win.IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        picObserver.unobserve(en.target);
        loadPic(en.target);
      }
    },
    { rootMargin: "200px" }
  );

  // Resmi yükler; biri başarısız olursa diğer yolu dener:
  // uzantı: önce indir (host izni) → olmazsa doğrudan; konsol: önce doğrudan (sayfanın kendi kaynağıyla) → olmazsa indir.
  const loadImg = (src, noReferrer) =>
    new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.alt = "";
      if (noReferrer) img.referrerPolicy = "no-referrer";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("img"));
      img.src = src;
    });
  const viaFetch = async (url) => {
    if (!picCache.has(url)) {
      const res = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" });
      if (!res.ok) throw new Error(res.status);
      picCache.set(url, URL.createObjectURL(await res.blob()));
    }
    return loadImg(picCache.get(url));
  };
  const direct = (url) => loadImg(url, host.mode === "extension");

  async function loadPic(el) {
    const url = el.dataset.pic;
    const order = host.mode === "extension" ? [viaFetch, direct] : [direct, viaFetch];
    for (const attempt of order) {
      try {
        el.replaceChildren(await attempt(url));
        return;
      } catch {
        // sıradaki yolu dene
      }
    }
    // olmadı: baş harf kalır. Nedenini görebilmek için ilk başarısızlığı konsola yaz.
    if (!loadPic.warned) {
      loadPic.warned = true;
      console.warn("[Unfollow Radar] profile picture could not be loaded:", new URL(url, "https://x").host);
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
  const isLocked = () => !!S.state?.result?.incomplete;
  const fmtDate = (ts) => new Date(ts).toLocaleString(LANG === "tr" ? "tr-TR" : "en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  let localError = ""; // arayüzden kaynaklanan hata; tarama hatası state'ten gelir
  function showError() {
    const err = S.state?.phase === "error" ? S.state.error : localError;
    $("error").hidden = !err;
    $("error").textContent = err || "";
  }
  function setError(text) {
    localError = text || "";
    showError();
  }
  let noticeTimer;
  function notify(text) {
    $("notice").hidden = false;
    $("notice").textContent = text;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => ($("notice").hidden = true), 4000);
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
        button(tx("protect"), "ghost small", () => protect(u)),
        queued.has(u.username)
          ? button(tx("queued"), "ghost small", () => {}, true)
          : button(tx("btnUnfollowShort"), "act", () => enqueue([u.username]), isLocked())
      );
    } else if (activeTab === "whitelist") {
      actions.append(button(tx("unprotect"), "ghost small", () => unprotect(u)));
    } else if (activeTab === "history") {
      if (host.mode === "console") actions.append(button(tx("openProfile"), "ghost small", () => host.open(`https://www.instagram.com/${u.username}/`)));
      else actions.append(button(tx("refollow"), "ghost small", (b) => refollow(u, b)));
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
    $("quota").textContent = tx("quota", Math.max(left, 0), LIMITS.dailyScans);
    $("run").disabled = busy || left <= 0;
    $("banner").hidden = !busy;
    $("status").textContent = busy ? state.text || "…" : "";
    showError();
  }

  function renderQueue() {
    const q = S.queue;
    $("queue").hidden = !(q && q.total > 0);
    if (!q || !q.total) return;
    const finished = !q.items.length;
    $("q-title").textContent = finished ? tx("qDone") : q.paused ? tx("qPaused") : tx("qRunning");
    const secs = Math.max(0, Math.round((q.nextAt - Date.now()) / 1000));
    $("q-sub").textContent = `${q.done}/${q.total}` + (!finished && !q.paused && secs ? tx("qNext", secs) : "");
    $("q-bar").style.width = `${Math.round(((q.done + q.failed.length) / q.total) * 100)}%`;
    $("q-note").hidden = !q.note;
    $("q-note").textContent = q.note || "";
    $("q-fail").hidden = !q.failed.length;
    $("q-fail").textContent = q.failed.length ? tx("qFailMsg", q.failed.length, q.failed.map((f) => `${f.username} (${f.error})`).join(", ")) : "";
    $("q-pause").hidden = finished;
    $("q-pause").textContent = q.paused ? tx("qResume") : tx("qPause");
    $("q-clear").textContent = finished ? tx("qClose") : tx("qCancel");
  }

  function renderBulk() {
    const show = activeTab === "notFollowingBack";
    $("bulk").hidden = !show;
    $("wl-tools").hidden = activeTab !== "whitelist";
    if (!show) return;
    $("bulk-run").textContent = tx("bulkRun", selected.size);
    $("bulk-run").disabled = selected.size === 0 || isLocked();
    $("select-all").disabled = isLocked();
  }

  function renderResults() {
    const r = S.state?.result;
    const has = r || S.history.length || S.whitelist.length;
    $("results").hidden = !has;
    if (!has) return;

    $("who").textContent = r ? tx("resultsFor", r.label, fmtDate(r.ts)) : "";
    const exp = r?.expected || {};
    $("incomplete").hidden = !r?.incomplete;
    $("incomplete").textContent = r?.incomplete ? tx("incompleteMsg", exp.followers ?? "?", exp.following ?? "?", r.followerCount, r.followingCount) : "";
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

  // Kendi onay penceremiz (tarayıcının confirm() penceresi dili tarayıcıdan alır).
  function askConfirm(message, yesLabel = tx("confirmYes")) {
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
      const minutes = Math.round((names.length * ((LIMITS.gapMinMs + LIMITS.gapMaxMs) / 2 + 8000)) / 60000 + Math.floor(names.length / LIMITS.longPauseEvery) * (LIMITS.longPauseMs / 60000));
      let msg = tx("enqueueConfirm", names.length, LIMITS.gapMinMs / 1000, LIMITS.gapMaxMs / 1000, LIMITS.longPauseEvery, LIMITS.longPauseMs / 60000, minutes);
      if (names.length > left) msg += "\n\n" + tx("enqueueOverLimit", LIMITS.dailyUnfollows, Math.max(left, 0));
      if (!(await askConfirm(msg, tx("btnUnfollowShort")))) return;
    }
    const res = await send({ type: "enqueue", usernames: names });
    if (!res?.ok) return setError(res?.error || tx("enqueueFail"));
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
      btn.textContent = tx("refollow");
      setError(res?.error || tx("followFail"));
    }
  }

  // ---------- beyaz liste: dışa / içe aktarma, toplu ekleme ----------
  const VALID_NAME = /^[A-Za-z0-9._]{1,30}$/;
  const addToWhitelist = (entries) => {
    const have = whitelistNames();
    const add = entries.filter((en) => !have.has(en.username) && have.add(en.username));
    return chrome.storage.local.set({ whitelist: [...S.whitelist, ...add] }).then(() => add.length);
  };

  $("wl-export").addEventListener("click", () => {
    if (!S.whitelist.length) return setError(tx("wlExportEmpty"));
    const blob = new Blob([JSON.stringify(S.whitelist, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `unfollow-radar-protected-${new Date().toISOString().slice(0, 10)}.json`;
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
        .map((en) => (typeof en === "string" ? { username: en } : en))
        .filter((en) => en && typeof en.username === "string" && VALID_NAME.test(en.username))
        .map((en) => ({ username: en.username, fullName: en.fullName, pic: en.pic, verified: !!en.verified, isPrivate: !!en.isPrivate }));
      if (!entries.length) throw new Error();
      setError("");
      notify(tx("wlAdded", await addToWhitelist(entries)));
    } catch {
      setError(tx("wlBadFile"));
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
      .map((s) => s.match(/instagram\.com\/([A-Za-z0-9._]+)/i)?.[1] || s.replace(/^@/, ""))
      .filter((n) => VALID_NAME.test(n));
    $("dlg-paste").close();
    if (!names.length) return setError(tx("wlNoValid"));
    setError("");
    notify(tx("wlAdded", await addToWhitelist(names.map((username) => ({ username })))));
  });

  // ---------- olaylar ----------
  document.querySelectorAll("#tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      activeTab = b.dataset.tab;
      renderResults();
    })
  );
  $("search").addEventListener("input", renderResults);

  $("select-all").addEventListener("change", (ev) => {
    const queued = new Set(S.queue?.items || []);
    const q = $("search").value.trim().toLowerCase();
    listFor("notFollowingBack")
      .filter((u) => !queued.has(u.username) && (!q || u.username.toLowerCase().includes(q)))
      .forEach((u) => (ev.target.checked ? selected.add(u.username) : selected.delete(u.username)));
    renderResults();
  });
  $("bulk-run").addEventListener("click", () => enqueue([...selected]));

  $("run").addEventListener("click", async () => {
    setError("");
    $("run").disabled = true;
    const res = await send({ type: "startCompare" });
    if (!res?.ok) {
      setError(res?.error || tx("startFail"));
      renderTop();
    }
  });

  $("ack").addEventListener("click", () => chrome.storage.local.set({ onboarded: true }));
  $("q-pause").addEventListener("click", () => send({ type: "queueControl", op: S.queue?.paused ? "resume" : "pause" }));
  $("q-clear").addEventListener("click", () => send({ type: "queueControl", op: "clear" }));
  $("lang").addEventListener("click", async () => {
    await chrome.storage.local.set({ lang: LANG === "tr" ? "en" : "tr" });
    host.reload();
  });
  $("wipe").addEventListener("click", async () => {
    if (!(await askConfirm(tx("wipeConfirm"), tx("btnDelete")))) return;
    await send({ type: "queueControl", op: "clear" });
    await chrome.storage.local.clear();
    host.reload();
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

  apply(await chrome.storage.local.get(KEYS));
  render();
  chrome.storage.onChanged.addListener((changes) => {
    const v = {};
    for (const k of KEYS) if (k in changes) v[k] = changes[k].newValue;
    apply(v);
    render();
  });
  setInterval(renderQueue, 1000); // geri sayım
}
