const $ = (id) => document.getElementById(id);
let result = null;
let activeTab = "notFollowingBack";

const ACTION_FOR_TAB = {
  notFollowingBack: { type: "unfollow", label: "Takipten çık" },
  notFollowedBack: { type: "removeFollower", label: "Takipçiden çıkar" },
};

async function runAction(user, action, btn) {
  btn.disabled = true;
  btn.textContent = "…";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const res = await chrome.tabs.sendMessage(tab.id, { type: "action", action: action.type, pk: user.pk });
    if (!res?.ok) throw new Error(res?.error || "Bilinmeyen hata");
    // Listeden düşür ve kalıcı durumu güncelle.
    const drop = (list) => list.filter((x) => x.pk !== user.pk);
    if (action.type === "unfollow") {
      result.notFollowingBack = drop(result.notFollowingBack);
      result.followingCount--;
    } else {
      result.notFollowedBack = drop(result.notFollowedBack);
      result.followerCount--;
    }
    await chrome.storage.local.set({ state: { phase: "done", result } });
  } catch (e) {
    btn.disabled = false;
    btn.textContent = action.label;
    $("status").textContent = e.message.includes("Receiving end") ? "Instagram sayfasını yenileyip tekrar deneyin." : e.message;
  }
}

function renderResult() {
  $("list").replaceChildren(
    ...result[activeTab].map((u) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `https://www.instagram.com/${u.username}/`;
      a.target = "_blank";
      a.textContent = u.username;
      li.append(a);
      if (u.fullName) {
        const s = document.createElement("small");
        s.textContent = u.fullName;
        li.append(s);
      }
      const action = ACTION_FOR_TAB[activeTab];
      if (result.isSelf && u.pk && action) {
        const btn = document.createElement("button");
        btn.className = "act";
        btn.textContent = action.label;
        btn.addEventListener("click", () => runAction(u, action, btn));
        li.append(btn);
      }
      return li;
    })
  );
  document.querySelectorAll("#tabs button").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === activeTab);
    b.textContent = `${b.textContent.replace(/ \(\d+\)$/, "")} (${result[b.dataset.tab].length})`;
  });
}

function showResult(r) {
  result = r;
  $("status").textContent = `${r.label}: ${r.followerCount} takipçi, ${r.followingCount} takip`;
  $("tabs").hidden = false;
  renderResult();
}

function render(state) {
  const phase = state?.phase || "idle";
  $("run").disabled = phase === "running" || phase === "waiting";
  if (phase === "done") return showResult(state.result);
  $("tabs").hidden = true;
  $("list").replaceChildren();
  $("status").textContent = phase === "error" ? state.error : state?.text || "";
}

document.querySelectorAll("#tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    activeTab = b.dataset.tab;
    renderResult();
  })
);

chrome.storage.local.get("state").then(({ state }) => render(state));
chrome.storage.onChanged.addListener((changes) => changes.state && render(changes.state.newValue));

$("run").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url?.startsWith("https://www.instagram.com/")) throw new Error("Aktif sekme Instagram değil.");
    await chrome.tabs.sendMessage(tab.id, { type: "compare" });
  } catch (e) {
    $("status").textContent = e.message.includes("Receiving end") ? "Instagram sayfasını yenileyip tekrar deneyin." : e.message;
  }
});

// Instagram veri indirmesi: followers_N.json = [{string_list_data:[{value}]}], following.json = {relationships_following:[{title}]}
function namesFrom(json) {
  const list = Array.isArray(json) ? json : Object.values(json).find(Array.isArray) || [];
  return list.map((e) => e.title || e.string_list_data?.[0]?.value).filter(Boolean).map((username) => ({ username }));
}

$("files").addEventListener("change", async (ev) => {
  try {
    const followers = [];
    const following = [];
    for (const f of ev.target.files) {
      const names = namesFrom(JSON.parse(await f.text()));
      (/following/i.test(f.name) ? following : followers).push(...names);
    }
    if (!followers.length || !following.length) throw new Error("Hem followers_*.json hem following.json seçilmeli.");
    const followerSet = new Set(followers.map((u) => u.username));
    const followingSet = new Set(following.map((u) => u.username));
    showResult({
      label: "Veri indirmesi",
      followerCount: followers.length,
      followingCount: following.length,
      notFollowingBack: following.filter((u) => !followerSet.has(u.username)),
      notFollowedBack: followers.filter((u) => !followingSet.has(u.username)),
      mutual: following.filter((u) => followerSet.has(u.username)),
    });
  } catch (e) {
    $("status").textContent = e.message;
  }
});
