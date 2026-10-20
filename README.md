<div align="center">

<img src="icons/icon128.png" width="96" alt="Unfollow Radar logo">

# Unfollow Radar

**EN** · Find who doesn't follow you back on Instagram — paste one file into the browser console, no install.
**TR** · Instagram'da seni geri takip etmeyenleri bul — tek dosyayı tarayıcı konsoluna yapıştır, kurulum yok.

[English](#english) · [Türkçe](#türkçe)

</div>

---

## English

Unfollow Radar scans **your own** Instagram account and shows who you follow that doesn't follow you back, who follows you that you don't follow back, and your mutuals. It's a single JavaScript file you paste into the console while on instagram.com. Nothing to install.

### How to use
1. Open <https://www.instagram.com> and sign in.
2. Open DevTools (**F12**, or `Cmd+Option+J` on Mac) → **Console**. Chrome asks you to type `allow pasting` once.
3. Open [`unfollow-radar.js`](unfollow-radar.js) (click **Raw** → select all → copy), paste it into the console and press **Enter**.
4. The panel opens over the page. Press **Scan my account**.

To use it again, paste the file again (or reload the page first if you pasted an older version).

> ⚠️ Only paste code you have read and trust. Meta warns about this for good reason. The file is plain, readable JavaScript — the readable sources are in [`src/`](src).

### Features
- Scans whichever account is signed in — max **3 scans/day**
- Lists: not following back · I don't follow back · mutual, with profile pictures, search and verified/private badges
- **Slow bulk unfollow** queue with pause / resume / cancel — max **30 people/day**
- **Protected list** (allow-list): export / import JSON, bulk add by pasting names or links
- Turkish and English UI (button in the corner)
- 100% local: no server, no account, no analytics

### How it protects your account
Waits and retry rules follow the defaults of [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) (MIT):

- Unfollow: **4–4.8 s** between people, plus a **5 min** break after every 5
- Scan: 300–999 ms + 1–1.3 s between pages, a 10 s ± 5 s pause every 15 requests, max 250 pages per list
- Retries: up to 3; 429 / `feedback_required` wait 30 × attempt seconds, network errors 5 × attempt seconds

On top of that:
- the queue **stops immediately** when Instagram reports an action block / `feedback_required`, or after **2 failed actions in a row**
- unfollowing is **locked** when the scan looks incomplete (counts don't match what Instagram reports), so the wrong people are never removed
- an interrupted scan **resumes** where it left off (cached for 6 hours)
- a daily scan is counted only when it **succeeds**
- the page warns before you leave while a queue is running

All numbers live in one place: [`src/shared.js`](src/shared.js).

### Privacy
Everything runs in your browser. Results, the protected list and history are stored in the page's `localStorage` (keys start with `unfollowRadar:`). Nothing is sent anywhere. "Delete all my data" in the panel removes it all.

### Development
```bash
npm run build    # bundles src/*.js into unfollow-radar.js
```
Layout: `shared.js` (limits) · `i18n.js` (TR/EN strings) · `shim.js` (storage) · `scan-core.js` · `queue-core.js` · `panel.js` + `app.js` (UI) · `unfollow-api.js` (unfollow request) · `entry.js` (startup).

### ⚠️ Disclaimer
Not affiliated with, authorized or endorsed by Instagram or Meta. Automating Instagram may violate its Terms of Use and can get an account restricted. The tool relies on unofficial web endpoints that may change at any time. **Use at your own risk.**

---

## Türkçe

Unfollow Radar **kendi** Instagram hesabını tarar; seni geri takip etmeyenleri, senin geri takip etmediklerini ve karşılıklı takipleştiklerini gösterir. instagram.com'dayken konsola yapıştırdığın tek bir JavaScript dosyasıdır. Kurulum yok.

### Nasıl kullanılır
1. <https://www.instagram.com> adresini aç ve giriş yap.
2. DevTools'u aç (**F12**, Mac'te `Cmd+Option+J`) → **Console**. Chrome bir kez `allow pasting` yazmanı ister.
3. [`unfollow-radar.js`](unfollow-radar.js) dosyasını aç (**Raw** → hepsini seç → kopyala), konsola yapıştır, **Enter**'a bas.
4. Panel sayfanın üstünde açılır. **Hesabımı tara**'ya bas.

Tekrar kullanmak için dosyayı yine yapıştır (eski sürümü yapıştırdıysan önce sayfayı yenile).

> ⚠️ Yalnızca okuyup güvendiğin kodu yapıştır. Meta bu konuda uyarır, haklı olarak. Dosya düz, okunabilir JavaScript'tir; okunabilir kaynaklar [`src/`](src) klasöründe.

### Özellikler
- Giriş yapılan hesabı tarar — günde en fazla **3 tarama**
- Listeler: geri takip etmeyenler · takip etmediklerim · karşılıklı; profil resmi, arama, doğrulanmış/gizli işareti
- **Yavaş toplu takipten çıkarma** kuyruğu (durdur / devam / iptal) — günde en fazla **30 kişi**
- **Korunanlar listesi:** JSON dışa/içe aktarma, isim ya da bağlantı yapıştırarak toplu ekleme
- Türkçe ve İngilizce arayüz (köşedeki düğme)
- %100 yerel: sunucu yok, hesap yok, analitik yok

### Hesabını nasıl korur
Bekleme ve yeniden deneme kuralları [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) (MIT) varsayılanlarını izler:

- Takipten çıkarma: kişiler arası **4–4,8 sn**, her 5 kişide ek **5 dk** mola
- Tarama: sayfa arası 300–999 ms + 1–1,3 sn, her 15 istekte 10 sn ± 5 sn uzun uyku, liste başına en fazla 250 sayfa
- Yeniden deneme: en fazla 3; 429 / `feedback_required` için 30 × deneme sn, ağ hatası için 5 × deneme sn

Bunlara ek olarak:
- Instagram işlem engeli / `feedback_required` bildirirse ya da **üst üste 2 işlem** başarısız olursa kuyruk **hemen durur**
- Tarama eksik görünürse (sayılar Instagram'ın bildirdiğiyle uyuşmuyorsa) çıkarma **kilitlenir**; yanlış kişi asla çıkarılmaz
- Yarım kalan tarama kaldığı yerden **sürer** (6 saat önbellek)
- Günlük tarama hakkı yalnızca **başarılı** taramada düşer
- Kuyruk çalışırken sayfadan ayrılırken uyarır

Tüm sayılar tek yerde: [`src/shared.js`](src/shared.js).

### Gizlilik
Her şey tarayıcında çalışır. Sonuçlar, korunanlar ve geçmiş sayfanın `localStorage` alanında saklanır (anahtarlar `unfollowRadar:` ile başlar). Hiçbir yere gönderilmez. Paneldeki "Tüm verilerimi sil" hepsini kaldırır.

### Geliştirme
```bash
npm run build    # src/*.js dosyalarını unfollow-radar.js içinde birleştirir
```

### ⚠️ Sorumluluk reddi
Instagram veya Meta ile bağlantılı, onaylı ya da desteklenen bir proje değildir. Instagram'ı otomatikleştirmek kullanım şartlarına aykırı olabilir ve hesabın kısıtlanmasına yol açabilir. Araç, her an değişebilen resmi olmayan web uç noktalarına dayanır. **Kullanım sorumluluğu sana aittir.**

---

## Credits / Teşekkürler
Timing and safety defaults and the unfollow technique are inspired by [davidarroyo1234/InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) (MIT). / Bekleme ve güvenlik varsayılanları ile çıkarma tekniği bu projeden esinlenmiştir.

## License
[MIT](LICENSE)
