/*!
 * Unfollow Radar — console edition v1.0.0 (MIT)
 * EN: Open https://www.instagram.com while signed in, open DevTools (F12) → Console, paste this whole file, press Enter.
 * TR: Giriş yapmış hâlde https://www.instagram.com'u aç, DevTools (F12) → Console'a bu dosyanın tamamını yapıştır, Enter'a bas.
 * Not affiliated with Instagram/Meta. Everything runs locally in your browser; nothing is sent anywhere. Use at your own risk.
 * https://github.com/yigitbuyukeren/unfollow-radar
 */
(() => {
const APP_CSS = ":root {\n  --bg: #f6f7fb;\n  --card: #ffffff;\n  --text: #14151a;\n  --muted: #6b6f7b;\n  --line: #e6e8ef;\n  --accent: #6d4aff;\n  --accent-2: #ff4f8b;\n  --good: #17a673;\n  --warn: #e5484d;\n  --shadow: 0 1px 2px rgba(20, 21, 26, .05), 0 8px 24px rgba(20, 21, 26, .06);\n}\n@media (prefers-color-scheme: dark) {\n  :root {\n    --bg: #0e0f14;\n    --card: #171921;\n    --text: #eceef5;\n    --muted: #9296a5;\n    --line: #262a36;\n    --shadow: 0 1px 2px rgba(0, 0, 0, .4), 0 8px 24px rgba(0, 0, 0, .35);\n  }\n}\n* { box-sizing: border-box; }\n[hidden] { display: none !important; }\nbody { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 -apple-system, \"SF Pro Text\", system-ui, sans-serif; }\n.top { display: flex; align-items: center; justify-content: space-between; }\n.top, main { max-width: 860px; margin: 0 auto; padding: 0 20px; }\n.top { padding-top: 32px; padding-bottom: 20px; }\n.brand { display: flex; align-items: center; gap: 14px; }\n.logo { width: 44px; height: 44px; border-radius: 12px; box-shadow: 0 6px 18px rgba(109, 74, 255, .35); }\nh1 { margin: 0; font-size: 22px; letter-spacing: -.02em; }\n.brand p { margin: 0; color: var(--muted); font-size: 13px; }\nmain { padding-bottom: 60px; display: grid; gap: 18px; }\n\n.card { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 18px; box-shadow: var(--shadow); }\n.row { display: flex; gap: 10px; }\ninput[type=search] { border: 0; outline: 0; background: transparent; color: var(--text); font: inherit; width: 100%; }\nbutton { font: inherit; cursor: pointer; border: 0; color: inherit; }\n.primary { padding: 0 22px; border-radius: 12px; color: #fff; font-weight: 600; background: linear-gradient(135deg, var(--accent), var(--accent-2)); }\n.primary:hover { filter: brightness(1.06); }\n.primary:disabled { opacity: .55; cursor: not-allowed; }\n\n.banner { display: flex; align-items: center; gap: 10px; margin-top: 14px; padding: 10px 12px; border-radius: 12px; background: rgba(109, 74, 255, .1); color: var(--text); font-size: 14px; }\n.spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(109, 74, 255, .25); border-top-color: var(--accent); animation: spin .8s linear infinite; flex: none; }\n@keyframes spin { to { transform: rotate(360deg); } }\n.error { margin: 14px 0 0; padding: 10px 12px; border-radius: 12px; background: rgba(229, 72, 77, .12); color: var(--warn); font-size: 14px; }\n\n.who { margin: 0 0 10px; color: var(--muted); font-size: 14px; }\n.who b { color: var(--text); }\n.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }\n.stat { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; box-shadow: var(--shadow); }\n.stat b { display: block; font-size: 26px; letter-spacing: -.02em; }\n.stat span { color: var(--muted); font-size: 13px; }\n.stat.warn b { color: var(--warn); }\n.stat.good b { color: var(--good); }\n\n.toolbar { display: flex; gap: 12px; align-items: center; justify-content: space-between; margin: 18px 0 10px; flex-wrap: wrap; }\n.tabs { display: flex; gap: 6px; background: var(--card); border: 1px solid var(--line); padding: 4px; border-radius: 12px; }\n.tabs button { background: transparent; color: var(--muted); padding: 7px 12px; border-radius: 9px; font-size: 13px; }\n.tabs button i { font-style: normal; opacity: .7; margin-left: 4px; }\n.tabs button.active { background: var(--accent); color: #fff; }\n#search { max-width: 220px; padding: 9px 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); }\n\n.list { list-style: none; margin: 0; padding: 0; background: var(--card); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; box-shadow: var(--shadow); }\n.list li { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--line); }\n.list li:last-child { border-bottom: 0; }\n.avatar { width: 40px; height: 40px; border-radius: 50%; flex: none; display: grid; place-items: center; color: #fff; font-weight: 600; background: linear-gradient(135deg, var(--accent), var(--accent-2)); overflow: hidden; }\n.avatar img { width: 100%; height: 100%; object-fit: cover; }\n.who-info { flex: 1; min-width: 0; }\n.who-info a { color: var(--text); font-weight: 600; text-decoration: none; }\n.who-info a:hover { text-decoration: underline; }\n.who-info small { display: block; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.badge { display: inline-block; margin-left: 4px; width: 14px; height: 14px; border-radius: 50%; background: #3897f0; color: #fff; font-size: 9px; line-height: 14px; text-align: center; vertical-align: 1px; }\n.lock { margin-left: 6px; font-size: 12px; opacity: .6; }\n.act { padding: 7px 12px; border-radius: 10px; font-size: 13px; background: rgba(229, 72, 77, .12); color: var(--warn); font-weight: 600; }\n.act:hover { background: rgba(229, 72, 77, .2); }\n.act:disabled { opacity: .5; cursor: wait; }\n.empty { text-align: center; color: var(--muted); padding: 30px 0; }\n\n@media (max-width: 640px) {\n  .stats { grid-template-columns: repeat(2, 1fr); }\n  .row { flex-direction: column; }\n  .primary { padding: 11px; }\n  #search { max-width: none; width: 100%; }\n}\n\nh2 { margin: 0 0 10px; font-size: 18px; }\n.points { margin: 0 0 16px; padding-left: 18px; color: var(--muted); font-size: 14px; }\n.points li { margin-bottom: 8px; }\n.points b { color: var(--text); }\n.wide { width: 100%; padding: 12px; }\n.who-me { flex: 1; display: flex; flex-direction: column; justify-content: center; }\n.who-me span { color: var(--muted); font-size: 13px; }\n.ghost { padding: 7px 14px; border-radius: 10px; background: var(--bg); border: 1px solid var(--line); font-size: 13px; }\n.ghost:hover { border-color: var(--accent); }\n.ghost:disabled { opacity: .5; cursor: wait; }\n.danger { padding: 8px 14px; border-radius: 10px; background: var(--warn); color: #fff; font-weight: 600; font-size: 13px; }\n.danger:disabled { opacity: .45; cursor: not-allowed; }\n.link { background: none; color: var(--muted); text-decoration: underline; font-size: 12px; }\n\n.queue .q-head { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }\n.queue .q-head span { color: var(--muted); font-size: 13px; }\n.progress { height: 8px; background: var(--bg); border-radius: 99px; margin: 10px 0; overflow: hidden; }\n.progress div { height: 100%; width: 0; border-radius: 99px; background: linear-gradient(90deg, var(--accent), var(--accent-2)); transition: width .4s; }\n.q-actions { display: flex; gap: 8px; }\n.queue .hint { margin: 6px 0; color: var(--muted); font-size: 13px; }\n\n.bulk { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }\n.check { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 14px; cursor: pointer; }\n.list input[type=checkbox], .check input { width: 18px; height: 18px; accent-color: var(--accent); flex: none; }\n.tabs { flex-wrap: wrap; }\n.row-actions { display: flex; gap: 6px; flex: none; }\n.sub-date { color: var(--muted); font-size: 12px; }\n.ghost.small { padding: 6px 10px; font-size: 12px; }\n\nfooter a.link { text-decoration: underline; }\nfooter { max-width: 860px; margin: 0 auto; padding: 0 20px 40px; text-align: center; color: var(--muted); font-size: 12px; }\nfooter p { margin: 0 0 6px; }\n\ndialog { border: 1px solid var(--line); border-radius: 18px; padding: 22px; max-width: 420px; background: var(--card); color: var(--text); box-shadow: 0 20px 60px rgba(0, 0, 0, .3); }\ndialog::backdrop { background: rgba(10, 11, 16, .5); }\n#dlg-msg { margin: 0 0 18px; white-space: pre-line; }\n.dlg-actions { display: flex; justify-content: flex-end; gap: 8px; }\n\n.muted { color: var(--muted); font-size: 13px; }\n#dlg-paste textarea { width: 100%; margin: 0 0 14px; padding: 10px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--text); font: inherit; resize: vertical; }\n#dlg-paste p { margin: 0 0 10px; }\n#dlg-paste .primary { padding: 8px 18px; }\n.notice { margin: 14px 0 0; padding: 10px 12px; border-radius: 12px; background: rgba(23, 166, 115, .12); color: var(--good); font-size: 14px; }\n";
const LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAFTUlEQVR42tWaW08bRxiG56fwE/gd7AHu8HXoLXDZ2K1atQK1atXaKiVNQ5o2NCxpmhAIh0AwLOFgBxsKPnOwDQYDNgabg4FAUr3dcfAa411Ym6iwnzTSajXafWb2m3fe0beEqMTtisNyU8WB+bOKtPg5s48vmD18yezgKyaFr5kkGphtNDJb+IbZxLdMHN8xMXzPbOAHZh0/MlFYmFX8xKygiYmgmVnGHSaMu0wIv7JBtLCLuM8u4AE7h9/ZAB6yfrSyPjxivWhj3WhnXXjMzuIJOyM+ZafNz9ipcqI1Pq04KpPgRWPFASR4XCM8/manIcGjg3Wik3WIL9g3ZZfBV0nwqRsIjy52Et2sPdXL2qougD/CDYZHD2tDHzuBl9x4lVLapPQA38+NY4AbS73iRsvOLlhRR/AY5F7Dyo2IstroEB7DnAiRGy4np1KpR3iMcENmcs06XzL8a24Io9ygSHQMj3HuFYie4Se4ARA9w9u5fhA9w7/h+kD0DO/gekGuCt9aHYS1YQ0zbQnMSm3CvIbe2mAB/GBdAE7zEgLCWqY5GhbQb3BeCd7J9YCUCt9zO4p19yHUIh0/hleISW0jc60W2+5dTBo9JcFPc90gpcB7OlP42BHpihYN/w/3AqRY+HnrXt6LY+4DKW2iGDSGYTWGMGQMImrfKQBctycxYfTDZvTBbvTCZV6UZj+/37p1oyj4Wa4TpBj46bZt+WXH6ffoNy4XLNiOao9iyhzE3yrm/JTRhXfpd3K/ZSGsGd7FPQfRCt9+aykPvrs2pKg2NOfltLAmMi0bC8Kq4oJ11DnzBuGsGdME7+E6QLSqzYJ1V37BcMOqIvzzajdOpMFlZ7y3ehp9hqnMNY0TCdJqsCsuWG+jS35+3LqmCd7LPwPRqvPH6X8zD9+Pn6jqvNO8LEN47kVknfe15L6exzKvqjZv4x9UjX4NLfB+/imIFvjO2hyYq21TdZPyC+tyv8GaGXmTEmum5PshYVlVbVaEoNzPWz92KXyAfwKiZYd9aYzID7ZJiqO2wybcOYU6v8NmI+lOqUpl0OKR+82Z7JfCz/N/gWixB1RtsmE3r6rag7MDOK822UhJA1CTypDFnVvwJtul8Av8YxAt3qZHUhw5h9tiqt5mTojK/WjaZOHHaibl+0uSTKrpfFRYyH2B+pFL4YN8O4hWY3Z8qi5U49WM2Yw5l8OBlrCsNvMtuftzFp+qzmcX8fv0iSb4MC+AaHWVYWsytw4aQoqucsDgyEgljcP4EUTDBEYM4ziSrrPqYjOMKMIvNuYWetIa0QS/xD8C0WqJu2/55RdQrR+u8yla4kUhkmcNaJM3NiGkCO+rH83Muvz1PhnQBB/h/wQpxs/7zsgkHQT1NufVZshgy8z++aDpYTcMF8BTtTkLHxMCmuFX+FaQYg8jEetWHtiWZIepMaOW2GF0Z7zNpn2rYABb9ji8Jid8Jgf8pkmELS7sefL70dQpBj7KPwQp5SQV6tr46HY60RUsGn6N/wOk1GMgtcTn7fDZoAuX5nxE2l2z6qIU+54EQqaxkuA3+AcgVz3D0pyfbfAhLCxlWsDix1TdZIFUeurGM2mzJsxjXWrhRgc8hl7NaqMEH+N/A/k/D+BavE0x8Jv8fRA9wyf4FhA9w2/z90D0DJ/k74LoGX6H/wWEljL1Cr9beUckp3VYPcJjr7LZTGgRWY/w+5XNSFf+/KEATovIOoQX5SolrYDTIrKO4FMHlU35VXtaAdcHfBMkeOVqPa2A0yLyDZ/5qgv/l6AVcFpEvok5X5A2FwUtItM6LC1lXqfOU6mU1UYh/gNITVsBpzsTiwAAAABJRU5ErkJggg==";
// ---- shared.js ----
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

// ---- i18n.js ----
// Türkçe / İngilizce metinler. Dil: kullanıcı seçimi (storage "lang"), yoksa tarayıcı dili.
const STRINGS = {
  tr: {
    appName: "Unfollow Radar",
    tagline: "Seni geri takip etmeyenleri bul, güvenle yönet",
    onbTitle: "Başlamadan önce",
    onbPoints: [
      ["Verilerin sende kalır.", "Hiçbir şey sunucuya gönderilmez; her şey bu tarayıcıda saklanır."],
      ["Sadece kendi hesabın.", "Instagram'da hangi hesapla giriş yaptıysan o taranır."],
      ["Günde en fazla 3 tarama.", "Instagram'ı yormamak ve hesabını korumak için."],
      ["Takipten çıkarma yavaştır.", "Kişiler arasında 4–5 saniye, her 5 kişide ise 5 dakika beklenir; günde en fazla 30 kişi çıkarılır."],
      ["Risk:", "Bu araç Instagram ile bağlantılı değildir. Otomasyon, Instagram'ın kullanım şartlarına aykırı sayılabilir ve nadiren de olsa hesap kısıtlamasına yol açabilir. Sorumluluk sana aittir."],
    ],
    ack: "Anladım, başla",
    scanTitle: "Instagram hesabını tara",
    quota: (left, max) => `Bugün ${left}/${max} tarama hakkın kaldı`,
    run: "Hesabımı tara",
    qRunning: "Takipten çıkarılıyor",
    qPaused: "Duraklatıldı",
    qDone: "Tamamlandı",
    qNext: (s) => ` · sonraki ${s} sn`,
    qFailMsg: (n, list) => `${n} kişi çıkarılamadı: ${list}`,
    qPause: "Durdur",
    qResume: "Devam et",
    qCancel: "İptal et",
    qClose: "Kapat",
    statFollowers: "Takipçi",
    statFollowing: "Takip edilen",
    statNfb: "Geri takip etmeyen",
    statMutual: "Karşılıklı",
    tabNfb: "Geri takip etmeyenler",
    tabNfbMe: "Takip etmediklerim",
    tabMutual: "Karşılıklı",
    tabWl: "Korunanlar",
    tabHist: "Çıkarılanlar",
    search: "Ara…",
    selectAll: "Tümünü seç",
    bulkRun: (n) => `Seçilenleri yavaşça çıkar (${n})`,
    empty: "Gösterilecek kimse yok.",
    wlHint: "Korunan hesaplar toplu çıkarmadan hariç tutulur.",
    wlExport: "Dışa aktar",
    wlImport: "İçe aktar",
    wlPaste: "Toplu ekle",
    pasteMsg: "Korumak istediğin kullanıcı adlarını ya da profil bağlantılarını yapıştır (boşluk, virgül veya satır ile ayır).",
    pastePh: "ornek_kullanici, @baska.kisi, https://www.instagram.com/biri/",
    cancel: "Vazgeç",
    add: "Ekle",
    confirmYes: "Onayla",
    btnUnfollowShort: "Çıkar",
    btnDelete: "Sil",
    footerNote: "Unfollow Radar, Instagram veya Meta ile bağlantılı değildir. Veriler yalnızca bu tarayıcıda saklanır.",
    wipe: "Tüm verilerimi sil",
    wipeConfirm: "Tarama sonuçları, korunanlar, geçmiş ve ayarlar dahil tüm verilerin bu tarayıcıdan silinecek. Emin misin?",
    protect: "Koru",
    unfollow: "Çıkar",
    queued: "Sırada",
    unprotect: "Korumayı kaldır",
    refollow: "Geri takip et",
    openProfile: "Profili aç",
    resultsFor: (label, date) => `${label} için sonuçlar · ${date}`,
    incompleteMsg: (ef, eg, gf, gg) =>
      `Tarama eksik görünüyor (Instagram ${ef} takipçi / ${eg} takip diyor, ${gf} / ${gg} alındı). Yanlış kişileri çıkarmamak için takipten çıkarma kilitlendi. Taramayı yenile.`,
    wlAdded: (n) => `${n} yeni hesap korunanlara eklendi.`,
    wlExportEmpty: "Dışa aktarılacak korunan hesap yok.",
    wlBadFile: "Geçersiz dosya: kullanıcı adı içeren bir JSON listesi bekleniyordu.",
    wlNoValid: "Geçerli bir kullanıcı adı bulunamadı.",
    enqueueConfirm: (n, gmin, gmax, every, pause, minutes) =>
      `${n} kişi takipten çıkarılacak. Aralarında ${gmin}–${gmax} sn beklenir, her ${every} kişide ${pause} dk mola verilir (yaklaşık ${minutes} dk); sekme/tarayıcı açık kalmalı.`,
    enqueueOverLimit: (limit, left) =>
      `Günlük limit (${limit}) nedeniyle bugün yalnızca ${left} kişi çıkarılır; kalanı için yarın "Devam et"e basman gerekir.`,
    enqueueFail: "Kuyruğa eklenemedi.",
    startFail: "Başlatılamadı.",
    followFail: "Takip edilemedi.",
    langToggle: "English",
    // tarama
    starting: "Başlıyor…",
    resuming: (n) => `Kaldığı yerden devam ediliyor (${n} kişi önbellekte)…`,
    fetching: (label, n) => `${label} alınıyor… ${n}`,
    lblFollowers: "Takipçiler",
    lblFollowing: "Takip edilenler",
    limitWait: (label, s) => `İstek sınırı: ${s} sn sonra devam edilecek (${label})`,
    netWait: (label, s) => `Ağ hatası: ${s} sn sonra devam edilecek (${label})`,
    safetyBreak: (s) => `Güvenlik molası: ${s} sn`,
    accountFallback: "Hesabım",
    err429: "Instagram istek sınırı (429). Biraz bekleyip tekrar dene.",
    errFeedback: "Instagram hesabına geçici bir kısıtlama uyguladı (feedback_required). Birkaç saat bekleyip tekrar dene.",
    errLogin: "Instagram'a giriş yapmış olmalısınız.",
    errReq: (s) => `İstek başarısız: ${s}`,
    errBadResponse: "Instagram beklenmeyen bir yanıt verdi (arayüz değişmiş olabilir).",
    errBadShape: "Instagram yanıtı beklenenden farklı (arayüz değişmiş olabilir).",
    // kuyruk
    scanQuotaFull: (n) => `Bugünkü ${n} tarama hakkın doldu. Yarın tekrar dene.`,
    limitNote: (n) => `Günlük ${n} çıkarma limiti doldu. Yarın "Devam et" ile sürdürebilirsin.`,
    blockedNote: 'Instagram işlemi engelledi. Hesabını korumak için kuyruk durduruldu; birkaç saat bekleyip "Devam et"e bas.',
    failStreakNote: (n) => `Üst üste ${n} işlem başarısız oldu (Instagram kısıtlıyor olabilir). Güvenlik için kuyruk durduruldu; bir süre bekleyip "Devam et"e bas.`,
    longPauseNote: (p, m) => `${p} kişi işlendi; hesabını korumak için ${m} dk mola veriliyor.`,
    lockedIncomplete: "Tarama eksik göründüğü için çıkarma kilitli. Taramayı yenile.",
    invalidUser: "Geçersiz kullanıcı adı.",
    // uzantı arka planı / sayfa otomasyonu
    errConnect: "Instagram sayfasına bağlanılamadı. Instagram'da giriş yaptığından emin ol ve tekrar dene.",
    errTimeout: "Zaman aşımı.",
    errFollowBtn: "Takip düğmesi bulunamadı (zaten takip etmiyor olabilirsiniz).",
    errMenuItem: "'Takibi bırak' seçeneği bulunamadı.",
    errUnfollowVerify: "Takipten çıkma doğrulanamadı.",
    errFollowBtn2: "'Takip et' düğmesi bulunamadı (zaten takip ediyor olabilirsiniz).",
    errFollowVerify: "Takip etme doğrulanamadı.",
    errBlockedUi: "Instagram işlemi engelledi (action block).",
    // konsol sürümü
    errTokens: "Instagram oturum anahtarları okunamadı. Sayfayı yenileyip betiği tekrar çalıştır.",
    errNoTarget: "Kullanıcının kimliği bulunamadı; taramayı yenile.",
    errUnfollowFailed: (s) => `Takipten çıkarma başarısız (${s}).`,
    errStillFollowing: "Instagram işlemi uygulamadı (hâlâ takip ediliyor).",
    errNoRefollow: "Konsol sürümünde geri takip yok; profili açıp elle takip et.",
    closePanel: "Kapat",
    errWrongSite: "Önce https://www.instagram.com adresini aç, giriş yap ve betiği orada çalıştır.",
  },
  en: {
    appName: "Unfollow Radar",
    tagline: "Find who doesn't follow you back — and manage it safely",
    onbTitle: "Before you start",
    onbPoints: [
      ["Your data stays with you.", "Nothing is sent to any server; everything is stored in this browser."],
      ["Your own account only.", "Whichever account you're signed in with on Instagram is the one that gets scanned."],
      ["At most 3 scans a day.", "To go easy on Instagram and protect your account."],
      ["Unfollowing is slow.", "4–5 seconds between people and a 5 minute break after every 5; at most 30 people a day."],
      ["Risk:", "This tool is not affiliated with Instagram. Automation may violate Instagram's Terms of Use and can, rarely, get an account restricted. Use at your own risk."],
    ],
    ack: "Got it, let's start",
    scanTitle: "Scan your Instagram account",
    quota: (left, max) => `${left}/${max} scans left today`,
    run: "Scan my account",
    qRunning: "Unfollowing",
    qPaused: "Paused",
    qDone: "Done",
    qNext: (s) => ` · next in ${s} s`,
    qFailMsg: (n, list) => `${n} could not be unfollowed: ${list}`,
    qPause: "Pause",
    qResume: "Resume",
    qCancel: "Cancel",
    qClose: "Close",
    statFollowers: "Followers",
    statFollowing: "Following",
    statNfb: "Don't follow back",
    statMutual: "Mutual",
    tabNfb: "Not following back",
    tabNfbMe: "I don't follow back",
    tabMutual: "Mutual",
    tabWl: "Protected",
    tabHist: "Unfollowed",
    search: "Search…",
    selectAll: "Select all",
    bulkRun: (n) => `Slowly unfollow selected (${n})`,
    empty: "Nobody to show.",
    wlHint: "Protected accounts are excluded from bulk unfollowing.",
    wlExport: "Export",
    wlImport: "Import",
    wlPaste: "Add many",
    pasteMsg: "Paste the usernames or profile links you want to protect (separate with spaces, commas or new lines).",
    pastePh: "some_user, @another.one, https://www.instagram.com/someone/",
    cancel: "Cancel",
    add: "Add",
    confirmYes: "Confirm",
    btnUnfollowShort: "Unfollow",
    btnDelete: "Delete",
    footerNote: "Unfollow Radar is not affiliated with Instagram or Meta. Data is stored only in this browser.",
    wipe: "Delete all my data",
    wipeConfirm: "All your data — scan results, protected accounts, history and settings — will be deleted from this browser. Are you sure?",
    protect: "Protect",
    unfollow: "Unfollow",
    queued: "Queued",
    unprotect: "Unprotect",
    refollow: "Follow back",
    openProfile: "Open profile",
    resultsFor: (label, date) => `Results for ${label} · ${date}`,
    incompleteMsg: (ef, eg, gf, gg) =>
      `The scan looks incomplete (Instagram reports ${ef} followers / ${eg} following, got ${gf} / ${gg}). Unfollowing is locked so the wrong people aren't removed. Scan again.`,
    wlAdded: (n) => `${n} new account(s) added to Protected.`,
    wlExportEmpty: "There are no protected accounts to export.",
    wlBadFile: "Invalid file: expected a JSON list containing usernames.",
    wlNoValid: "No valid username found.",
    enqueueConfirm: (n, gmin, gmax, every, pause, minutes) =>
      `${n} people will be unfollowed. There's a ${gmin}–${gmax} s wait between them and a ${pause} min break after every ${every} (about ${minutes} min); keep the tab/browser open.`,
    enqueueOverLimit: (limit, left) =>
      `Because of the daily limit (${limit}), only ${left} will be unfollowed today; press "Resume" tomorrow for the rest.`,
    enqueueFail: "Could not add to the queue.",
    startFail: "Could not start.",
    followFail: "Could not follow.",
    langToggle: "Türkçe",
    starting: "Starting…",
    resuming: (n) => `Resuming where it left off (${n} people cached)…`,
    fetching: (label, n) => `Fetching ${label}… ${n}`,
    lblFollowers: "followers",
    lblFollowing: "following",
    limitWait: (label, s) => `Rate limited: continuing in ${s} s (${label})`,
    netWait: (label, s) => `Network error: continuing in ${s} s (${label})`,
    safetyBreak: (s) => `Safety break: ${s} s`,
    accountFallback: "My account",
    err429: "Instagram rate limit (429). Wait a bit and try again.",
    errFeedback: "Instagram applied a temporary restriction to your account (feedback_required). Wait a few hours and try again.",
    errLogin: "You need to be signed in to Instagram.",
    errReq: (s) => `Request failed: ${s}`,
    errBadResponse: "Instagram returned an unexpected response (the site may have changed).",
    errBadShape: "Instagram's response was not what was expected (the site may have changed).",
    scanQuotaFull: (n) => `You've used all ${n} scans for today. Try again tomorrow.`,
    limitNote: (n) => `Daily limit of ${n} unfollows reached. You can continue tomorrow with "Resume".`,
    blockedNote: 'Instagram blocked the action. The queue was paused to protect your account; wait a few hours, then press "Resume".',
    failStreakNote: (n) => `${n} actions in a row failed (Instagram may be restricting you). The queue was paused for safety; wait a while, then press "Resume".`,
    longPauseNote: (p, m) => `${p} people processed; taking a ${m} min break to protect your account.`,
    lockedIncomplete: "Unfollowing is locked because the scan looks incomplete. Scan again.",
    invalidUser: "Invalid username.",
    errConnect: "Could not connect to the Instagram page. Make sure you're signed in to Instagram and try again.",
    errTimeout: "Timed out.",
    errFollowBtn: "Follow button not found (you may already not be following).",
    errMenuItem: "The 'Unfollow' option was not found.",
    errUnfollowVerify: "Could not verify the unfollow.",
    errFollowBtn2: "'Follow' button not found (you may already be following).",
    errFollowVerify: "Could not verify the follow.",
    errBlockedUi: "Instagram blocked the action (action block).",
    errTokens: "Could not read Instagram's session tokens. Reload the page and run the script again.",
    errNoTarget: "Could not find the user's ID; scan again.",
    errUnfollowFailed: (s) => `Unfollow failed (${s}).`,
    errStillFollowing: "Instagram did not apply the action (still following).",
    errNoRefollow: "The console version can't follow back; open the profile and follow manually.",
    closePanel: "Close",
    errWrongSite: "Open https://www.instagram.com first, sign in, and run the script there.",
  },
};

let LANG = String(globalThis.navigator?.language || "tr").toLowerCase().startsWith("tr") ? "tr" : "en";
const tx = (key, ...args) => {
  const v = STRINGS[LANG][key] ?? STRINGS.tr[key] ?? key;
  return typeof v === "function" ? v(...args) : v;
};
const setLang = (l) => { if (l === "tr" || l === "en") LANG = l; };

// Kullanıcının seçtiği dili yükler ve değişiklikleri izler. `area` = chrome.storage.local benzeri nesne.
async function initLang(area, onChanged) {
  const { lang } = await area.get("lang");
  setLang(lang);
  onChanged?.addListener((changes) => changes.lang && setLang(changes.lang.newValue));
}

// ---- console-src/shim.js ----
// Konsol sürümü için chrome.storage / chrome.runtime benzeri katman: localStorage üzerinde çalışır.
const chrome = (() => {
  const PREFIX = "unfollowRadar:";
  const listeners = [];
  const read = (k) => {
    try {
      const v = localStorage.getItem(PREFIX + k);
      return v == null ? undefined : JSON.parse(v);
    } catch {
      return undefined;
    }
  };
  const emit = (changes) => listeners.forEach((f) => { try { f(changes); } catch (e) { console.error(e); } });
  const local = {
    async get(keys) {
      const list = keys == null ? [] : Array.isArray(keys) ? keys : [keys];
      const out = {};
      for (const k of list) { const v = read(k); if (v !== undefined) out[k] = v; }
      return out;
    },
    async set(obj) {
      const changes = {};
      for (const [k, v] of Object.entries(obj)) {
        const json = JSON.stringify(v);
        try {
          localStorage.setItem(PREFIX + k, json);
        } catch {
          localStorage.removeItem(PREFIX + "scanProgress"); // kota dolduysa önbelleği feda et
          localStorage.setItem(PREFIX + k, json);
        }
        changes[k] = { newValue: v };
      }
      emit(changes);
    },
    async remove(keys) {
      const changes = {};
      for (const k of [].concat(keys)) { localStorage.removeItem(PREFIX + k); changes[k] = { newValue: undefined }; }
      emit(changes);
    },
    async clear() {
      const changes = {};
      for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) { localStorage.removeItem(k); changes[k.slice(PREFIX.length)] = { newValue: undefined }; }
      emit(changes);
    },
  };
  return {
    storage: { local, onChanged: { addListener: (f) => listeners.push(f) } },
    runtime: { sendMessage: (msg) => consoleRouter(msg) },
  };
})();
const store = { get: (k) => chrome.storage.local.get(k), set: (o) => chrome.storage.local.set(o) };

// ---- scan-core.js ----
// Tarama çekirdeği: uzantı (content script) ve konsol sürümü ortak kullanır.
// Gerektirenler (global): chrome.storage.local, SCAN, LIMITS, isToday, tx.
const IG_APP_ID = "936619743392459";
const BLOCK_API_RE = /feedback_required|checkpoint_required|action_blocked|challenge_required/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const setState = (state) => chrome.storage.local.set({ state });

// 429 ve geçici kısıtlama (feedback_required...): artan beklemeyle yeniden denenir.
class RateLimitError extends Error {}

async function igGet(path) {
  const res = await fetch(`https://www.instagram.com${path}`, {
    credentials: "include",
    headers: { "x-ig-app-id": IG_APP_ID, "x-requested-with": "XMLHttpRequest" },
  });
  if (res.status === 429) throw new RateLimitError(tx("err429"));
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (BLOCK_API_RE.test(body)) throw new RateLimitError(tx("errFeedback"));
    if (res.status === 401 || res.status === 403) throw new Error(tx("errLogin"));
    throw new Error(tx("errReq", res.status));
  }
  try {
    return await res.json();
  } catch {
    throw new Error(tx("errBadResponse"));
  }
}

