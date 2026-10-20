// Konsol sürümünün başlangıcı: platform arayüzü (host), mesaj yönlendirici ve panel penceresi.
async function consoleRouter(msg) {
  try {
    switch (msg?.type) {
      case "startCompare":
        await assertScanQuota();
        run();
        return { ok: true };
      case "enqueue":
        await enqueue(msg.usernames || []);
        return { ok: true };
      case "queueControl":
        await queueControl(msg.op);
        return { ok: true };
      case "follow":
        return { ok: false, error: tx("errNoRefollow") };
    }
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

let queueTimer;
const host = {
  unfollow: apiUnfollow,
  follow: async () => ({ ok: false, error: tx("errNoRefollow") }),
  schedule: (when) => {
    clearTimeout(queueTimer);
    queueTimer = setTimeout(() => pump(), Math.max(0, when - Date.now()));
  },
};

let frame, closeBtn;
async function openPanel() {
  if (frame) {
    frame.style.display = closeBtn.style.display = "";
    return;
  }
  frame = document.createElement("iframe");
  Object.assign(frame.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", border: "0", zIndex: "2147483646", background: "transparent", colorScheme: "normal" });
  document.body.appendChild(frame);
  await new Promise((r) => setTimeout(r, 50));
  const doc = frame.contentDocument;
  try {
    const sheet = new frame.contentWindow.CSSStyleSheet();
    sheet.replaceSync(APP_CSS);
    doc.adoptedStyleSheets = [sheet];
  } catch {
    const st = doc.createElement("style");
    st.textContent = APP_CSS;
    doc.head.append(st);
  }
  closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.title = tx("closePanel");
  Object.assign(closeBtn.style, { position: "fixed", top: "14px", right: "18px", zIndex: "2147483647", width: "34px", height: "34px", borderRadius: "17px", border: "1px solid #8884", background: "#fff", color: "#111", cursor: "pointer", font: "16px system-ui" });
  closeBtn.addEventListener("click", () => (frame.style.display = closeBtn.style.display = "none"));
  document.body.appendChild(closeBtn);

  await mountApp(doc, {
    chrome,
    mode: "console",
    logoSrc: LOGO,
    reload: () => {
      frame.remove();
      closeBtn.remove();
      frame = closeBtn = null;
      openPanel();
    },
    open: (url) => window.open(url, "_blank", "noreferrer"),
  });
}

(async () => {
  if (window.__unfollowRadar) return window.__unfollowRadar.open();
  window.__unfollowRadar = { open: openPanel };
  await initLang(chrome.storage.local, chrome.storage.onChanged);
  if (!/(^|\.)instagram\.com$/.test(location.hostname)) {
    delete window.__unfollowRadar;
    return alert(tx("errWrongSite"));
  }
  await resetStaleState();
  // Çıkarma kuyruğu çalışırken sayfadan ayrılmaya karşı uyar.
  let active = false;
  const refresh = (q) => (active = !!q && q.items.length > 0 && !q.paused);
  refresh((await chrome.storage.local.get("queue")).queue);
  chrome.storage.onChanged.addListener((c) => c.queue && refresh(c.queue.newValue));
  window.addEventListener("beforeunload", (e) => active && (e.preventDefault(), (e.returnValue = "")));
  await openPanel();
  pump(); // yarım kalan kuyruk varsa sürdür
})();
