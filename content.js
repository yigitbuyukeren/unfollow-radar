// Uzantı content script'i: tarama çekirdeğini (scan-core.js) çalıştırır ve takip/takipten çıkarma
// işlemlerini Instagram arayüzünü sürerek yapar. Yükleme sırası: shared.js, i18n.js, scan-core.js, content.js
initLang(chrome.storage.local, chrome.storage.onChanged);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "compare") {
    run();
    sendResponse({ ok: true });
  }
});
resetStaleState();

// --- Takip / takipten çık: arka planda açılan profil sekmesinde Instagram arayüzünü kullanır ---
const textOf = (el) => (el.textContent || "").trim();
const findButton = (re) => [...document.querySelectorAll("button, [role=button]")].find((el) => re.test(textOf(el)));

async function waitFor(fn, ms = 8000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const el = fn();
    if (el) return el;
    await sleep(250);
  }
  return null;
}

// Instagram "işlem engellendi" penceresi / mesajı gösterdi mi?
const BLOCK_DIALOG_RE = /işlem engellendi|action blocked|try again later|daha sonra tekrar dene|izin verilmiyor|we limit how often|bazı işlemleri sınırlıyoruz|geçici olarak engellen|temporarily blocked/i;
const BLOCK_TEXT_RE = /işlem engellendi|action blocked|try again later/i;
const isBlocked = () =>
  [...document.querySelectorAll("[role=dialog], [role=alertdialog]")].some((d) => BLOCK_DIALOG_RE.test(d.innerText || "")) ||
  BLOCK_TEXT_RE.test(document.body.innerText || "");

class BlockedError extends Error {}

async function uiAction(kind) {
  const FOLLOWING = /^(Takiptesin|Takip ediliyor|Following|Requested|İstek gönderildi)/i;
  const UNFOLLOW = /^(Takibi bırak|Unfollow)$/i;
  const FOLLOW = /^(Takip et|Follow)$/i;
  // Hedef düğme görünene kadar bekler; arada engel penceresi çıkarsa hemen bildirir.
  const until = async (find, ms) => {
    const hit = await waitFor(() => find() || (isBlocked() ? "blocked" : null), ms);
    if (hit === "blocked") throw new BlockedError(tx("errBlockedUi"));
    return hit;
  };
  try {
    if (kind === "unfollow") {
      const btn = await until(() => findButton(FOLLOWING));
      if (!btn) throw new Error(tx("errFollowBtn"));
      btn.click();
      const item = await until(() => findButton(UNFOLLOW));
      if (!item) throw new Error(tx("errMenuItem"));
      item.click();
      await sleep(1200);
      findButton(UNFOLLOW)?.click(); // bazı hesaplarda onay penceresi çıkar
      if (!(await until(() => findButton(FOLLOW)))) throw new Error(tx("errUnfollowVerify"));
    } else {
      const btn = await until(() => findButton(FOLLOW));
      if (!btn) throw new Error(tx("errFollowBtn2"));
      btn.click();
      if (!(await until(() => findButton(FOLLOWING)))) throw new Error(tx("errFollowVerify"));
    }
    chrome.runtime.sendMessage({ type: "uiActionResult", ok: true });
  } catch (e) {
    chrome.runtime.sendMessage({ type: "uiActionResult", ok: false, blocked: e instanceof BlockedError, error: e.message });
  }
}

if (location.hash === "#ift-unfollow") uiAction("unfollow");
else if (location.hash === "#ift-follow") uiAction("follow");
