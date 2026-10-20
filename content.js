// Instagram'ın oturum çerezleriyle aynı-origin istekleri yapar; ilerleme/sonuç chrome.storage'a yazılır.
const IG_APP_ID = "936619743392459";
const BLOCK_API_RE = /feedback_required|checkpoint_required|action_blocked|challenge_required/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const setState = (state) => chrome.storage.local.set({ state });

// 429 ve geçici kısıtlama (feedback_required...): artan beklemeyle yeniden denenir.
class RateLimitError extends Error {}

async function igGet(path) {
  const res = await fetch(`https://www.instagram.com${path}`, {
    credentials: "include",
    headers: { "x-ig-app-id": IG_APP_ID, "x-requested-with": "XMLHttpRequest" },
  });
  if (res.status === 429) throw new RateLimitError("Instagram istek sınırı (429). Biraz bekleyip tekrar dene.");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (BLOCK_API_RE.test(body)) {
      throw new RateLimitError("Instagram hesabına geçici bir kısıtlama uyguladı (feedback_required). Birkaç saat bekleyip tekrar dene.");
    }
    if (res.status === 401 || res.status === 403) throw new Error("Instagram'a giriş yapmış olmalısınız.");
    throw new Error(`İstek başarısız: ${res.status}`);
  }
  try {
    return await res.json();
  } catch {
    throw new Error("Instagram beklenmeyen bir yanıt verdi (arayüz değişmiş olabilir).");
  }
}

async function withBackoff(fn, label) {
  for (let retries = 0; ; ) {
    try {
      return await fn();
    } catch (e) {
      const limited = e instanceof RateLimitError;
      const network = e instanceof TypeError || /fetch|network/i.test(e.message || "");
      if (!(limited || network) || retries >= SCAN.maxRetries) throw e;
      retries++;
      const secs = (limited ? SCAN.rateLimitCooldownS : SCAN.networkRetryS) * retries;
      for (let s = secs; s > 0; s--) {
        await setState({ phase: "waiting", text: `${limited ? "İstek sınırı" : "Ağ hatası"}: ${s} sn sonra devam edilecek (${label})` });
        await sleep(1000);
      }
    }
  }
}

// Sayfalar arası bekleme + her N istekte uzun uyku.
let requestsSinceLongSleep = 0;
async function paceRequest() {
  await sleep(Math.floor(Math.random() * SCAN.jitterSpanMs) + SCAN.jitterMinMs);
  const T = SCAN.timeBetweenCyclesMs;
  await sleep(Math.floor(Math.random() * (T * 1.3 - T)) + T);
  if (++requestsSinceLongSleep >= SCAN.checksBeforeLongSleep) {
    requestsSinceLongSleep = 0;
    const ms = Math.max(0, SCAN.longSleepMs + (Math.random() * SCAN.longSleepJitterMs * 2 - SCAN.longSleepJitterMs));
    for (let s = Math.round(ms / 1000); s > 0; s--) {
      await setState({ phase: "waiting", text: `Güvenlik molası: ${s} sn` });
      await sleep(1000);
    }
  }
}

// part = { done, users, maxId }: yarım kalan taramayı sürdürmek için her sayfada kaydedilir.
async function fetchAll(userId, kind, label, part, onPage) {
  const users = new Map(part.users.map((u) => [u.pk, u]));
  let maxId = part.maxId || "";
  let pages = 0;
  do {
    const q = `count=${SCAN.pageSize}${maxId ? `&max_id=${encodeURIComponent(maxId)}` : ""}`;
    const data = await withBackoff(() => igGet(`/api/v1/friendships/${userId}/${kind}/?${q}`), label);
    if (!Array.isArray(data.users)) throw new Error("Instagram yanıtı beklenenden farklı (arayüz değişmiş olabilir).");
    for (const u of data.users) {
      users.set(String(u.pk || u.id), {
        pk: String(u.pk || u.id),
        username: u.username,
        fullName: u.full_name,
        pic: u.profile_pic_url,
        verified: !!u.is_verified,
        isPrivate: !!u.is_private,
      });
    }
    maxId = data.next_max_id || "";
    await onPage([...users.values()], maxId);
    await setState({ phase: "running", text: `${label} alınıyor… ${users.size}` });
    if (maxId && ++pages >= SCAN.pageSafetyLimit) {
      part.truncated = true; // sayfa güvenlik sınırı: liste eksik kalır, çıkarma kilitlenir
      break;
    }
    if (maxId) await paceRequest();
  } while (maxId);
  return [...users.values()];
}

