const $ = (id) => document.getElementById(id);
const labels = { followers: "takipçiler", following: "takip edilenler" };
let result = null;
let activeTab = "notFollowingBack";

function render() {
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
      return li;
    })
  );
  document.querySelectorAll("#tabs button").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === activeTab);
    b.textContent = `${b.textContent.replace(/ \(\d+\)$/, "")} (${result[b.dataset.tab].length})`;
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "progress") $("status").textContent = `${labels[msg.kind]} alınıyor… ${msg.count}`;
});

document.querySelectorAll("#tabs button").forEach((b) =>
  b.addEventListener("click", () => {
    activeTab = b.dataset.tab;
    render();
  })
);

$("run").addEventListener("click", async () => {
  $("run").disabled = true;
  $("status").textContent = "Başlıyor…";
  $("tabs").hidden = true;
  $("list").replaceChildren();
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url?.startsWith("https://www.instagram.com/")) throw new Error("Aktif sekme Instagram değil.");
    const res = await chrome.tabs.sendMessage(tab.id, { type: "compare" });
    if (!res?.ok) throw new Error(res?.error || "Bilinmeyen hata");
    result = res.result;
    $("status").textContent = `@${result.username}: ${result.followerCount} takipçi, ${result.followingCount} takip`;
    $("tabs").hidden = false;
    render();
  } catch (e) {
    $("status").textContent = e.message.includes("Receiving end") ? "Instagram sayfasını yenileyip tekrar deneyin." : e.message;
  } finally {
    $("run").disabled = false;
  }
});
