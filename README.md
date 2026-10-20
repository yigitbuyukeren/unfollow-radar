# Takip Analizi

Kendi Instagram hesabındaki takipçi ve takip ettiklerini karşılaştıran Chromium (Chrome, Dia, Edge…) uzantısı.

- Giriş yapılan hesap otomatik taranır (günde en fazla 3 tarama)
- Geri takip etmeyenler / takip etmediklerim / karşılıklı
- Beyaz liste (dışa/içe aktarma, toplu ekleme) ve geri takip (geri alma)
- Yavaş toplu takipten çıkarma: 4–4,8 sn arayla, her 5 kişide 5 dk mola, günde en fazla 30
- Korumalar: Instagram "işlem engellendi" / `feedback_required` derse ya da üst üste 2 işlem başarısız olursa kuyruk durur; tarama eksik görünürse çıkarma kilitlenir
- Yarım kalan tarama (6 saat içinde) kaldığı sayfadan devam eder
- Tüm veriler yalnızca tarayıcıda; sunucu yok

Limitler `shared.js` içindeki `LIMITS` nesnesinde.

## Geliştirme

```bash
npm run dev      # dosya değişince uzantıyı otomatik yeniler
```

`chrome://extensions` → Geliştirici modu → "Paketlenmemiş öğe yükle" → bu klasör.

## Yayın

```bash
npm run build    # dev kodunu çıkarır, takip-analizi-<sürüm>.zip üretir
```

Zip'i Chrome Web Store Developer Dashboard'a yükle. Metinler: `store/listing.md`, gizlilik politikası: `PRIVACY.md`.
Yayın öncesi: `manifest.json` sürümünü artır, `scripts/make-icons.py` ile ikonları yenile (gerekirse), PRIVACY.md'yi herkese açık bir adreste yayınla.

## Notlar

Instagram'ın resmi olmayan web uç noktaları ve arayüzü kullanılır; Instagram bunları değiştirirse uzantının güncellenmesi gerekir. Takipten çıkarma/takip etme, Instagram arayüzü arka plan sekmesinde sürülerek yapılır.

## Bekleme kuralları

Süreler ve yeniden deneme kuralları [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) (MIT) varsayılanlarıdır; `shared.js` içindeki `LIMITS` ve `SCAN` nesnelerinde:

- Takipten çıkarma: kişiler arası 4000–4800 ms, her 5. kişide ek 300000 ms (5 dk)
- Tarama: sayfa başına 300–999 ms + 1000–1300 ms, her 15 istekte 10 sn ± 5 sn uzun uyku, liste başına en fazla 250 sayfa
- Yeniden deneme: en fazla 3; 429 / `feedback_required` için 30 × deneme sn, ağ hatası için 5 × deneme sn

Bunlara ek olarak günlük 3 tarama / 30 çıkarma sınırı, engel tespitinde kuyruğu durdurma ve eksik taramada çıkarmayı kilitleme bu projeye özgüdür.
