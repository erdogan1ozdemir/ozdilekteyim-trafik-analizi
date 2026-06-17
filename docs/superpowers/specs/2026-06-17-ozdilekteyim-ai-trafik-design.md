# Özdilekteyim AI Trafik Analizi Raporu — Tasarım Spec

**Tarih:** 2026-06-17
**Repo:** github.com/erdogan1ozdemir/ozdilekteyim-trafik-analizi
**Referans tasarım:** github.com/erdogan1ozdemir/ozdilek-sezonsallik (Vitra Dashboard design dilinden esinli)

## Amaç

Özdilekteyim'in AI kaynaklı (ChatGPT referral) web trafiğini landing page, sayfa tipi,
marka/ürün ve zaman ekseninde analiz eden, müşteriyle paylaşılabilir interaktif bir rapor.
Çıktı, sezonsallık repo'su ile aynı mimaride (React + Babel CDN, build pipeline) çok dosyalı
bir uygulamadır ve hedef repo'ya push edilir. Yeni/tam veri seti geldiğinde `source.xlsx`
değiştirilip rebuild alınır.

## Veri kaynağı

`Özdilekteyim x Inbound _ Reporting Framework Channel Performance With AEM__Table.xlsx`
- Tek sheet, kolonlar: `year_month, landing_page, SOURCE, medium, sessions, Sesion Share,
  Transactions, CR, AOV, Revenue, Revenue Share`
- Kaynak %100 `chatgpt.com` → "AI trafiği" = **ChatGPT referral trafiği** olarak çerçevelenir.
- 8 ay: Kas 2025, Ara 2025, Oca 2026, Şub 2026, Mar 2026, Nis 2026, May 2026, Haz 2026
- Para birimi: **₺ (TL)**
- ÖNEMLİ: Eldeki dosya 1000 satırlık **sample**. Yapı sample ile kurulur; gerçek/tam veri
  gelince rebuild edilir. Sample süresince raporda "örneklem üzerinden" notu görünür
  (gerçek veri gelince kaldırılır / kapsamı genişler).

## İkincil kaynak: llms.txt

`ozdilekteyim-llms-new-format.docx` → "Önemli Sayfalar" altındaki ~80+ URL. Şubat 2026'da
eklendi. Path'leri çıkarılıp bir set'e alınır; her landing page `inLlms: true/false` ile
işaretlenir. Şubat 2026 öncesi/sonrası etki ölçümü yapılır.

## Mimari

```
index.html            # React 18 + Babel standalone CDN; Chart.js + html2canvas + Google Fonts CDN
brand.config.js       # name: Özdilekteyim, accent #F15B2A, agency: Inbound
styles.css            # sezonsallık tasarım sistemi (reuse, ufak ek)
utils.js              # sezonsallık util'leri + fmtTRY (₺) + downloadPNG (html2canvas)
data/source.xlsx      # AI trafik Excel'i
data/ai-data.js       # build çıktısı → window.AI_DATA (git'e commit'lenir)
components.jsx         # Scorecard, Tablo, MultiSelect, ChartCard (Chart.js), PngButton, LlmsBadge, TermSpan
tabs.jsx              # 7 sekme (aşağıda)
app.jsx               # shell + ToC + ay filtresi (global state) + tema toggle
scripts/build-ai-data.js  # Excel → ai-data.js
scripts/llms-pages.js     # docx'ten çıkarılmış llms.txt path listesi (sabit veri)
server.js, vercel.json, railway.json, package.json
```

Veri akışı: `npm run build` → `build-ai-data.js` Excel'i okur, türetilmiş agregaları üretir,
`data/ai-data.js` yazar → `npm start` ile React app render eder.

## Global state ve kontroller

- **Ay filtresi** (multi-select, Kas2025–Haz2026): seçili aylar global state'te tutulur;
  tüm dinamik bölümler (LP, sayfa tipi, marka, dönüşmeyen, trend) bu sete göre yeniden hesaplar.
  Hesaplama client-side; build çıktısı ham aylık kırılımı içerir.
