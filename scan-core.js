// Tarama çekirdeği: uzantı (content script) ve konsol sürümü ortak kullanır.
// Gerektirenler (global): chrome.storage.local, SCAN, LIMITS, isToday, tx.
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
  if (res.status === 429) throw new RateLimitError(tx("err429"));
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (BLOCK_API_RE.test(body)) throw new RateLimitError(tx("errFeedback"));
    if (res.status === 401 || res.status === 403) throw new Error(tx("errLogin"));
    throw new Error(tx("errReq", res.status));
  }
  try {
    return await res.json();
  } catch {
    throw new Error(tx("errBadResponse"));
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
        await setState({ phase: "waiting", text: tx(limited ? "limitWait" : "netWait", label, s) });
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
      await setState({ phase: "waiting", text: tx("safetyBreak", s) });
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
    if (!Array.isArray(data.users)) throw new Error(tx("errBadShape"));
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
    await setState({ phase: "running", text: tx("fetching", label, users.size) });
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
  if (!uid) throw new Error(tx("errLogin"));
  await setState({ phase: "running", text: tx("starting") });
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
  if (cached) await setState({ phase: "running", text: tx("resuming", cached) });

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
  const followers = await pull("followers", tx("lblFollowers"));
  const following = await pull("following", tx("lblFollowing"));

  // Eksik tarama koruması: Instagram'ın bildirdiği sayıyla uyuşmuyorsa çıkarma kilitlenir.
  const short = (got, expected) => typeof expected === "number" && got < expected - Math.max(2, expected * 0.03);
  const incomplete =
    short(followers.length, user?.follower_count) ||
    short(following.length, user?.following_count) ||
    !!progress.followers.truncated ||
    !!progress.following.truncated;

  const followerNames = new Set(followers.map((u) => u.username));
  const followingNames = new Set(following.map((u) => u.username));
  return {
    label: username ? `@${username}` : tx("accountFallback"),
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
    await setState({ phase: "running", text: tx("starting") });
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

// Sayfa yenilendiyse yarım kalan bir işlem artık çalışmıyordur.
async function resetStaleState() {
  const { state } = await chrome.storage.local.get("state");
  if (state && (state.phase === "running" || state.phase === "waiting")) await setState({ phase: "idle" });
}
