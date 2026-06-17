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
    if (!lp) return '(boş)';
    let s = lp.replace(/^\/+/, '');
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

  return {
    META, ROWS, MONTHS, MONTH_TR, trMonth,
    fmtTRY, inMonths, totals, groupBy, monthlySeries,
    lpLabel, lpUrl, downloadPNG, deltaPct, deltaClass, METRICS,
  };
})();
