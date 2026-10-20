// Instagram'ın oturum çerezleriyle aynı-origin istekleri yapar.
const IG_APP_ID = "936619743392459";
const PAGE_SIZE = 100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function igGet(path) {
  const res = await fetch(`https://www.instagram.com${path}`, {
    credentials: "include",
    headers: { "x-ig-app-id": IG_APP_ID, "x-requested-with": "XMLHttpRequest" },
  });
  if (res.status === 429) throw new Error("Instagram istek sınırı (429). Birkaç dakika bekleyip tekrar deneyin.");
  if (res.status === 401 || res.status === 403) throw new Error("Instagram'a giriş yapmış olmalısınız.");
  if (!res.ok) throw new Error(`İstek başarısız: ${res.status}`);
  return res.json();
}

function currentUsername() {
  const first = location.pathname.split("/").filter(Boolean)[0];
  const reserved = ["explore", "reels", "direct", "accounts", "p", "stories", "reel", "tv"];
  return first && !reserved.includes(first) ? first : null;
}

async function fetchAll(userId, kind, onProgress) {
  const users = new Map();
  let maxId = "";
  do {
    const q = `count=${PAGE_SIZE}${maxId ? `&max_id=${encodeURIComponent(maxId)}` : ""}`;
    const data = await igGet(`/api/v1/friendships/${userId}/${kind}/?${q}`);
    for (const u of data.users || []) users.set(u.pk || u.id, { username: u.username, fullName: u.full_name });
    maxId = data.next_max_id || "";
    onProgress(kind, users.size);
    if (maxId) await sleep(1200 + Math.random() * 1200); // rate limit'e takılmamak için
  } while (maxId);
  return [...users.values()];
}

async function compare() {
  const username = currentUsername();
  if (!username) throw new Error("Önce bir Instagram profil sayfası açın.");

  const info = await igGet(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`);
  const user = info?.data?.user;
  if (!user) throw new Error("Profil bulunamadı.");
  if (user.is_private && !user.followed_by_viewer && !user.is_self) {
    throw new Error("Bu profil gizli ve takip etmiyorsunuz.");
  }

  const progress = (kind, count) => chrome.runtime.sendMessage({ type: "progress", kind, count }).catch(() => {});
  const followers = await fetchAll(user.id, "followers", progress);
  const following = await fetchAll(user.id, "following", progress);

  const followerNames = new Set(followers.map((u) => u.username));
  const followingNames = new Set(following.map((u) => u.username));
  return {
    username,
    followerCount: followers.length,
    followingCount: following.length,
    notFollowingBack: following.filter((u) => !followerNames.has(u.username)), // takip ediyor, geri takip yok
    notFollowedBack: followers.filter((u) => !followingNames.has(u.username)), // takipçi, o takip etmiyor
    mutual: following.filter((u) => followerNames.has(u.username)),
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "compare") return;
  compare()
    .then((result) => sendResponse({ ok: true, result }))
    .catch((err) => sendResponse({ ok: false, error: err.message }));
  return true; // async yanıt
});
