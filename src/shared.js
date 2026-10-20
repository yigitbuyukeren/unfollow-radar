// Hem arka plan hem panel tarafından kullanılan sabitler ve yardımcılar.
// Bekleme süreleri ve yeniden deneme kuralları davidarroyo1234/InstagramUnfollowers (MIT) varsayılanlarıyla aynıdır.

// Takipten çıkarma kuyruğu
const LIMITS = {
  dailyScans: 3, // günde en fazla tarama
  dailyUnfollows: 30, // günde en fazla takipten çıkarma
  gapMinMs: 4_000, // iki çıkarma arası: DEFAULT_TIME_BETWEEN_UNFOLLOWS
  gapMaxMs: 4_800, // ... en çok 1.2 katı
  longPauseEvery: 5, // her N çıkarmada bir ek mola
  longPauseMs: 300_000, // DEFAULT_TIME_TO_WAIT_AFTER_FIVE_UNFOLLOWS (5 dk)
  maxFailStreak: 2, // üst üste bu kadar başarısızlıkta kuyruk durur
  resumeWindowMs: 6 * 60 * 60 * 1000, // yarım kalan tarama bu süre içinde kaldığı yerden sürdürülür
};

// Tarama (takipçi / takip listesi çekme)
const SCAN = {
  pageSize: 50, // DEFAULT_USERS_PER_SEARCH_CYCLE
  jitterMinMs: 300, // her sayfa arası sabit rastgele bekleme: 300–999 ms
  jitterSpanMs: 700,
  timeBetweenCyclesMs: 1_000, // DEFAULT_TIME_BETWEEN_SEARCH_CYCLES; sayfa arası ek bekleme [T, 1.3T)
  checksBeforeLongSleep: 15, // CHECKS_BEFORE_LONG_SLEEP
  longSleepMs: 10_000, // DEFAULT_TIME_TO_WAIT_AFTER_FIVE_SEARCH_CYCLES
  longSleepJitterMs: 5_000, // uzun uykuya ±5 sn rastgelelik
  maxRetries: 3,
  rateLimitCooldownS: 30, // RATE_LIMIT_COOLDOWN_SECONDS; bekleme = 30 × deneme sn
  networkRetryS: 5, // ağ hatasında bekleme = 5 × deneme sn
  pageSafetyLimit: 250, // liste başına en fazla sayfa
};

const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();
// [U, 1.2U) aralığında rastgele bekleme
const randomGap = () => Math.floor(Math.random() * (LIMITS.gapMaxMs - LIMITS.gapMinMs)) + LIMITS.gapMinMs;