async function withBackoff(fn, label) {
  for (let retries = 0; ; ) {
    try {
      return await fn();
    } catch (e) {
      const limited = e instanceof RateLimitError;
      const network = e instanceof TypeError || /fetch|network/i.test(e.message || "");
      if (!(limited || network) || retries >= SCAN.maxRetries) throw e;
      retries++;
      const secs = (limited ? SCAN.rateLimitCooldownS : SCAN.networkRetryS) * retries;
      for (let s = secs; s > 0; s--) {
        await setState({ phase: "waiting", text: tx(limited ? "limitWait" : "netWait", label, s) });
        await sleep(1000);
      }
    }
  }
}

// Sayfalar arası bekleme + her N istekte uzun uyku.
let requestsSinceLongSleep = 0;
async function paceRequest() {
  await sleep(Math.floor(Math.random() * SCAN.jitterSpanMs) + SCAN.jitterMinMs);
  const T = SCAN.timeBetweenCyclesMs;
  await sleep(Math.floor(Math.random() * (T * 1.3 - T)) + T);
  if (++requestsSinceLongSleep >= SCAN.checksBeforeLongSleep) {
    requestsSinceLongSleep = 0;
    const ms = Math.max(0, SCAN.longSleepMs + (Math.random() * SCAN.longSleepJitterMs * 2 - SCAN.longSleepJitterMs));
    for (let s = Math.round(ms / 1000); s > 0; s--) {
      await setState({ phase: "waiting", text: tx("safetyBreak", s) });
      await sleep(1000);
    }
  }
}

