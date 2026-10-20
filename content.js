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
  return res.json();
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

function currentUsername() {
  const first = location.pathname.split("/").filter(Boolean)[0];
  const reserved = ["explore", "reels", "direct", "accounts", "p", "stories", "reel", "tv"];
  return first && !reserved.includes(first) ? first : null;
}

async function resolveUser(username) {
  const lookup = () => igGet(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`).then((i) => i?.data?.user);
  try {
    const user = await lookup();
    if (!user) throw new Error("Profil bulunamadı.");
    return user;
  } catch (e) {
    if (!(e instanceof RateLimitError)) throw e;
    // Ek istek atmadan sayfadaki gömülü veriden kullanıcı id'sini dene.
    const m = document.documentElement.innerHTML.match(/"profilePage_(\d+)"/);
    if (m) return { id: m[1] };
    const user = await withBackoff(lookup, "profil");
    if (!user) throw new Error("Profil bulunamadı.");
    return user;
  }
}

async function fetchAll(userId, kind, label) {
  const users = new Map();
  let maxId = "";
  do {
    const q = `count=${PAGE_SIZE}${maxId ? `&max_id=${encodeURIComponent(maxId)}` : ""}`;
    const data = await withBackoff(() => igGet(`/api/v1/friendships/${userId}/${kind}/?${q}`), label);
    for (const u of data.users || []) users.set(u.pk || u.id, { pk: String(u.pk || u.id), username: u.username, fullName: u.full_name });
    maxId = data.next_max_id || "";
    await setState({ phase: "running", text: `${label} alınıyor… ${users.size}` });
    if (maxId) await sleep(2000 + Math.random() * 2000);
  } while (maxId);
  return [...users.values()];
}

async function compare() {
  const username = currentUsername();
  if (!username) throw new Error("Önce bir Instagram profil sayfası açın.");
  await setState({ phase: "running", text: "Profil bilgisi alınıyor…" });

  const user = await resolveUser(username);
  if (user.is_private && !user.followed_by_viewer && !user.is_self) throw new Error("Bu profil gizli ve takip etmiyorsunuz.");

  const followers = await fetchAll(user.id, "followers", "Takipçiler");
  const following = await fetchAll(user.id, "following", "Takip edilenler");
  const followerNames = new Set(followers.map((u) => u.username));
  const followingNames = new Set(following.map((u) => u.username));
  return {
    label: `@${username}`,
    isSelf: document.cookie.includes(`ds_user_id=${user.id}`),
    followerCount: followers.length,
    followingCount: following.length,
    notFollowingBack: following.filter((u) => !followerNames.has(u.username)),
    notFollowedBack: followers.filter((u) => !followingNames.has(u.username)),
    mutual: following.filter((u) => followerNames.has(u.username)),
  };
}

const csrfToken = () => document.cookie.match(/(?:^|; )csrftoken=([^;]+)/)?.[1] || "";

async function igPost(path) {
  const res = await fetch(`https://www.instagram.com${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "x-ig-app-id": IG_APP_ID,
      "x-csrftoken": csrfToken(),
      "x-requested-with": "XMLHttpRequest",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "",
  });
  if (res.status === 429) throw new Error("Instagram istek sınırı (429). Biraz bekleyin.");
  if (!res.ok) throw new Error(`İşlem başarısız: ${res.status}`);
  const data = await res.json().catch(() => ({}));
  if (data.status && data.status !== "ok") throw new Error("Instagram işlemi reddetti.");
}

const ACTIONS = { unfollow: "destroy", removeFollower: "remove_follower" };

let running = false;
async function run() {
  if (running) return;
  running = true;
  try {
    await setState({ phase: "running", text: "Başlıyor…" });
    await setState({ phase: "done", result: await compare() });
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
  } else if (msg?.type === "action" && ACTIONS[msg.action] && /^\d+$/.test(msg.pk)) {
    igPost(`/api/v1/friendships/${ACTIONS[msg.action]}/${msg.pk}/`)
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: e.message }));
    return true; // async yanıt
  }
});

// Sayfa yenilendiyse yarım kalan bir işlem artık çalışmıyordur.
chrome.storage.local.get("state").then(({ state }) => {
  if (state && (state.phase === "running" || state.phase === "waiting")) setState({ phase: "idle" });
});
