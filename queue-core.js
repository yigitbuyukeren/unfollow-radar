// Takipten çıkarma kuyruğu ve günlük limitler: uzantı arka planı ve konsol sürümü ortak kullanır.
// Gerektirenler (global): store {get,set}, host {unfollow(username), follow(username), schedule(when)},
// LIMITS, isToday, randomGap, tx.
const QUEUE = "queue";
const USERNAME_RE = /^[A-Za-z0-9._]{1,30}$/;
const emptyQueue = () => ({ items: [], total: 0, done: 0, failed: [], paused: false, nextAt: 0, note: "", failStreak: 0 });
const getQueue = async () => (await store.get(QUEUE))[QUEUE] || emptyQueue();

// Günlük tarama hakkı doldu mu?
async function assertScanQuota() {
  const { scans = [] } = await store.get("scans");
  if (scans.filter(isToday).length >= LIMITS.dailyScans) throw new Error(tx("scanQuotaFull", LIMITS.dailyScans));
}

async function recordUnfollow(username) {
  const { state, history = [] } = await store.get(["state", "history"]);
  const u = state?.result?.notFollowingBack?.find((x) => x.username === username);
  history.push({ username, fullName: u?.fullName, pic: u?.pic, ts: Date.now() });
  const patch = { history: history.slice(-200) };
  if (state?.phase === "done" && u) {
    state.result.notFollowingBack = state.result.notFollowingBack.filter((x) => x.username !== username);
    state.result.followingCount--;
    patch.state = state;
  }
  await store.set(patch);
}

// Yavaş toplu çıkarma: aralarında rastgele bekleme, her 5 kişide ek mola, günlük limit, engel koruması.
let pumping = false;
async function pump() {
  if (pumping) return;
  pumping = true;
  try {
    const q = await getQueue();
    if (q.paused || !q.items.length) return;

    const { history = [], whitelist = [] } = await store.get(["history", "whitelist"]);
    if (history.filter((h) => isToday(h.ts)).length >= LIMITS.dailyUnfollows) {
      q.paused = true;
      q.note = tx("limitNote", LIMITS.dailyUnfollows);
      await store.set({ [QUEUE]: q });
      return;
    }
    if (q.nextAt - Date.now() > 1000) {
      host.schedule(q.nextAt);
      return;
    }

    const username = q.items[0];
    let res = { ok: true, skipped: true };
    if (!whitelist.some((w) => w.username === username)) res = await host.unfollow(username);

    const q2 = await getQueue(); // bu arada duraklatılmış / iptal edilmiş olabilir
    if (res.blocked) {
      // Instagram "işlem engellendi" dedi: kişiyi sırada bırak, kuyruğu durdur.
      q2.paused = true;
      q2.note = tx("blockedNote");
      await store.set({ [QUEUE]: q2 });
      return;
    }
    q2.items = q2.items.filter((u) => u !== username);
    const success = res.ok && !res.skipped;
    if (q2.total) {
      if (success) q2.done++;
      else if (!res.ok) q2.failed.push({ username, error: res.error });
    }
    if (success) await recordUnfollow(username);
    if (!res.ok) q2.failStreak = (q2.failStreak || 0) + 1;
    else if (success) q2.failStreak = 0;
    q2.note = "";
    if (q2.failStreak >= LIMITS.maxFailStreak) {
      q2.paused = true;
      q2.note = tx("failStreakNote", q2.failStreak);
      q2.failStreak = 0;
    }
    // Kısa rastgele bekleme; her 5. kişide ek olarak 5 dk mola. Son kişiden sonra beklenmez.
    const processed = q2.done + q2.failed.length;
    const longPause = q2.items.length > 0 && processed > 0 && processed % LIMITS.longPauseEvery === 0;
    const wait = randomGap() + (longPause ? LIMITS.longPauseMs : 0);
    if (longPause && !q2.paused) q2.note = tx("longPauseNote", processed, Math.round(LIMITS.longPauseMs / 60000));
    q2.nextAt = Date.now() + wait;
    await store.set({ [QUEUE]: q2 });
    if (q2.items.length && !q2.paused) host.schedule(q2.nextAt);
  } finally {
    pumping = false;
  }
}

async function enqueue(usernames) {
  const { state } = await store.get("state");
  if (state?.result?.incomplete) throw new Error(tx("lockedIncomplete"));
  const q = await getQueue();
  if (!q.items.length) Object.assign(q, { total: 0, done: 0, failed: [], note: "" });
  const fresh = usernames.filter((u) => USERNAME_RE.test(u) && !q.items.includes(u));
  q.items.push(...fresh);
  q.total += fresh.length;
  await store.set({ [QUEUE]: q });
  pump();
}

async function queueControl(op) {
  const q = await getQueue();
  if (op === "pause") q.paused = true;
  else if (op === "resume") Object.assign(q, { paused: false, note: "", failStreak: 0 });
  else if (op === "clear") return store.set({ [QUEUE]: emptyQueue() });
  await store.set({ [QUEUE]: q });
  if (op === "resume") pump();
}

async function follow(username) {
  const res = await host.follow(username);
  if (res.ok) {
    const { history = [] } = await store.get("history");
    await store.set({ history: history.filter((h) => h.username !== username) });
  }
  return res;
}
