<div align="center">

<img src="icons/icon128.png" width="80" alt="Unfollow Radar">

# Unfollow Radar

Instagram'da seni geri takip etmeyenleri bul.<br>
Find who doesn't follow you back on Instagram.

**Kurulum yok · No install · Tek dosya · One file**

[Türkçe](#türkçe) · [English](#english)

</div>

---

## Türkçe

### Nasıl kullanılır
1. [instagram.com](https://www.instagram.com)'u aç ve giriş yap.
2. **F12** → **Console** sekmesi. (Chrome bir kez `allow pasting` yazmanı isteyebilir.)
3. [`unfollow-radar.js`](unfollow-radar.js) dosyasını aç → **Raw** → hepsini kopyala → konsola yapıştır → **Enter**.
4. Açılan panelde **Hesabımı tara**'ya bas.

### Ne yapar
- Seni geri takip etmeyenleri, senin takip etmediklerini ve karşılıklı olanları listeler.
- Seçtiklerini **yavaş yavaş** takipten çıkarır. Günde en fazla 30 kişi, günde en fazla 3 tarama.
- **Koru** dediğin hesaplar listede çıkmaz, toplu çıkarmaya girmez.
- Instagram engel koyarsa kendiliğinden durur.
- Her şey tarayıcında kalır; hiçbir yere veri gönderilmez.

### Dikkat
Instagram ile bağlantılı değildir. Otomasyon Instagram'ın şartlarına aykırı olabilir ve hesabın kısıtlanmasına yol açabilir. **Sorumluluk sana aittir.** Yalnızca okuyup güvendiğin kodu yapıştır; kaynaklar [`src/`](src) içinde.

---

## English

### How to use
1. Open [instagram.com](https://www.instagram.com) and sign in.
2. Press **F12** → **Console**. (Chrome may ask you to type `allow pasting` once.)
3. Open [`unfollow-radar.js`](unfollow-radar.js) → **Raw** → copy everything → paste into the console → **Enter**.
4. In the panel that opens, press **Scan my account**.

### What it does
- Lists who doesn't follow you back, who you don't follow back, and your mutuals.
- Unfollows the people you select **slowly**. Max 30 people and 3 scans per day.
- Accounts you mark **Protect** are hidden from the list and skipped by bulk unfollow.
- Stops by itself if Instagram blocks the action.
- Everything stays in your browser; nothing is sent anywhere.

### Warning
Not affiliated with Instagram. Automation may violate Instagram's terms and can get your account restricted. **Use at your own risk.** Only paste code you have read and trust; the sources are in [`src/`](src).

---

<sub>Waits and safety limits (in [`src/shared.js`](src/shared.js)) follow [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) (MIT). Build: `npm run build`. License: [MIT](LICENSE).</sub>
