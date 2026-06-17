#!/usr/bin/env node
/* build-ai-data.js — AI trafik Excel'ini okuyup data/ai-data.js (window.AI_DATA) üretir.
 *
 * Kaynak: data/source.xlsx  (tek sheet)
 * Kolonlar: year_month, landing_page, SOURCE, medium, sessions, Sesion Share,
 *           Transactions, CR, AOV, Revenue, Revenue Share
 *
 * Çıktı: data/ai-data.js  → window.AI_DATA = { meta, rows }
 * Tüm agregasyon (ay filtresi, LP/sayfa-tipi/marka kırılımı, pre/post Şubat) client-side
 * yapılır; bu script satır başına ptype/brand/inLlms türetir ve normalize eder.
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const LLMS_PATHS = require('./llms-pages.js');

const SRC = path.join(__dirname, '..', 'data', 'source.xlsx');
const OUT = path.join(__dirname, '..', 'data', 'ai-data.js');

// ——— Ay sıralaması (kronolojik) ———
const MONTH_ORDER = ['Nov 2025','Dec 2025','Jan 2026','Feb 2026','Mar 2026','Apr 2026','May 2026','Jul 2026','Jun 2026','Aug 2026','Sep 2026','Oct 2026'];
const MONTH_TR = {
  'Nov 2025':'Kas 2025','Dec 2025':'Ara 2025','Jan 2026':'Oca 2026','Feb 2026':'Şub 2026',
  'Mar 2026':'Mar 2026','Apr 2026':'Nis 2026','May 2026':'May 2026','Jun 2026':'Haz 2026',
  'Jul 2026':'Tem 2026','Aug 2026':'Ağu 2026','Sep 2026':'Eyl 2026','Oct 2026':'Eki 2026',
};
const LLMS_ADDED = 'Feb 2026';        // llms.txt eklendiği ay
const PARTIAL_MONTHS = ['Jun 2026'];   // kısmi/eksik aylar (rapor üretim tarihine göre)

// ——— Marka token sözlüğü (ürün/kategori slug'larından marka çıkarımı) ———
// slug içinde bu token geçerse marka atanır. Sıra önemli değil; en uzun eşleşme kazanır.
const BRAND_TOKENS = {
  'philips':'Philips','dyson':'Dyson','stanley':'Stanley','fissler':'Fissler','tefal':'Tefal',
  'adidas':'Adidas','mavi':'Mavi','guess':'Guess','benetton':'Benetton','lufian':'Lufian',
  'skechers':'Skechers','nike':'Nike','puma':'Puma','reebok':'Reebok','new_balance':'New Balance',
  'new-balance':'New Balance','under_armour':'Under Armour','under-armour':'Under Armour',
  'columbia':'Columbia','salomon':'Salomon','merrell':'Merrell','camper':'Camper','wrangler':'Wrangler',
  'lee':'Lee','calvin_klein':'Calvin Klein','calvin-klein':'Calvin Klein','pierre_cardin':'Pierre Cardin',
  'pierre-cardin':'Pierre Cardin','birkenstock':'Birkenstock','igor':'Igor','the_north_face':'The North Face',
  'the-north-face':'The North Face','northface':'The North Face','polaroid':'Polaroid','sjcam':'SJCAM',
  'acton':'Acton','molfix':'Molfix','tcl':'TCL','ktools':'KTools','ddpai':'DDPAI','getorix':'Getorix',
  'agiss':'Agiss','urban_care':'Urban Care','urban-care':'Urban Care','ugg':'UGG','finesuits':'Finesuits',
  'ozdilek':'Özdilek','cazador':'Cazador','vakko':'Vakko','kinetix':'Kinetix','lcw':'LCW','koton':'Koton',
};

function classifyPageType(lp) {
  if (!lp) return 'Diğer';
  const p = String(lp).replace(/\/+$/,'').toLowerCase();
  const segs = p.split('/').filter(Boolean);
  if (segs.length === 0) return 'Anasayfa';
  if (/\/(cart|checkout|sepet|odeme|payment)/.test(p)) return 'Sepet/Checkout';
  if (/\/(my-account|hesab|hesap|uyelik|favori|siparis|wishlist)/.test(p)) return 'Hesap';
  if (p.includes('/magaza/marka/')) return 'Marka';
  if (segs[0] === 'market') return 'Market';
  if (segs[0] === 'magaza' && segs.length >= 2) {
    const slug = segs[1];
    // ürün: -p-<id> deseni, 5+ haneli id, ya da çok-token uzun slug
    if (/-p-\d/.test(slug) || /\d{5,}/.test(slug)) return 'Ürün';
    const ntok = slug.split('-').length;
    if (/-cp2?$/.test(slug)) return 'Kategori';   // marka-kategori landing (ör. adidas-...-cp2)
    if (ntok >= 4) return 'Ürün';
    return 'Kategori';
  }
  if (segs[0] === 'magaza') return 'Kategori';
  return 'Diğer';
}

function extractBrand(lp) {
  if (!lp) return null;
  const p = String(lp).toLowerCase();
  // 1) marka/ path segmenti
  const m = p.match(/\/magaza\/marka\/([a-z0-9_-]+)/);
  if (m) {
    const key = m[1];
    if (BRAND_TOKENS[key]) return BRAND_TOKENS[key];
    return key.replace(/[_-]+/g,' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  // 2) slug token sözlüğü — en uzun eşleşen token
  let best = null, bestLen = 0;
  for (const tok of Object.keys(BRAND_TOKENS)) {
    const re = new RegExp('(^|[/-])' + tok.replace(/[-_]/g,'[-_]') + '([/-]|$)');
    if (re.test(p) && tok.length > bestLen) { best = BRAND_TOKENS[tok]; bestLen = tok.length; }
  }
  return best;
}

function num(v) {
  if (v == null || v === 'null' || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function main() {
  const wb = XLSX.readFile(SRC);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { defval: null });

  const llmsSet = new Set(LLMS_PATHS.map(s => s.toLowerCase().replace(/\/+$/,'')));
  const monthsSeen = new Set();
  const rows = [];

  for (const r of raw) {
    const ym = r['year_month'];
    const lp = r['landing_page'];
    if (!ym || !lp) continue;
    monthsSeen.add(ym);
    const lpNorm = String(lp).replace(/\/+$/,'').toLowerCase();
    const sessions = num(r['sessions']);
    const tx = num(r['Transactions']);
    const revenue = num(r['Revenue']);
    rows.push({
      ym,
      lp: String(lp),
      ptype: classifyPageType(lp),
      brand: extractBrand(lp),
      inLlms: llmsSet.has(lpNorm),
      sessions,
      tx,
      revenue,
      aov: tx > 0 ? revenue / tx : 0,
      cr: sessions > 0 ? tx / sessions : 0,
      source: r['SOURCE'] || null,
      medium: r['medium'] || null,
    });
  }

  // kronolojik ay listesi (sadece veride görünenler)
  const months = MONTH_ORDER.filter(m => monthsSeen.has(m));
  // güvenlik: sıralamada olmayan ay varsa sona ekle
  for (const m of monthsSeen) if (!months.includes(m)) months.push(m);

  const llmsInData = new Set(rows.filter(r => r.inLlms).map(r => r.lp)).size;

  const meta = {
    brand: 'Özdilekteyim',
    currency: 'TRY',
    aiSource: 'chatgpt.com',
    generatedAt: new Date().toISOString().slice(0,10),
    rowCount: rows.length,
    distinctLp: new Set(rows.map(r => r.lp)).size,
    months,
    monthTr: MONTH_TR,
    llmsAddedMonth: LLMS_ADDED,
    llmsPathCount: LLMS_PATHS.length,
    llmsInData,
    partialMonths: PARTIAL_MONTHS.filter(m => monthsSeen.has(m)),
    isSample: rows.length <= 1000,
  };

  const banner = `/* AUTO-GENERATED by scripts/build-ai-data.js — do not edit by hand.\n   Kaynak: data/source.xlsx | Üretim: ${meta.generatedAt} | ${rows.length} satır */\n`;
  const js = banner + 'window.AI_DATA = ' + JSON.stringify({ meta, rows }) + ';\n';
  fs.writeFileSync(OUT, js);

  console.log('✓ data/ai-data.js yazıldı');
  console.log('  satır:', rows.length, '| distinct LP:', meta.distinctLp);
  console.log('  aylar:', months.join(', '));
  console.log('  llms.txt path:', LLMS_PATHS.length, '| veride eşleşen llms sayfası:', llmsInData);
  console.log('  kısmi aylar:', meta.partialMonths.join(', ') || '(yok)');
  const ptypes = {};
  for (const r of rows) ptypes[r.ptype] = (ptypes[r.ptype]||0) + r.sessions;
  console.log('  sayfa tipi (session):', JSON.stringify(Object.fromEntries(Object.entries(ptypes).map(([k,v])=>[k,Math.round(v)]))));
}

main();
