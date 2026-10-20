// Hem arka plan hem panel tarafından kullanılan sabitler ve yardımcılar.
const LIMITS = {
  dailyScans: 3, // günde en fazla tarama
  dailyUnfollows: 30, // günde en fazla takipten çıkarma
  gapMinMs: 45_000, // iki çıkarma arası en az bekleme
  gapMaxMs: 120_000, // iki çıkarma arası en çok bekleme
  longPauseEvery: 5, // her N çıkarmada bir uzun mola
  longPauseMinMs: 300_000, // uzun mola en az 5 dk
  longPauseMaxMs: 600_000, // uzun mola en çok 10 dk
  maxFailStreak: 2, // üst üste bu kadar başarısızlıkta kuyruk durur
  resumeWindowMs: 6 * 60 * 60 * 1000, // yarım kalan tarama bu süre içinde kaldığı yerden sürdürülür
};

const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();
const randomGap = () => LIMITS.gapMinMs + Math.random() * (LIMITS.gapMaxMs - LIMITS.gapMinMs);
const randomLongPause = () => LIMITS.longPauseMinMs + Math.random() * (LIMITS.longPauseMaxMs - LIMITS.longPauseMinMs);
