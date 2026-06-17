# Özdilekteyim — AI Trafik Analizi Raporu

Özdilekteyim'in yapay zeka kaynaklı (ChatGPT referral) web trafiğini landing page, sayfa tipi,
marka/ürün ve zaman ekseninde analiz eden interaktif, paylaşılabilir rapor.

Referans tasarım: `ozdilek-sezonsallik` (React + Babel CDN, build pipeline, Inbound brand kit).

## Sekmeler

1. **Özet** — KPI scorecard'lar + çoklu metrik (oturum/ciro/transaction/AOV/CR) toggle'lı aylık trafik eğrisi.
2. **Aylık Trend** — MoM değişim, Şubat 2026 (llms.txt) işaret çizgisi, yükselen/gerileyen sayfalar.
3. **Landing Page** — top LP (oturum/ciro/transaction), ay filtresiyle dinamik, llms.txt rozeti.
4. **Sayfa Tipi** — Ürün / Kategori / Market / Marka / Sepet-Checkout / Hesap / Anasayfa dağılımı.
5. **Marka & Ürün** — marka kırılımı (3 perspektif).
6. **Dönüşmeyen** — AI oturumu yüksek, transaction'a dönmeyen sayfalar (fırsat alanı).
7. **llms.txt Etkisi** — llms.txt sayfaları vs diğer, Şubat öncesi/sonrası karşılaştırma.

Her tablo/chart **PNG** olarak kaydedilebilir; tablolar **CSV** olarak indirilebilir.
Üstteki **ay filtresi** anlık (snapshot) bölümleri dinamik günceller.

## Çalıştırma

```bash
npm install
npm run build     # data/source.xlsx → data/ai-data.js
npm start         # http://localhost:3000
```

## Veri güncelleme

Yeni/tam veri seti geldiğinde `data/source.xlsx` dosyasını değiştirip `npm run build`
çalıştırmak yeterlidir. Şema: `year_month, landing_page, SOURCE, medium, sessions,
Sesion Share, Transactions, CR, AOV, Revenue, Revenue Share` (tek sheet).

llms.txt sayfa listesi `scripts/llms-pages.js` içindedir; llms.txt güncellenirse bu liste yenilenir.

## Notlar

- Veri kaynağı %100 `chatgpt.com` referral. Tutarlar ₺ cinsindendir.
- İlk yükleme örneklem (1000 satır) ile yapılmıştır; tam veri geldiğinde kapsam genişler.
- Kısmi aylar (rapor üretim tarihine kadar) ay filtresinde `*` ile işaretlenir.

## Deploy

Vercel (statik) veya Railway (Node). `data/ai-data.js` commit'lendiği için statik servis yeterlidir.
