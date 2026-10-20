// Instagram'ın oturum çerezleriyle aynı-origin istekleri yapar; ilerleme/sonuç chrome.storage'a yazılır.
const IG_APP_ID = "936619743392459";
const PAGE_SIZE = 50;
const MAX_RETRIES = 3; // 429'da 60 sn, 120 sn, 240 sn bekler

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const setState = (state) => chrome.storage.local.set({ state });

class RateLimitError extends Error {}

async function igGet(path) {
  const res = await fetch(`https://www.instagram.com${path}`, {
    credentials: "include",
    headers: { "x-ig-app-id": IG_APP_ID, "x-requested-with": "XMLHttpRequest" },
  });
  if (res.status === 429) throw new RateLimitError("Instagram istek sınırı (429).");
  if (res.status === 401 || res.status === 403) throw new Error("Instagram'a giriş yapmış olmalısınız.");
  if (!res.ok) throw new Error(`İstek başarısız: ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new Error("Instagram beklenmeyen bir yanıt verdi (arayüz değişmiş olabilir).");
  }
}

async function withBackoff(fn, label) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!(e instanceof RateLimitError) || attempt >= MAX_RETRIES) throw e;
      for (let s = 60 * 2 ** attempt; s > 0; s--) {
        await setState({ phase: "waiting", text: `İstek sınırı: ${s} sn sonra devam edilecek (${label})` });
        await sleep(1000);
      }
    }
  }
}

async function fetchAll(userId, kind, label) {
  const users = new Map();
  let maxId = "";
  do {
    const q = `count=${PAGE_SIZE}${maxId ? `&max_id=${encodeURIComponent(maxId)}` : ""}`;
    const data = await withBackoff(() => igGet(`/api/v1/friendships/${userId}/${kind}/?${q}`), label);
    if (!Array.isArray(data.users)) throw new Error("Instagram yanıtı beklenenden farklı (arayüz değişmiş olabilir).");
    for (const u of data.users) {
      users.set(u.pk || u.id, {
        pk: String(u.pk || u.id),
        username: u.username,
        fullName: u.full_name,
        pic: u.profile_pic_url,
        verified: !!u.is_verified,
        isPrivate: !!u.is_private,
      });
    }
    maxId = data.next_max_id || "";
    await setState({ phase: "running", text: `${label} alınıyor… ${users.size}` });
    if (maxId) await sleep(2000 + Math.random() * 2000);
  } while (maxId);
  return [...users.values()];
}

// Giriş yapmış hesabın kimliği (oturum çerezinden).
const selfId = () => document.cookie.match(/(?:^|; )ds_user_id=(\d+)/)?.[1];

async function compare() {
  const uid = selfId();
  if (!uid) throw new Error("Instagram'a giriş yapmış olmalısınız.");
  await setState({ phase: "running", text: "Başlıyor…" });
  // Hesap adı yalnızca başlıkta görünen bir etiket; bu istek sınırlanırsa (429) beklemeden devam et.
  const username = await igGet(`/api/v1/users/${uid}/info/`).then((i) => i?.user?.username).catch(() => null);

  const followers = await fetchAll(uid, "followers", "Takipçiler");
  const following = await fetchAll(uid, "following", "Takip edilenler");
  const followerNames = new Set(followers.map((u) => u.username));
  const followingNames = new Set(following.map((u) => u.username));
  return {
    label: username ? `@${username}` : "Hesabım",
    username,
    ts: Date.now(),
    followerCount: followers.length,
    followingCount: following.length,
    notFollowingBack: following.filter((u) => !followerNames.has(u.username)),
    notFollowedBack: followers.filter((u) => !followingNames.has(u.username)),
    mutual: following.filter((u) => followerNames.has(u.username)),
  };
}

let running = false;
async function run() {
  if (running) return;
  running = true;
  try {
    await setState({ phase: "running", text: "Başlıyor…" });
    const result = await compare();
    // Günlük tarama hakkı yalnızca başarılı taramada düşer.
    const { scans = [] } = await chrome.storage.local.get("scans");
    await chrome.storage.local.set({ scans: [...scans.filter(isToday), Date.now()] });
    await setState({ phase: "done", result });
  } catch (e) {
    await setState({ phase: "error", error: e.message });
  } finally {
    running = false;
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "compare") {
    run();
    sendResponse({ ok: true });
  }
});

// Sayfa yenilendiyse yarım kalan bir işlem artık çalışmıyordur.
chrome.storage.local.get("state").then(({ state }) => {
  if (state && (state.phase === "running" || state.phase === "waiting")) setState({ phase: "idle" });
});

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

async function uiAction(kind) {
  const FOLLOWING = /^(Takiptesin|Takip ediliyor|Following|Requested|İstek gönderildi)/i;
  const UNFOLLOW = /^(Takibi bırak|Unfollow)$/i;
  const FOLLOW = /^(Takip et|Follow)$/i;
  try {
    if (kind === "unfollow") {
      const btn = await waitFor(() => findButton(FOLLOWING));
      if (!btn) throw new Error("Takip düğmesi bulunamadı (zaten takip etmiyor olabilirsiniz).");
      btn.click();
      const item = await waitFor(() => findButton(UNFOLLOW));
      if (!item) throw new Error("'Takibi bırak' seçeneği bulunamadı.");
      item.click();
      await sleep(1200);
      findButton(UNFOLLOW)?.click(); // bazı hesaplarda onay penceresi çıkar
      if (!(await waitFor(() => findButton(FOLLOW)))) throw new Error("Takipten çıkma doğrulanamadı.");
    } else {
      const btn = await waitFor(() => findButton(FOLLOW));
      if (!btn) throw new Error("'Takip et' düğmesi bulunamadı (zaten takip ediyor olabilirsiniz).");
      btn.click();
      if (!(await waitFor(() => findButton(FOLLOWING)))) throw new Error("Takip etme doğrulanamadı.");
    }
    chrome.runtime.sendMessage({ type: "uiActionResult", ok: true });
  } catch (e) {
    chrome.runtime.sendMessage({ type: "uiActionResult", ok: false, error: e.message });
  }
}

if (location.hash === "#ift-unfollow") uiAction("unfollow");
else if (location.hash === "#ift-follow") uiAction("follow");