// part = { done, users, maxId }: yarım kalan taramayı sürdürmek için her sayfada kaydedilir.
async function fetchAll(userId, kind, label, part, onPage) {
  const users = new Map(part.users.map((u) => [u.pk, u]));
  let maxId = part.maxId || "";
  let pages = 0;
  do {
    const q = `count=${SCAN.pageSize}${maxId ? `&max_id=${encodeURIComponent(maxId)}` : ""}`;
    const data = await withBackoff(() => igGet(`/api/v1/friendships/${userId}/${kind}/?${q}`), label);
    if (!Array.isArray(data.users)) throw new Error(tx("errBadShape"));
    for (const u of data.users) {
      users.set(String(u.pk || u.id), {
        pk: String(u.pk || u.id),
        username: u.username,
        fullName: u.full_name,
        pic: u.profile_pic_url,
        verified: !!u.is_verified,
        isPrivate: !!u.is_private,
      });
    }
    maxId = data.next_max_id || "";
    await onPage([...users.values()], maxId);
    await setState({ phase: "running", text: tx("fetching", label, users.size) });
    if (maxId && ++pages >= SCAN.pageSafetyLimit) {
      part.truncated = true; // sayfa güvenlik sınırı: liste eksik kalır, çıkarma kilitlenir
      break;
    }
    if (maxId) await paceRequest();
  } while (maxId);
  return [...users.values()];
}

