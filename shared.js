// Hem arka plan hem panel tarafından kullanılan sabitler ve yardımcılar.
const LIMITS = {
  dailyScans: 3, // günde en fazla tarama
  dailyUnfollows: 30, // günde en fazla takipten çıkarma
  gapMinMs: 45_000, // iki çıkarma arası en az bekleme
  gapMaxMs: 120_000, // iki çıkarma arası en çok bekleme
};

const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();
const randomGap = () => LIMITS.gapMinMs + Math.random() * (LIMITS.gapMaxMs - LIMITS.gapMinMs);
