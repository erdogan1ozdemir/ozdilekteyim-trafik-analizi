// ai-utils.js — AI trafik raporuna özel yardımcılar (window.AU)
window.AU = (function(){
  const D = window.AI_DATA || { meta:{months:[],monthTr:{}}, rows:[] };
  const META = D.meta;
  const ROWS = D.rows;
  const MONTHS = META.months || [];
  const MONTH_TR = META.monthTr || {};

  function trMonth(ym){ return MONTH_TR[ym] || ym; }

  // ——— ₺ formatlama ———
  function fmtTRY(n, opts={}) {
    if (n == null || isNaN(n)) return '–';
    n = Math.round(n);
    if (opts.compact) {
      if (Math.abs(n) >= 1e6) return '₺' + (n/1e6).toFixed(1).replace('.',',') + 'M';
      if (Math.abs(n) >= 1e3) return '₺' + (n/1e3).toFixed(1).replace('.',',') + 'B';
    }
    return '₺' + n.toLocaleString('tr-TR');
  }

  // ——— Filtre / agregasyon ———
  function inMonths(rows, monthSet) {
    if (!monthSet || monthSet.size === 0) return rows;
    return rows.filter(r => monthSet.has(r.ym));
  }
  function blank(){ return { sessions:0, tx:0, revenue:0, n:0 }; }
  function add(acc, r){ acc.sessions += r.sessions; acc.tx += r.tx; acc.revenue += r.revenue; acc.n += 1; return acc; }
  function withDerived(a){
    a.aov = a.tx > 0 ? a.revenue / a.tx : 0;
    a.cr  = a.sessions > 0 ? a.tx / a.sessions : 0;
    return a;
  }

  // Tek metrik toplamı
  function totals(rows){ return withDerived(rows.reduce((a,r)=>add(a,r), blank())); }

  // Anahtar fonksiyona göre grupla → [{key, sessions, tx, revenue, n, aov, cr, inLlms?}]
  function groupBy(rows, keyFn) {
    const m = new Map();
    for (const r of rows) {
      const k = keyFn(r);
      if (k == null) continue;
      if (!m.has(k)) m.set(k, Object.assign(blank(), { key:k, _rows:[] }));
      const g = m.get(k); add(g, r); g._rows.push(r);
    }
    const out = [];
    for (const g of m.values()) { withDerived(g); out.push(g); }
    return out;
  }

  // Aya göre seri: months[] sırasıyla, metric alanı
  function monthlySeries(rows, metric) {
    const byM = new Map(MONTHS.map(m => [m, blank()]));
    for (const r of rows) { if (byM.has(r.ym)) add(byM.get(r.ym), r); }
    return MONTHS.map(m => { const a = withDerived(byM.get(m)); return a[metric] || 0; });
  }

  // LP başlığını okunur kısa etikete çevir
  function lpLabel(lp){
    if (!lp || lp === '/') return '/ (anasayfa)';
    let s = lp.replace(/^\/+/, '');
    if (!s) return '/ (anasayfa)';
    if (s.length > 52) s = s.slice(0, 49) + '…';
    return s;
  }
  function lpUrl(lp){ return 'https://www.ozdilekteyim.com' + lp; }

  // ——— PNG export (html2canvas) ———
  async function downloadPNG(node, filename) {
    if (!node || !window.html2canvas) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = getComputedStyle(document.body).getPropertyValue('--bg-card') || (isDark ? '#141C1A' : '#fff');
    const canvas = await window.html2canvas(node, { backgroundColor: bg.trim() || '#fff', scale: 2, useCORS: true, logging: false });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = (filename || 'ozdilekteyim-ai') + '.png';
    a.click();
  }

  // delta sınıfı + format
  function deltaPct(cur, prev){
    if (prev == null || prev === 0) return null;
    return (cur - prev) / prev;
  }
  function deltaClass(d){ return d == null ? 'delta-neu' : d > 0.001 ? 'delta-pos' : d < -0.001 ? 'delta-neg' : 'delta-neu'; }

  // Metric meta (etiket, renk, formatlayıcı)
  const METRICS = {
    sessions:    { label:'Oturum (session)', short:'Oturum',    color:'#F15B2A', fmt:v=>window.U.fmtFull(v) },
    revenue:     { label:'Ciro (revenue)',   short:'Ciro',      color:'#2E7D32', fmt:v=>fmtTRY(v) },
    tx:          { label:'Transaction',      short:'Transaction',color:'#1565C0', fmt:v=>window.U.fmtFull(v) },
    aov:         { label:'AOV',              short:'AOV',       color:'#8E24AA', fmt:v=>fmtTRY(v) },
    cr:          { label:'Dönüşüm (CR)',     short:'CR',        color:'#F5A623', fmt:v=>window.U.fmtPct(v,2) },
  };

  // ——— distinct boyut listeleri (oturuma göre sıralı) ———
  function distinctBy(keyFn) {
    const m = new Map();
    for (const r of ROWS) { const k = keyFn(r); if (k==null) continue; m.set(k,(m.get(k)||0)+r.sessions); }
    return [...m.entries()].sort((a,b)=>b[1]-a[1]).map(e=>e[0]);
  }
  const ALL_PTYPES = distinctBy(r=>r.ptype);
  const ALL_BRANDS = distinctBy(r=>r.brand);

  // ——— çok boyutlu filtre: {monthSet, search, ptypes[], brands[]} ———
  function applyFilters(rows, f) {
    f = f || {};
    let out = rows;
    if (f.monthSet && f.monthSet.size) out = out.filter(r=>f.monthSet.has(r.ym));
    if (f.ptypes && f.ptypes.length) { const s=new Set(f.ptypes); out = out.filter(r=>s.has(r.ptype)); }
    if (f.brands && f.brands.length) { const s=new Set(f.brands); out = out.filter(r=>r.brand && s.has(r.brand)); }
    if (f.search && f.search.trim()) { const q=f.search.trim().toLowerCase(); out = out.filter(r=>r.lp.toLowerCase().includes(q) || (r.brand&&r.brand.toLowerCase().includes(q))); }
    return out;
  }

  // ——— tek bir LP'nin aylık serisi ———
  function lpSeries(lp, metric) {
    const rows = ROWS.filter(r=>r.lp===lp);
    return monthlySeries(rows, metric);
  }

  // ——— sparkline path (U.sparkPath sarmalayıcı) ———
  function spark(values, w, h) { return window.U.sparkPath(values, w, h, 2); }

  // ——— llms.txt: kategori/marka sayfasından ürün keşfi eşleştirmesi ———
  const STOP = new Set(['kadin','erkek','cocuk','unisex','modelleri','fiyatlari','fiyatları','ve','com','takimi','takim',
    'urunleri','urun','cesitleri','cesit','set','seti','2','3','4','cp2','cp','online','satin','al']);
  function llmsTokens(lp) {
    // marka sayfası → marka adı; kategori sayfası → anlamlı token'lar
    const m = lp.toLowerCase().match(/\/magaza\/marka\/([a-z0-9_-]+)/);
    if (m) return { type:'Marka', key:m[1].replace(/[_-]+/g,' '), tokens:[m[1].replace(/[_-]+/g,'')] };
    const seg = lp.toLowerCase().replace(/\/+$/,'').split('/').filter(Boolean);
    const slug = seg[1] || '';
    const toks = slug.replace(/\d+$/,'').split('-').map(t=>t.replace(/[^a-zçğıöşü]/g,'')).filter(t=>t.length>2 && !STOP.has(t));
    return { type:'Kategori', key:slug, tokens:toks };
  }
  // bir llms sayfası için ilişkili ürün satırları (slug token eşleşmesi veya marka eşleşmesi)
  function relatedProductRows(allRows, llmsLp, brandOf) {
    const info = llmsTokens(llmsLp);
    if (!info.tokens.length && !brandOf) return [];
    return allRows.filter(r => {
      if (r.ptype !== 'Ürün') return false;
      const lpl = r.lp.toLowerCase();
      if (info.type==='Marka' && brandOf && r.brand && r.brand.toLowerCase().replace(/\s+/g,'')===brandOf.toLowerCase().replace(/\s+/g,'')) return true;
      return info.tokens.some(t => lpl.includes(t));
    });
  }

  return {
    META, ROWS, MONTHS, MONTH_TR, trMonth,
    fmtTRY, inMonths, totals, groupBy, monthlySeries,
    lpLabel, lpUrl, downloadPNG, deltaPct, deltaClass, METRICS,
    ALL_PTYPES, ALL_BRANDS, applyFilters, lpSeries, spark, llmsTokens, relatedProductRows,
  };
})();