// Giriş yapmış hesabın kimliği (oturum çerezinden).
const selfId = () => document.cookie.match(/(?:^|; )ds_user_id=(\d+)/)?.[1];

async function compare() {
  const uid = selfId();
  if (!uid) throw new Error(tx("errLogin"));
  await setState({ phase: "running", text: tx("starting") });
  requestsSinceLongSleep = 0;
  // Hesap adı ve beklenen sayılar isteğe bağlı; bu istek sınırlanırsa (429) beklemeden devam et.
  const user = await igGet(`/api/v1/users/${uid}/info/`).then((i) => i?.user).catch(() => null);
  const username = user?.username;

  // Önbellek: yarım kalan tarama varsa kaldığı yerden devam et.
  const saved = (await chrome.storage.local.get("scanProgress")).scanProgress;
  const fresh = () => ({ done: false, users: [], maxId: "" });
  const progress =
    saved && saved.uid === uid && Date.now() - saved.ts < LIMITS.resumeWindowMs
      ? saved
      : { uid, ts: Date.now(), followers: fresh(), following: fresh() };
  const cached = progress.followers.users.length + progress.following.users.length;
  if (cached) await setState({ phase: "running", text: tx("resuming", cached) });

  const pull = async (kind, label) => {
    const part = progress[kind];
    if (part.done) return part.users;
    const users = await fetchAll(uid, kind, label, part, async (list, maxId) => {
      Object.assign(part, { users: list, maxId });
      progress.ts = Date.now();
      await chrome.storage.local.set({ scanProgress: progress });
    });
    Object.assign(part, { done: true, users, maxId: "" });
    await chrome.storage.local.set({ scanProgress: progress });
    return users;
  };
  const followers = await pull("followers", tx("lblFollowers"));
  const following = await pull("following", tx("lblFollowing"));

  // Eksik tarama koruması: Instagram'ın bildirdiği sayıyla uyuşmuyorsa çıkarma kilitlenir.
  const short = (got, expected) => typeof expected === "number" && got < expected - Math.max(2, expected * 0.03);
  const incomplete =
    short(followers.length, user?.follower_count) ||
    short(following.length, user?.following_count) ||
    !!progress.followers.truncated ||
    !!progress.following.truncated;

  const followerNames = new Set(followers.map((u) => u.username));
  const followingNames = new Set(following.map((u) => u.username));
  return {
    label: username ? `@${username}` : tx("accountFallback"),
    username,
    ts: Date.now(),
    incomplete,
    expected: { followers: user?.follower_count, following: user?.following_count },
    followerCount: followers.length,
    followingCount: following.length,
    notFollowingBack: following.filter((u) => !followerNames.has(u.username)),
    notFollowedBack: followers.filter((u) => !followingNames.has(u.username)),
    mutual: following.filter((u) => followerNames.has(u.username)),
  };
}