- **ToC**: sticky navigasyon, başlıklara smooth scroll + flash highlight.
- **Tema**: light/dark (mevcut sistem).
- **Export**: her tablo/chart kartında **PNG kaydet** (html2canvas) + ilgili yerlerde **CSV**.

## Sekmeler

1. **Özet** — KPI scorecard'lar (toplam AI session, revenue ₺, transaction, AOV, CR).
   Manşet chart: aylık AI trafik eğrisi, çoklu metrik (session/revenue/transaction/AOV);
   metrikler legend'dan tıkla-aç/kapa. Otomatik nötr insight metni.
2. **Aylık Trend** — MoM değişim, büyüme eğrisi; Şubat 2026 (llms.txt) dikey işaret çizgisi.
3. **Landing Page Analizi** — Top LP: session/revenue/transaction toggle; ay filtresiyle
   dinamik; llms.txt rozeti; PNG + CSV.
4. **Sayfa Tipi Analizi** — LP'ler tiplere ayrılır (Ürün, Kategori, Marka, Market,
   Sepet/Checkout, Hesap, Anasayfa, Diğer); tip bazında session/revenue/transaction dağılımı
   (stacked bar + donut + tablo); ay filtresiyle dinamik.
5. **Marka & Ürün Grupları** — marka çıkarımı (`/magaza/marka/<x>` + ürün slug token sözlüğü);
   top markalar/ürün tipleri 3 perspektiften (trafik/ciro/transaction).
6. **Dönüşmeyen Sayfalar** — AI session yüksek, transaction/revenue düşük sayfalar; skorlu
   "değerlendirilebilir fırsat alanı" tablosu.
7. **llms.txt Etki Analizi** — llms.txt sayfaları veriyle eşlenir; Şubat 2026 öncesi/sonrası
   AI session karşılaştırması (llms vs diğer); ayrı chart + tablo; rozet açıklaması.

> Sezonsallık arama hacmi şimdilik EKLENMEZ (kullanıcı kararı). Trend ve llms.txt
> bölümlerine sonradan hacim eklemek için veri hook'u bırakılır.

## Türetilen veri (build-ai-data.js)

- **Page-type sınıflama** (path desenli):
  - `cart|checkout|my-account|sepet|odeme` → Sepet/Checkout veya Hesap (funnel)
  - `/magaza/marka/<x>` → Marka
  - `/market...` → Market
  - `(home)` / `/` → Anasayfa
  - çok-tireli uzun slug (>= ~4 token veya `-p-<id>` / `-cp2` deseni) → Ürün
  - kısa slug → Kategori
  - sınırda → Diğer
- **Marka çıkarımı**: `marka/` path segmenti + ürün slug'larında marka token sözlüğü
  (philips, dyson, stanley, fissler, adidas, mavi, guess, benetton, lufian, skechers vb.).
- **llms.txt eşleme**: `scripts/llms-pages.js` set'i; `inLlms` flag'i.
- **Agregalar**: aylık × {metrik}, LP × ay × metrik, page-type × ay × metrik,
  brand × ay × metrik, llms-grup (llms vs diğer) × ay; pre/post Şubat 2026 split.

## Yazım kuralları

Tüm metinler kullanıcının "Dil ve Stil Kuralları" promptuna uyar: kesin vaat yok, olumsuz
kelime yok, emir kipi yok, pasif/3. tekil şahıs, İngilizce terim korunur + `.term` span,
Türkçe karakter zorunlu, em-dash yok, rozet eşlemesi (Öncelikli/Yüksek/Orta/Takip edilebilir).

## v1 kapsam dışı (YAGNI)

- Canlı arama hacmi entegrasyonu (sonra, chart'lara göre karar)
- Çoklu AI kaynağı (Perplexity/Gemini) — veri tek kaynak (ChatGPT) olduğu için tek kaynak çerçevesi
- Kullanıcı bazlı login/auth, canlı DB — statik build yeterli

## Başarı kriteri

`npm install && npm run build && npm start` ile 7 sekme açılır, console hatasız, ay filtresi
tüm dinamik bölümleri günceller, PNG/CSV export çalışır, llms.txt rozetleri görünür,
dil kuralları ihlali yok. Repo'ya push edilir.
