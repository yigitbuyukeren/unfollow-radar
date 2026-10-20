# Takip Analizi

Kendi Instagram hesabındaki takipçi ve takip ettiklerini karşılaştıran Chromium (Chrome, Dia, Edge…) uzantısı.

- Giriş yapılan hesap otomatik taranır (günde en fazla 3 tarama)
- Geri takip etmeyenler / takip etmediklerim / karşılıklı
- Beyaz liste, geri takip (geri alma)
- Yavaş toplu takipten çıkarma: 45–120 sn arayla, günde en fazla 30
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
