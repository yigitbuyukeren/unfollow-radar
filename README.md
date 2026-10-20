<div align="center">

<img src="icons/icon128.png" width="96" alt="Unfollow Radar logo">

# Unfollow Radar

**EN** · Find who doesn't follow you back on Instagram — and unfollow them slowly and safely.
**TR** · Instagram'da seni geri takip etmeyenleri bul ve yavaş, güvenli şekilde yönet.

[English](#english) · [Türkçe](#türkçe)

</div>

---

## English

Unfollow Radar scans **your own** Instagram account and shows who you follow that doesn't follow you back, who follows you that you don't follow back, and your mutuals. It ships in two forms that share the same code:

| | Browser extension | Console edition |
|---|---|---|
| Install | Load unpacked (Chrome, Dia, Edge, Brave…) | Nothing — paste one file |
| Runs in background | Yes | No, the tab must stay open |
| Unfollow method | Drives Instagram's own UI in a background tab | Instagram's web request (GraphQL) |
| Follow back (undo) | Yes | No (opens the profile) |

### Features
- Scans your account automatically (whoever is signed in) — max **3 scans/day**
- Lists: not following back · I don't follow back · mutual, with profile pictures, search, verified/private badges
- **Slow bulk unfollow** queue with pause / resume / cancel — max **30 people/day**
- **Protected list** (allow-list): export / import JSON, bulk add by pasting names or links
- **Undo**: follow back someone you removed (extension)
- Turkish and English UI (switch with the button in the corner)
- 100% local: no server, no account, no analytics

### How it protects your account
Waits and retry rules follow the defaults of [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) (MIT):

- Unfollow: **4–4.8 s** between people, plus a **5 min** break after every 5
- Scan: 300–999 ms + 1–1.3 s between pages, a 10 s ± 5 s pause every 15 requests, max 250 pages per list
- Retries: up to 3; 429 / `feedback_required` wait 30 × attempt seconds, network errors 5 × attempt seconds

On top of that, this project:
- stops the queue immediately when Instagram shows an **action block** / `feedback_required`, or after **2 failed actions in a row**
- **locks unfollowing** when the scan looks incomplete (counts don't match what Instagram reports), so the wrong people are never removed
- **resumes** an interrupted scan where it left off (cached for 6 hours)
- counts a daily scan only when it **succeeds**

All numbers live in one place: [`shared.js`](shared.js).

### Install — browser extension
1. Download the latest zip from the **Releases** page (or run `npm run build` and use `dist/`), unzip it.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, pick the folder.
3. Sign in at instagram.com, click the extension icon, press **Scan my account**.

### Install — console edition
1. Open <https://www.instagram.com> while signed in.
2. Open DevTools (**F12**) → **Console**. (Chrome asks you to type `allow pasting` once.)
3. Open [`console/unfollow-radar.console.js`](console/unfollow-radar.console.js), copy **the whole file**, paste into the console, press Enter.

> ⚠️ Only paste code you have read and trust. Meta warns about this for good reason. The file is plain, readable JavaScript.

### Development
```bash
npm run dev      # watches files and live-reloads the extension
npm run build    # extension zip + console bundle
```
Layout: `shared.js` (limits) · `i18n.js` (strings) · `scan-core.js` · `queue-core.js` · `panel.js` + `app.js` (UI, shared) · `content.js` / `background.js` (extension) · `console-src/` (console edition).

### Privacy
Nothing leaves your browser. See [PRIVACY.md](PRIVACY.md).

### ⚠️ Disclaimer
Not affiliated with, authorized or endorsed by Instagram or Meta. Automating Instagram may violate its Terms of Use and can get an account restricted. The tool relies on unofficial web endpoints that may change at any time. **Use at your own risk.**

---

## Türkçe

Unfollow Radar **kendi** Instagram hesabını tarar; seni geri takip etmeyenleri, senin geri takip etmediklerini ve karşılıklı takipleştiklerini gösterir. Aynı kodu paylaşan iki sürümü var:

| | Tarayıcı uzantısı | Konsol sürümü |
|---|---|---|
| Kurulum | "Paketlenmemiş öğe yükle" (Chrome, Dia, Edge, Brave…) | Kurulum yok — tek dosyayı yapıştır |
| Arka planda çalışır | Evet | Hayır, sekme açık kalmalı |
| Takipten çıkarma | Instagram arayüzünü arka plan sekmesinde sürer | Instagram'ın web isteği (GraphQL) |
| Geri takip (geri alma) | Var | Yok (profili açar) |

### Özellikler
- Giriş yapılan hesabı otomatik tarar — günde en fazla **3 tarama**
- Listeler: geri takip etmeyenler · takip etmediklerim · karşılıklı; profil resmi, arama, doğrulanmış/gizli işareti
- **Yavaş toplu takipten çıkarma** kuyruğu (durdur / devam / iptal) — günde en fazla **30 kişi**
- **Korunanlar listesi:** JSON dışa/içe aktarma, isim ya da bağlantı yapıştırarak toplu ekleme
- **Geri alma:** çıkardığın birini tekrar takip et (uzantı)
- Türkçe ve İngilizce arayüz (köşedeki düğmeyle değişir)
- %100 yerel: sunucu yok, hesap yok, analitik yok

### Hesabını nasıl korur
Bekleme ve yeniden deneme kuralları [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) (MIT) varsayılanlarını izler:

- Takipten çıkarma: kişiler arası **4–4,8 sn**, her 5 kişide ek **5 dk** mola
- Tarama: sayfa arası 300–999 ms + 1–1,3 sn, her 15 istekte 10 sn ± 5 sn uzun uyku, liste başına en fazla 250 sayfa
- Yeniden deneme: en fazla 3; 429 / `feedback_required` için 30 × deneme sn, ağ hatası için 5 × deneme sn

Bunlara ek olarak bu proje:
- Instagram **işlem engeli** / `feedback_required` gösterirse ya da **üst üste 2 işlem** başarısız olursa kuyruğu hemen durdurur
- Tarama eksik görünürse (sayılar Instagram'ın bildirdiğiyle uyuşmuyorsa) **çıkarmayı kilitler**; yanlış kişi asla çıkarılmaz
- Yarım kalan taramayı kaldığı yerden **sürdürür** (6 saat önbellek)
- Günlük tarama hakkını yalnızca **başarılı** taramada düşer

Tüm sayılar tek yerde: [`shared.js`](shared.js).

### Kurulum — tarayıcı uzantısı
1. **Releases** sayfasından son zip'i indir (ya da `npm run build` çalıştırıp `dist/` klasörünü kullan), aç.
2. `chrome://extensions` → **Geliştirici modu**nu aç → **Paketlenmemiş öğe yükle** → klasörü seç.
3. instagram.com'da giriş yap, uzantı simgesine tıkla, **Hesabımı tara**'ya bas.

### Kurulum — konsol sürümü
1. Giriş yapmış hâlde <https://www.instagram.com> adresini aç.
2. DevTools'u aç (**F12**) → **Console**. (Chrome bir kez `allow pasting` yazmanı ister.)
3. [`console/unfollow-radar.console.js`](console/unfollow-radar.console.js) dosyasının **tamamını** kopyalayıp konsola yapıştır, Enter'a bas.

> ⚠️ Yalnızca okuyup güvendiğin kodu yapıştır. Meta bu konuda uyarır, haklı olarak. Dosya düz, okunabilir JavaScript'tir.

### Geliştirme
```bash
npm run dev      # dosyaları izler, uzantıyı canlı yeniler
npm run build    # uzantı zip'i + konsol paketi
```

### Gizlilik
Hiçbir şey tarayıcından çıkmaz. Bkz. [PRIVACY.md](PRIVACY.md).

### ⚠️ Sorumluluk reddi
Instagram veya Meta ile bağlantılı, onaylı ya da desteklenen bir proje değildir. Instagram'ı otomatikleştirmek kullanım şartlarına aykırı olabilir ve hesabın kısıtlanmasına yol açabilir. Araç, her an değişebilen resmi olmayan web uç noktalarına dayanır. **Kullanım sorumluluğu sana aittir.**

---

## Credits / Teşekkürler
Timing and safety defaults and the unfollow technique of the console edition are inspired by [davidarroyo1234/InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) (MIT). / Bekleme ve güvenlik varsayılanları ile konsol sürümünün çıkarma tekniği bu projeden esinlenmiştir.

## License
[MIT](LICENSE)
