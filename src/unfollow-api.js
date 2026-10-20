// Konsol sürümünde takipten çıkarma: Instagram web arayüzünün kullandığı GraphQL isteğini taklit eder.
// Yöntem ve sabitler InstagramUnfollowers (MIT, davidarroyo1234) projesindeki yaklaşımdan esinlenmiştir.
const GQL = { asbd: "129477", unfollowDocId: "27789106940691111", unfollowName: "usePolarisUnfollowMutation" };
let sessionTokens;

async function getSessionTokens() {
  if (sessionTokens) return sessionTokens;
  let dtsg, lsd, rev;
  try {
    dtsg = window.require?.("DTSGInitialData")?.token;
    lsd = window.require?.("LSD")?.token;
    const site = window.require?.("SiteData");
    rev = site?.__spin_r ?? site?.client_revision;
  } catch {}
  const parse = (html) => {
    dtsg ||= html.match(/"DTSGInitialData",\[\],\{"token":"([^"]+)"/)?.[1];
    lsd ||= html.match(/"LSD",\[\],\{"token":"([^"]+)"/)?.[1];
    rev ||= html.match(/"client_revision":(\d+)/)?.[1];
  };
  if (!dtsg || !lsd) parse(document.documentElement.innerHTML);
  if (!dtsg || !lsd) parse(await fetch("/", { credentials: "same-origin" }).then((r) => r.text()).catch(() => ""));
  if (!dtsg || !lsd) throw new Error(tx("errTokens"));
  return (sessionTokens = { dtsg, lsd, rev });
}

const jazoest = (s) => "2" + [...s].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
const csrfToken = () => document.cookie.match(/(?:^|; )csrftoken=([^;]+)/)?.[1] || "";
const findKey = (obj, key, depth = 0) => {
  if (!obj || typeof obj !== "object" || depth > 6) return undefined;
  if (key in obj) return obj[key];
  for (const v of Object.values(obj)) {
    const r = findKey(v, key, depth + 1);
    if (r !== undefined) return r;
  }
};

// Takip edilenler listesinde hâlâ var mı? true / false / null (bilinmiyor)
async function isStillFollowing(username) {
  try {
    const data = await igGet(`/api/v1/friendships/${selfId()}/following/?count=12&query=${encodeURIComponent(username)}&search_surface=follow_list_page`);
    return (data.users || []).some((u) => u.username?.toLowerCase() === username.toLowerCase());
  } catch {
    return null;
  }
}

async function apiUnfollow(username) {
  try {
    const { state } = await store.get("state");
    const target = state?.result?.notFollowingBack?.find((u) => u.username === username);
    if (!target) return { ok: false, error: tx("errNoTarget") };

    const { dtsg, lsd, rev } = await getSessionTokens();
    const body = new URLSearchParams({
      av: selfId(),
      __d: "www",
      __user: "0",
      __a: "1",
      __req: "1",
      __comet_req: "7",
      dpr: "1",
      __ccg: "EXCELLENT",
      fb_dtsg: dtsg,
      jazoest: jazoest(dtsg),
      lsd,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: GQL.unfollowName,
      variables: JSON.stringify({ target_user_id: target.pk, container_module: "profile", nav_chain: "PolarisProfilePostsTabRoot:profilePage:1:via_cold_start" }),
      server_timestamps: "true",
      doc_id: GQL.unfollowDocId,
    });
    if (rev) body.set("__rev", String(rev));

    const res = await fetch("/api/graphql", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-csrftoken": csrfToken(),
        "x-ig-app-id": IG_APP_ID,
        "x-asbd-id": GQL.asbd,
        "x-fb-lsd": lsd,
        "x-fb-friendly-name": GQL.unfollowName,
      },
      body,
    });
    const text = await res.text();
    if (res.status === 429 || BLOCK_API_RE.test(text) || /"spam"\s*:\s*true/.test(text) || /try again later|action_blocked/i.test(text)) {
      return { ok: false, blocked: true, error: tx("errBlockedUi") };
    }
    let json;
    try {
      json = JSON.parse(text.replace(/^for \(;;\);/, ""));
    } catch {
      return { ok: false, error: tx("errUnfollowFailed", res.status) };
    }
    if (!res.ok || json.errors || json.error) return { ok: false, error: tx("errUnfollowFailed", res.status) };

    // Başarıyı doğrula: yanıttaki takip durumu + takip edilenler listesi.
    const fs = findKey(json, "friendship_status");
    if (fs && (fs.following === true || fs.outgoing_request === true)) return { ok: false, error: tx("errStillFollowing") };
    const still = await isStillFollowing(username);
    if (still === true) return { ok: false, error: tx("errStillFollowing") };
    if (still === null && !(fs && fs.following === false)) return { ok: false, error: tx("errUnfollowFailed", res.status) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