let running = false;
async function run() {
  if (running) return;
  running = true;
  try {
    await setState({ phase: "running", text: tx("starting") });
    const result = await compare();
    // Günlük tarama hakkı yalnızca başarılı taramada düşer; önbellek temizlenir.
    const { scans = [] } = await chrome.storage.local.get("scans");
    await chrome.storage.local.set({ scans: [...scans.filter(isToday), Date.now()] });
    await chrome.storage.local.remove("scanProgress");
    await setState({ phase: "done", result });
  } catch (e) {
    await setState({ phase: "error", error: e.message });
  } finally {
    running = false;
  }
}

// Sayfa yenilendiyse yarım kalan bir işlem artık çalışmıyordur.
async function resetStaleState() {
  const { state } = await chrome.storage.local.get("state");
  if (state && (state.phase === "running" || state.phase === "waiting")) await setState({ phase: "idle" });
}

// ---- queue-core.js ----
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

// ---- panel.js ----
// Panel arayüzü. HTML metni (innerHTML) kullanmaz; yalnızca DOM komutları: Instagram'ın sayfa güvenlik
// kuralları (CSP / Trusted Types) altında da çalışır. Uzantı ve konsol sürümü ortak kullanır.
function buildPanel(doc, opts = {}) {
  const e = (tag, attrs = {}, ...kids) => {
    const el = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "hidden" || k === "disabled") el[k] = !!v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) el.append(kid?.nodeType ? kid : doc.createTextNode(String(kid)));
    return el;
  };
  const stat = (cls, id, label) => e("div", { class: `stat ${cls}`.trim() }, e("b", { id }, "0"), e("span", { "data-i": label }, tx(label)));
  const tab = (name, label, active) => e("button", { "data-tab": name, "data-i": label, class: active ? "active" : "", role: "tab" }, tx(label), " ", e("i"));

  const frag = doc.createDocumentFragment();
  frag.append(
    e("header", { class: "top" },
      e("div", { class: "brand" },
        e("img", { class: "logo", src: opts.logoSrc || "", alt: "", width: 44, height: 44 }),
        e("div", {}, e("h1", {}, tx("appName")), e("p", {}, tx("tagline")))
      ),
      e("button", { id: "lang", class: "ghost small" }, tx("langToggle"))
    ),
    e("main", {},
      e("section", { id: "onboarding", class: "card", hidden: true },
        e("h2", {}, tx("onbTitle")),
        e("ul", { class: "points" }, tx("onbPoints").map(([b, text]) => e("li", {}, e("b", {}, b), " ", text))),
        e("button", { id: "ack", class: "primary wide" }, tx("ack"))
      ),
      e("section", { id: "start", class: "card start", hidden: true },
        e("div", { class: "row" },
          e("div", { class: "who-me" }, e("b", {}, tx("scanTitle")), e("span", { id: "quota" })),
          e("button", { id: "run", class: "primary" }, tx("run"))
        ),
        e("div", { id: "banner", class: "banner", hidden: true }, e("div", { class: "spinner" }), e("span", { id: "status" })),
        e("p", { id: "error", class: "error", hidden: true }),
        e("p", { id: "notice", class: "notice", hidden: true })
      ),
      e("section", { id: "queue", class: "card queue", hidden: true },
        e("div", { class: "q-head" }, e("b", { id: "q-title" }), e("span", { id: "q-sub" })),
        e("div", { class: "progress" }, e("div", { id: "q-bar" })),
        e("p", { id: "q-note", class: "hint", hidden: true }),
        e("p", { id: "q-fail", class: "error", hidden: true }),
        e("div", { class: "q-actions" }, e("button", { id: "q-pause", class: "ghost" }), e("button", { id: "q-clear", class: "ghost" }))
      ),
      e("section", { id: "results", hidden: true },
        e("p", { id: "who", class: "who" }),
        e("div", { class: "stats" },
          stat("", "s-followers", "statFollowers"),
          stat("", "s-following", "statFollowing"),
          stat("warn", "s-nfb", "statNfb"),
          stat("good", "s-mutual", "statMutual")
        ),
        e("p", { id: "incomplete", class: "error", hidden: true }),
        e("div", { class: "toolbar" },
          e("div", { id: "tabs", class: "tabs", role: "tablist" },
            tab("notFollowingBack", "tabNfb", true),
            tab("notFollowedBack", "tabNfbMe"),
            tab("mutual", "tabMutual"),
            tab("whitelist", "tabWl"),
            tab("history", "tabHist")
          ),
          e("input", { id: "search", type: "search", placeholder: tx("search"), autocomplete: "off" })
        ),
        e("div", { id: "bulk", class: "bulk", hidden: true },
          e("label", { class: "check" }, e("input", { type: "checkbox", id: "select-all" }), " ", tx("selectAll")),
          e("button", { id: "bulk-run", class: "danger", disabled: true })
        ),
        e("div", { id: "wl-tools", class: "bulk", hidden: true },
          e("span", { class: "muted" }, tx("wlHint")),
          e("div", { class: "row-actions" },
            e("button", { id: "wl-export", class: "ghost small" }, tx("wlExport")),
            e("button", { id: "wl-import", class: "ghost small" }, tx("wlImport")),
            e("button", { id: "wl-paste", class: "ghost small" }, tx("wlPaste")),
            e("input", { id: "wl-file", type: "file", accept: ".json,application/json", hidden: true })
          )
        ),
        e("ul", { id: "list", class: "list" }),
        e("p", { id: "empty", class: "empty", hidden: true }, tx("empty"))
      )
    ),
    e("footer", {},
      e("p", {}, tx("footerNote")),
      e("button", { id: "wipe", class: "link" }, tx("wipe")),
      " · ",
      e("a", { class: "link", href: "https://github.com/yigitbuyukeren/unfollow-radar", target: "_blank", rel: "noreferrer" }, "GitHub")
    ),
    e("dialog", { id: "dlg" },
      e("p", { id: "dlg-msg" }),
      e("div", { class: "dlg-actions" }, e("button", { id: "dlg-no", class: "ghost" }, tx("cancel")), e("button", { id: "dlg-yes", class: "danger" }, tx("confirmYes")))
    ),
    e("dialog", { id: "dlg-paste" },
      e("p", {}, tx("pasteMsg")),
      e("textarea", { id: "paste-text", rows: 6, placeholder: tx("pastePh") }),
      e("div", { class: "dlg-actions" }, e("button", { id: "paste-no", class: "ghost" }, tx("cancel")), e("button", { id: "paste-yes", class: "primary" }, tx("add")))
    )
  );
  return frag;
}

