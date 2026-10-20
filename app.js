const $ = (id) => document.getElementById(id);
const TABS = {
  notFollowingBack: { label: "Takipten çık" }, // yalnızca kendi hesabında, listede olan kişiler için
  notFollowedBack: null,
  mutual: null,
};
let result = null;
let activeTab = "notFollowingBack";

// Resimleri uzantı indirir (host izni sayesinde); yalnızca ekrana girenler yüklenir.
const picCache = new Map(); // url -> object URL
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

function row(u) {
  const li = document.createElement("li");
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
  if (u.fullName) {
    const s = document.createElement("small");
    s.textContent = u.fullName;
    info.append(s);
  }
  li.append(avatar(u), info);

  const action = TABS[activeTab];
  if (result.isSelf && u.pk && action) {
    const btn = document.createElement("button");
    btn.className = "act";
    btn.textContent = action.label;
    btn.addEventListener("click", () => unfollow(u, btn));
    li.append(btn);
  }
  return li;
}

function renderResult() {
  const q = $("search").value.trim().toLowerCase();
  const items = result[activeTab].filter((u) => !q || u.username.toLowerCase().includes(q) || (u.fullName || "").toLowerCase().includes(q));
  $("list").replaceChildren(...items.map(row));
  $("empty").hidden = items.length > 0;
  $("list").hidden = items.length === 0;
  document.querySelectorAll("#tabs button").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === activeTab);
    b.querySelector("i").textContent = result[b.dataset.tab].length;
  });
  $("s-followers").textContent = result.followerCount;
  $("s-following").textContent = result.followingCount;
  $("s-nfb").textContent = result.notFollowingBack.length;
  $("s-mutual").textContent = result.mutual.length;
}

function showResult(r) {
  result = r;
  $("who").innerHTML = "";
  const b = document.createElement("b");
  b.textContent = r.label;
  $("who").append(b, " için sonuçlar");
  $("results").hidden = false;
  renderResult();
}

function setError(text) {
  $("error").hidden = !text;
  $("error").textContent = text || "";
}

function render(state) {
  const phase = state?.phase || "idle";
  const busy = phase === "running" || phase === "waiting";
  $("run").disabled = busy;
  $("banner").hidden = !busy;
  $("status").textContent = busy ? state.text || "Çalışıyor…" : "";
  setError(phase === "error" ? state.error : "");
  if (phase === "done") showResult(state.result);
}

async function unfollow(user, btn) {
  btn.disabled = true;
  btn.textContent = "Çıkarılıyor…";
  setError("");
  try {
    const res = await chrome.runtime.sendMessage({ type: "unfollowUI", username: user.username });
    if (!res?.ok) throw new Error(res?.error || "Bilinmeyen hata");
    result.notFollowingBack = result.notFollowingBack.filter((x) => x.pk !== user.pk);
    result.followingCount--;
    await chrome.storage.local.set({ state: { phase: "done", result } });
  } catch (e) {
    btn.disabled = false;
    btn.textContent = TABS.notFollowingBack.label;
    setError(e.message);
  }
}

document.querySelectorAll("#tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    activeTab = b.dataset.tab;
    renderResult();
  })
);
$("search").addEventListener("input", () => result && renderResult());

$("run").addEventListener("click", async () => {
  setError("");
  $("run").disabled = true;
  const res = await chrome.runtime.sendMessage({ type: "startCompare", username: $("username").value });
  if (!res?.ok) {
    setError(res?.error || "Başlatılamadı.");
    $("run").disabled = false;
  }
});
$("username").addEventListener("keydown", (e) => e.key === "Enter" && $("run").click());

chrome.storage.local.get("state").then(({ state }) => render(state));
chrome.storage.onChanged.addListener((changes) => changes.state && render(changes.state.newValue));