// Giriş yapmış hesabın kimliği (oturum çerezinden).
const selfId = () => document.cookie.match(/(?:^|; )ds_user_id=(\d+)/)?.[1];

async function compare() {
  const uid = selfId();
  if (!uid) throw new Error("Instagram'a giriş yapmış olmalısınız.");
  await setState({ phase: "running", text: "Başlıyor…" });
  requestsSinceLongSleep = 0;
  // Hesap adı ve beklenen sayılar isteğe bağlı; bu istek sınırlanırsa (429) beklemeden devam et.
  const user = await igGet(`/api/v1/users/${uid}/info/`).then((i) => i?.user).catch(() => null);
  const username = user?.username;

  // Önbellek: yarım kalan tarama varsa kaldığı yerden devam et.
  const saved = (await chrome.storage.local.get("scanProgress")).scanProgress;
  const fresh = () => ({ done: false, users: [], maxId: "" });
  const progress =
    saved && saved.uid === uid && Date.now() - saved.ts < LIMITS.resumeWindowMs
      ? saved
      : { uid, ts: Date.now(), followers: fresh(), following: fresh() };
  const cached = progress.followers.users.length + progress.following.users.length;
  if (cached) await setState({ phase: "running", text: `Kaldığı yerden devam ediliyor (${cached} kişi önbellekte)…` });

  const pull = async (kind, label) => {
    const part = progress[kind];
    if (part.done) return part.users;
    const users = await fetchAll(uid, kind, label, part, async (list, maxId) => {
      Object.assign(part, { users: list, maxId });
      progress.ts = Date.now();
      await chrome.storage.local.set({ scanProgress: progress });
    });
    Object.assign(part, { done: true, users, maxId: "" });
    await chrome.storage.local.set({ scanProgress: progress });
    return users;
  };
  const followers = await pull("followers", "Takipçiler");
  const following = await pull("following", "Takip edilenler");

  // Eksik tarama koruması: Instagram'ın bildirdiği sayıyla uyuşmuyorsa çıkarma kilitlenir.
  const short = (got, expected) => typeof expected === "number" && got < expected - Math.max(2, expected * 0.03);
  const incomplete =
    short(followers.length, user?.follower_count) || short(following.length, user?.following_count) || !!progress.followers.truncated || !!progress.following.truncated;

  const followerNames = new Set(followers.map((u) => u.username));
  const followingNames = new Set(following.map((u) => u.username));
  return {
    label: username ? `@${username}` : "Hesabım",
    username,
    ts: Date.now(),
    incomplete,
    expected: { followers: user?.follower_count, following: user?.following_count },
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
    // Günlük tarama hakkı yalnızca başarılı taramada düşer; önbellek temizlenir.
    const { scans = [] } = await chrome.storage.local.get("scans");
    await chrome.storage.local.set({ scans: [...scans.filter(isToday), Date.now()] });
    await chrome.storage.local.remove("scanProgress");
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
    if (hit === "blocked") throw new BlockedError("Instagram işlemi engelledi (action block).");
    return hit;
  };
  try {
    if (kind === "unfollow") {
      const btn = await until(() => findButton(FOLLOWING));
      if (!btn) throw new Error("Takip düğmesi bulunamadı (zaten takip etmiyor olabilirsiniz).");
      btn.click();
      const item = await until(() => findButton(UNFOLLOW));
      if (!item) throw new Error("'Takibi bırak' seçeneği bulunamadı.");
      item.click();
      await sleep(1200);
      findButton(UNFOLLOW)?.click(); // bazı hesaplarda onay penceresi çıkar
      if (!(await until(() => findButton(FOLLOW)))) throw new Error("Takipten çıkma doğrulanamadı.");
    } else {
      const btn = await until(() => findButton(FOLLOW));
      if (!btn) throw new Error("'Takip et' düğmesi bulunamadı (zaten takip ediyor olabilirsiniz).");
      btn.click();
      if (!(await until(() => findButton(FOLLOWING)))) throw new Error("Takip etme doğrulanamadı.");
    }
    chrome.runtime.sendMessage({ type: "uiActionResult", ok: true });
  } catch (e) {
    chrome.runtime.sendMessage({ type: "uiActionResult", ok: false, blocked: e instanceof BlockedError, error: e.message });
  }
}

if (location.hash === "#ift-unfollow") uiAction("unfollow");
else if (location.hash === "#ift-follow") uiAction("follow");