// ---- app.js ----
// Panel mantığı: uzantı sayfası ve konsol sürümü ortak kullanır.
// host = { chrome, mode: "extension" | "console", logoSrc, reload(), open(url) }
async function mountApp(document, host) {
  const chrome = host.chrome;
  const win = document.defaultView;
  await initLang(chrome.storage.local, chrome.storage.onChanged);
  document.documentElement.lang = LANG;
  document.body.append(buildPanel(document, { logoSrc: host.logoSrc }));

  const $ = (id) => document.getElementById(id);
  const S = { state: null, queue: null, history: [], whitelist: [], scans: [], onboarded: false };
  const selected = new Set();
  let activeTab = "notFollowingBack";

  // ---------- profil resimleri: önce indirmeyi dener (uzantı host izni), olmazsa doğrudan <img> ----------
  const picCache = new Map();
  const picObserver = new win.IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        picObserver.unobserve(en.target);
        loadPic(en.target);
      }
    },
    { rootMargin: "200px" }
  );

  // Resmi yükler; biri başarısız olursa diğer yolu dener:
  // uzantı: önce indir (host izni) → olmazsa doğrudan; konsol: önce doğrudan (sayfanın kendi kaynağıyla) → olmazsa indir.
  const loadImg = (src, noReferrer) =>
    new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.alt = "";
      if (noReferrer) img.referrerPolicy = "no-referrer";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("img"));
      img.src = src;
    });
  const viaFetch = async (url) => {
    if (!picCache.has(url)) {
      const res = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" });
      if (!res.ok) throw new Error(res.status);
      picCache.set(url, URL.createObjectURL(await res.blob()));
    }
    return loadImg(picCache.get(url));
  };
  const direct = (url) => loadImg(url, host.mode === "extension");

  async function loadPic(el) {
    const url = el.dataset.pic;
    const order = host.mode === "extension" ? [viaFetch, direct] : [direct, viaFetch];
    for (const attempt of order) {
      try {
        el.replaceChildren(await attempt(url));
        return;
      } catch {
        // sıradaki yolu dene
      }
    }
    // olmadı: baş harf kalır. Nedenini görebilmek için ilk başarısızlığı konsola yaz.
    if (!loadPic.warned) {
      loadPic.warned = true;
      console.warn("[Unfollow Radar] profile picture could not be loaded:", new URL(url, "https://x").host);
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

  // ---------- yardımcılar ----------
  const todayScansLeft = () => LIMITS.dailyScans - S.scans.filter(isToday).length;
  const todayUnfollows = () => S.history.filter((h) => isToday(h.ts)).length;
  const whitelistNames = () => new Set(S.whitelist.map((u) => u.username));
  const isLocked = () => !!S.state?.result?.incomplete;
  const fmtDate = (ts) => new Date(ts).toLocaleString(LANG === "tr" ? "tr-TR" : "en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  let localError = ""; // arayüzden kaynaklanan hata; tarama hatası state'ten gelir
  function showError() {
    const err = S.state?.phase === "error" ? S.state.error : localError;
    $("error").hidden = !err;
    $("error").textContent = err || "";
  }
  function setError(text) {
    localError = text || "";
    showError();
  }
  let noticeTimer;
  function notify(text) {
    $("notice").hidden = false;
    $("notice").textContent = text;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => ($("notice").hidden = true), 4000);
  }

  function listFor(tab) {
    const r = S.state?.result;
    const wl = whitelistNames();
    switch (tab) {
      case "notFollowingBack": return (r?.notFollowingBack || []).filter((u) => !wl.has(u.username));
      case "notFollowedBack": return r?.notFollowedBack || [];
      case "mutual": return r?.mutual || [];
      case "whitelist": return S.whitelist;
      case "history": return S.history.slice().reverse();
      default: return [];
    }
  }

  // ---------- satır ----------
  function button(label, cls, onClick, disabled = false) {
    const b = document.createElement("button");
    b.className = cls;
    b.textContent = label;
    b.disabled = disabled;
    b.addEventListener("click", () => onClick(b));
    return b;
  }

  function row(u, queued) {
    const li = document.createElement("li");
    if (activeTab === "notFollowingBack" && !queued.has(u.username) && !isLocked()) {
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = selected.has(u.username);
      cb.addEventListener("change", () => {
        cb.checked ? selected.add(u.username) : selected.delete(u.username);
        renderBulk();
      });
      li.append(cb);
    }

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
    const sub = activeTab === "history" ? fmtDate(u.ts) : u.fullName;
    if (sub) {
      const s = document.createElement("small");
      s.textContent = sub;
      info.append(s);
    }
    li.append(avatar(u), info);

    const actions = document.createElement("div");
    actions.className = "row-actions";
    if (activeTab === "notFollowingBack") {
      actions.append(
        button(tx("protect"), "ghost small", () => protect(u)),
        queued.has(u.username)
          ? button(tx("queued"), "ghost small", () => {}, true)
          : button(tx("btnUnfollowShort"), "act", () => enqueue([u.username]), isLocked())
      );
    } else if (activeTab === "whitelist") {
      actions.append(button(tx("unprotect"), "ghost small", () => unprotect(u)));
    } else if (activeTab === "history") {
      if (host.mode === "console") actions.append(button(tx("openProfile"), "ghost small", () => host.open(`https://www.instagram.com/${u.username}/`)));
      else actions.append(button(tx("refollow"), "ghost small", (b) => refollow(u, b)));
    }
    li.append(actions);
    return li;
  }

  // ---------- çizim ----------
  function renderTop() {
    $("onboarding").hidden = S.onboarded;
    $("start").hidden = !S.onboarded;
    if (!S.onboarded) return;
    const state = S.state;
    const phase = state?.phase || "idle";
    const busy = phase === "running" || phase === "waiting";
    const left = todayScansLeft();
    $("quota").textContent = tx("quota", Math.max(left, 0), LIMITS.dailyScans);
    $("run").disabled = busy || left <= 0;
    $("banner").hidden = !busy;
    $("status").textContent = busy ? state.text || "…" : "";
    showError();
  }

  function renderQueue() {
    const q = S.queue;
    $("queue").hidden = !(q && q.total > 0);
    if (!q || !q.total) return;
    const finished = !q.items.length;
    $("q-title").textContent = finished ? tx("qDone") : q.paused ? tx("qPaused") : tx("qRunning");
    const secs = Math.max(0, Math.round((q.nextAt - Date.now()) / 1000));
    $("q-sub").textContent = `${q.done}/${q.total}` + (!finished && !q.paused && secs ? tx("qNext", secs) : "");
    $("q-bar").style.width = `${Math.round(((q.done + q.failed.length) / q.total) * 100)}%`;
    $("q-note").hidden = !q.note;
    $("q-note").textContent = q.note || "";
    $("q-fail").hidden = !q.failed.length;
    $("q-fail").textContent = q.failed.length ? tx("qFailMsg", q.failed.length, q.failed.map((f) => `${f.username} (${f.error})`).join(", ")) : "";
    $("q-pause").hidden = finished;
    $("q-pause").textContent = q.paused ? tx("qResume") : tx("qPause");
    $("q-clear").textContent = finished ? tx("qClose") : tx("qCancel");
  }

  function renderBulk() {
    const show = activeTab === "notFollowingBack";
    $("bulk").hidden = !show;
    $("wl-tools").hidden = activeTab !== "whitelist";
    if (!show) return;
    $("bulk-run").textContent = tx("bulkRun", selected.size);
    $("bulk-run").disabled = selected.size === 0 || isLocked();
    $("select-all").disabled = isLocked();
  }

  function renderResults() {
    const r = S.state?.result;
    const has = r || S.history.length || S.whitelist.length;
    $("results").hidden = !has;
    if (!has) return;

    $("who").textContent = r ? tx("resultsFor", r.label, fmtDate(r.ts)) : "";
    const exp = r?.expected || {};
    $("incomplete").hidden = !r?.incomplete;
    $("incomplete").textContent = r?.incomplete ? tx("incompleteMsg", exp.followers ?? "?", exp.following ?? "?", r.followerCount, r.followingCount) : "";
    $("s-followers").textContent = r?.followerCount ?? 0;
    $("s-following").textContent = r?.followingCount ?? 0;
    $("s-nfb").textContent = listFor("notFollowingBack").length;
    $("s-mutual").textContent = r?.mutual.length ?? 0;
    document.querySelectorAll("#tabs button").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === activeTab);
      b.querySelector("i").textContent = listFor(b.dataset.tab).length;
    });

    const q = $("search").value.trim().toLowerCase();
    const items = listFor(activeTab).filter((u) => !q || u.username.toLowerCase().includes(q) || (u.fullName || "").toLowerCase().includes(q));
    const queued = new Set(S.queue?.items || []);
    $("list").replaceChildren(...items.map((u) => row(u, queued)));
    $("list").hidden = items.length === 0;
    $("empty").hidden = items.length > 0;
    renderBulk();
  }

  const render = () => {
    renderTop();
    renderQueue();
    renderResults();
  };

  // Kendi onay penceremiz (tarayıcının confirm() penceresi dili tarayıcıdan alır).
  function askConfirm(message, yesLabel = tx("confirmYes")) {
    return new Promise((resolve) => {
      const d = $("dlg");
      $("dlg-msg").textContent = message;
      $("dlg-yes").textContent = yesLabel;
      $("dlg-yes").onclick = () => { d.close(); resolve(true); };
      $("dlg-no").onclick = () => { d.close(); resolve(false); };
      d.oncancel = () => resolve(false); // Esc
      d.showModal();
    });
  }

  // ---------- işlemler ----------
  const send = (msg) => chrome.runtime.sendMessage(msg);

  async function enqueue(names) {
    const left = LIMITS.dailyUnfollows - todayUnfollows();
    if (names.length > 1) {
      const minutes = Math.round((names.length * ((LIMITS.gapMinMs + LIMITS.gapMaxMs) / 2 + 8000)) / 60000 + Math.floor(names.length / LIMITS.longPauseEvery) * (LIMITS.longPauseMs / 60000));
      let msg = tx("enqueueConfirm", names.length, LIMITS.gapMinMs / 1000, LIMITS.gapMaxMs / 1000, LIMITS.longPauseEvery, LIMITS.longPauseMs / 60000, minutes);
      if (names.length > left) msg += "\n\n" + tx("enqueueOverLimit", LIMITS.dailyUnfollows, Math.max(left, 0));
      if (!(await askConfirm(msg, tx("btnUnfollowShort")))) return;
    }
    const res = await send({ type: "enqueue", usernames: names });
    if (!res?.ok) return setError(res?.error || tx("enqueueFail"));
    names.forEach((n) => selected.delete(n));
  }

  const protect = (u) => {
    selected.delete(u.username);
    return chrome.storage.local.set({
      whitelist: [...S.whitelist, { username: u.username, fullName: u.fullName, pic: u.pic, verified: u.verified, isPrivate: u.isPrivate }],
    });
  };
  const unprotect = (u) => chrome.storage.local.set({ whitelist: S.whitelist.filter((w) => w.username !== u.username) });

  async function refollow(entry, btn) {
    btn.disabled = true;
    btn.textContent = "…";
    setError("");
    const res = await send({ type: "follow", username: entry.username });
    if (!res?.ok) {
      btn.disabled = false;
      btn.textContent = tx("refollow");
      setError(res?.error || tx("followFail"));
    }
  }

  // ---------- beyaz liste: dışa / içe aktarma, toplu ekleme ----------
  const VALID_NAME = /^[A-Za-z0-9._]{1,30}$/;
  const addToWhitelist = (entries) => {
    const have = whitelistNames();
    const add = entries.filter((en) => !have.has(en.username) && have.add(en.username));
    return chrome.storage.local.set({ whitelist: [...S.whitelist, ...add] }).then(() => add.length);
  };

  $("wl-export").addEventListener("click", () => {
    if (!S.whitelist.length) return setError(tx("wlExportEmpty"));
    const blob = new Blob([JSON.stringify(S.whitelist, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `unfollow-radar-protected-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $("wl-import").addEventListener("click", () => $("wl-file").click());
  $("wl-file").addEventListener("change", async (ev) => {
    const file = ev.target.files[0];
    ev.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data)) throw new Error();
      const entries = data
        .map((en) => (typeof en === "string" ? { username: en } : en))
        .filter((en) => en && typeof en.username === "string" && VALID_NAME.test(en.username))
        .map((en) => ({ username: en.username, fullName: en.fullName, pic: en.pic, verified: !!en.verified, isPrivate: !!en.isPrivate }));
      if (!entries.length) throw new Error();
      setError("");
      notify(tx("wlAdded", await addToWhitelist(entries)));
    } catch {
      setError(tx("wlBadFile"));
    }
  });

  $("wl-paste").addEventListener("click", () => {
    $("paste-text").value = "";
    $("dlg-paste").showModal();
  });
  $("paste-no").addEventListener("click", () => $("dlg-paste").close());
  $("paste-yes").addEventListener("click", async () => {
    const names = $("paste-text").value
      .split(/[\s,;]+/)
      .map((s) => s.match(/instagram\.com\/([A-Za-z0-9._]+)/i)?.[1] || s.replace(/^@/, ""))
      .filter((n) => VALID_NAME.test(n));
    $("dlg-paste").close();
    if (!names.length) return setError(tx("wlNoValid"));
    setError("");
    notify(tx("wlAdded", await addToWhitelist(names.map((username) => ({ username })))));
  });

  // ---------- olaylar ----------
  document.querySelectorAll("#tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      activeTab = b.dataset.tab;
      renderResults();
    })
  );
  $("search").addEventListener("input", renderResults);

  $("select-all").addEventListener("change", (ev) => {
    const queued = new Set(S.queue?.items || []);
    const q = $("search").value.trim().toLowerCase();
    listFor("notFollowingBack")
      .filter((u) => !queued.has(u.username) && (!q || u.username.toLowerCase().includes(q)))
      .forEach((u) => (ev.target.checked ? selected.add(u.username) : selected.delete(u.username)));
    renderResults();
  });
  $("bulk-run").addEventListener("click", () => enqueue([...selected]));

  $("run").addEventListener("click", async () => {
    setError("");
    $("run").disabled = true;
    const res = await send({ type: "startCompare" });
    if (!res?.ok) {
      setError(res?.error || tx("startFail"));
      renderTop();
    }
  });

  $("ack").addEventListener("click", () => chrome.storage.local.set({ onboarded: true }));
  $("q-pause").addEventListener("click", () => send({ type: "queueControl", op: S.queue?.paused ? "resume" : "pause" }));
  $("q-clear").addEventListener("click", () => send({ type: "queueControl", op: "clear" }));
  $("lang").addEventListener("click", async () => {
    await chrome.storage.local.set({ lang: LANG === "tr" ? "en" : "tr" });
    host.reload();
  });
  $("wipe").addEventListener("click", async () => {
    if (!(await askConfirm(tx("wipeConfirm"), tx("btnDelete")))) return;
    await send({ type: "queueControl", op: "clear" });
    await chrome.storage.local.clear();
    host.reload();
  });

  // ---------- veri ----------
  const KEYS = ["state", "queue", "history", "whitelist", "scans", "onboarded"];
  function apply(values) {
    if ("state" in values) S.state = values.state || null;
    if ("queue" in values) S.queue = values.queue || null;
    if ("history" in values) S.history = values.history || [];
    if ("whitelist" in values) S.whitelist = values.whitelist || [];
    if ("scans" in values) S.scans = values.scans || [];
    if ("onboarded" in values) S.onboarded = !!values.onboarded;
  }

  apply(await chrome.storage.local.get(KEYS));
  render();
  chrome.storage.onChanged.addListener((changes) => {
    const v = {};
    for (const k of KEYS) if (k in changes) v[k] = changes[k].newValue;
    apply(v);
    render();
  });
  setInterval(renderQueue, 1000); // geri sayım
}

// ---- console-src/unfollow-api.js ----
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

// ---- console-src/entry.js ----
// Konsol sürümünün başlangıcı: platform arayüzü (host), mesaj yönlendirici ve panel penceresi.
async function consoleRouter(msg) {
  try {
    switch (msg?.type) {
      case "startCompare":
        await assertScanQuota();
        run();
        return { ok: true };
      case "enqueue":
        await enqueue(msg.usernames || []);
        return { ok: true };
      case "queueControl":
        await queueControl(msg.op);
        return { ok: true };
      case "follow":
        return { ok: false, error: tx("errNoRefollow") };
    }
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

let queueTimer;
const host = {
  unfollow: apiUnfollow,
  follow: async () => ({ ok: false, error: tx("errNoRefollow") }),
  schedule: (when) => {
    clearTimeout(queueTimer);
    queueTimer = setTimeout(() => pump(), Math.max(0, when - Date.now()));
  },
};

let frame, closeBtn;
async function openPanel() {
  if (frame) {
    frame.style.display = closeBtn.style.display = "";
    return;
  }
  frame = document.createElement("iframe");
  Object.assign(frame.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", border: "0", zIndex: "2147483646", background: "transparent", colorScheme: "normal" });
  document.body.appendChild(frame);
  await new Promise((r) => setTimeout(r, 50));
  const doc = frame.contentDocument;
  try {
    const sheet = new frame.contentWindow.CSSStyleSheet();
    sheet.replaceSync(APP_CSS);
    doc.adoptedStyleSheets = [sheet];
  } catch {
    const st = doc.createElement("style");
    st.textContent = APP_CSS;
    doc.head.append(st);
  }
  closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.title = tx("closePanel");
  Object.assign(closeBtn.style, { position: "fixed", top: "14px", right: "18px", zIndex: "2147483647", width: "34px", height: "34px", borderRadius: "17px", border: "1px solid #8884", background: "#fff", color: "#111", cursor: "pointer", font: "16px system-ui" });
  closeBtn.addEventListener("click", () => (frame.style.display = closeBtn.style.display = "none"));
  document.body.appendChild(closeBtn);

  await mountApp(doc, {
    chrome,
    mode: "console",
    logoSrc: LOGO,
    reload: () => {
      frame.remove();
      closeBtn.remove();
      frame = closeBtn = null;
      openPanel();
    },
    open: (url) => window.open(url, "_blank", "noreferrer"),
  });
}

const BUILD = "1.0.0-1792499257008"; // build betiği doldurur

function destroyPanel() {
  clearTimeout(queueTimer);
  frame?.remove();
  closeBtn?.remove();
  frame = closeBtn = null;
}

(async () => {
  const prev = window.__unfollowRadar;
  if (prev && prev.build === BUILD) return prev.open(); // aynı sürüm zaten yüklü: sadece aç
  // Farklı (eski) sürüm yüklüyse kaldır, yerine bunu kur. Çok eski sürümlerin kalıntılarını da temizle.
  prev?.destroy?.();
  for (const el of document.querySelectorAll("iframe, button")) {
    if (el.style.zIndex === "2147483646" || (el.style.zIndex === "2147483647" && el.textContent === "✕")) el.remove();
  }
  window.__unfollowRadar = { build: BUILD, open: openPanel, destroy: destroyPanel };
  await initLang(chrome.storage.local, chrome.storage.onChanged);
  if (!/(^|\.)instagram\.com$/.test(location.hostname)) {
    delete window.__unfollowRadar;
    return alert(tx("errWrongSite"));
  }
  await resetStaleState();
  // Çıkarma kuyruğu çalışırken sayfadan ayrılmaya karşı uyar.
  let active = false;
  const refresh = (q) => (active = !!q && q.items.length > 0 && !q.paused);
  refresh((await chrome.storage.local.get("queue")).queue);
  chrome.storage.onChanged.addListener((c) => c.queue && refresh(c.queue.newValue));
  window.addEventListener("beforeunload", (e) => active && (e.preventDefault(), (e.returnValue = "")));
  await openPanel();
  pump(); // yarım kalan kuyruk varsa sürdür
})();

})();
