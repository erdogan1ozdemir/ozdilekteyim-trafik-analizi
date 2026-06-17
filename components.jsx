// components.jsx — paylaşılan UI bileşenleri (window.COMP)
(function(){
  const h = React.createElement;
  const { useState, useRef, useEffect, useMemo } = React;
  const U = window.U, AU = window.AU;

  // ——— Terim sözlüğü (tooltip) ———
  const GLOSSARY = {
    'session':'Bir kullanıcının siteyle tek ziyaret oturumu (GA4 metriği).',
    'CR':'Conversion Rate — oturum başına tamamlanan transaction oranı.',
    'AOV':'Average Order Value — transaction başına ortalama sepet tutarı.',
    'llms.txt':'Yapay zeka modellerine sitenin öne çıkan sayfalarını tanıtan standart metin dosyası.',
    'referral':'Başka bir kaynaktan (burada chatgpt.com) gelen yönlendirme trafiği.',
    'Landing Page':'Kullanıcının siteye giriş yaptığı ilk sayfa.',
    'transaction':'Tamamlanan satın alma işlemi.',
    'AI Overview':'Arama sonuçlarında yapay zeka tarafından üretilen özet bloğu.',
  };
  function Term({t, children}) {
    return h('span', { className:'term', 'data-term':t, title: GLOSSARY[t] || '' }, children || t);
  }

  // ——— Section header (ToC hedefi) ———
  function Section({id, title, desc, children, tools, innerRef}) {
    return h('section', { id, ref: innerRef, className:'ai-section card' },
      h('div', { className:'card-header' },
        h('div', null,
          h('div', { className:'card-title-row' }, h('strong', null, title)),
          desc ? h('div', { style:{fontSize:'12.5px', color:'var(--ink-3)', marginTop:'3px', lineHeight:1.45} }, desc) : null
        ),
        tools ? h('div', { className:'ai-card-tools' }, tools) : null
      ),
      h('div', { className:'card-body' }, children)
    );
  }

  // ——— PNG export butonu (bir node ref'ini görüntüye çevirir) ———
  function PngButton({targetRef, name}) {
    const [busy, setBusy] = useState(false);
    return h('button', {
      className:'png-btn',
      disabled: busy,
      onClick: async () => {
        if (!targetRef.current) return;
        setBusy(true);
        try { await AU.downloadPNG(targetRef.current, name); } finally { setBusy(false); }
      }
    }, busy ? '…' : '⤓ PNG');
  }
  function CsvButton({rows, headers, name}) {
    return h('button', {
      className:'png-btn',
      onClick: () => U.downloadCSV((name||'veri')+'.csv', U.toCSV(rows, headers))
    }, '⤓ CSV');
  }

  // ——— llms.txt rozeti ———
  function LlmsBadge() {
    return h('span', { className:'ai-llms-badge', title:'Bu sayfa llms.txt "Önemli Sayfalar" listesinde yer alıyor (Şubat 2026 eklendi).' }, '✦ llms');
  }

  // ——— KPI scorecard şeridi ———
  function KpiStrip({items}) {
    return h('div', { className:'kpi-strip', style:{display:'grid', gridTemplateColumns:`repeat(${items.length}, 1fr)`, gap:'12px', marginBottom:'18px'} },
      items.map((it,i) => h('div', { key:i, className:'kpi kpi-mini', style:{position:'relative', background:'var(--bg-card)', border:'1px solid var(--line)', borderRadius:'var(--r-lg)', padding:'14px 16px', boxShadow:'var(--shadow-card)'} },
        h('div', { className:'bar', style:{background: it.color || 'var(--accent)'} }),
        h('div', { className:'label' }, it.label),
        h('div', { className:'value' }, it.value),
        it.sub ? h('div', { style:{fontSize:'11px', color:'var(--ink-3)', marginTop:'3px'} }, it.sub) : null
      ))
    );
  }

  // ——— Chart.js canvas wrapper ———
  function ChartCanvas({buildConfig, deps, height}) {
    const ref = useRef(null);
    const chartRef = useRef(null);
    useEffect(() => {
      if (!ref.current || !window.Chart) return;
      const cfg = buildConfig();
      chartRef.current = new window.Chart(ref.current.getContext('2d'), cfg);
      return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, deps || []);
    return h('div', { className:'ai-chart-wrap', style:{height:(height||320)+'px'} }, h('canvas', { ref }));
  }

  // Tema farkında grid/tick renkleri
  function chartTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      grid: dark ? 'rgba(255,255,255,.06)' : 'rgba(16,51,47,.07)',
      tick: dark ? '#B8B0A3' : '#8A8A8A',
      ink:  dark ? '#F5F1EA' : '#10332F',
    };
  }

  // ——— Çoklu metrik toggle çizgi grafiği (manşet) ———
  function MetricToggleChart({rows, defaultMetrics}) {
    const [enabled, setEnabled] = useState(defaultMetrics || ['sessions','revenue']);
    const months = AU.MONTHS;
    const labels = months.map(AU.trMonth);
    const order = ['sessions','revenue','tx','aov','cr'];

    function toggle(m){
      setEnabled(prev => prev.includes(m) ? prev.filter(x=>x!==m) : [...prev, m]);
    }

    const build = () => {
      const th = chartTheme();
      const enOrdered = order.filter(m => enabled.includes(m));
      const scales = { x: { grid:{color:th.grid}, ticks:{color:th.tick, font:{size:11}} } };
      const datasets = enOrdered.map((m, idx) => {
        const M = AU.METRICS[m];
        const axisId = 'y_'+m;
        const showAxis = idx < 2; // ilk 2 metriğin ekseni görünür (sol/sağ)
        scales[axisId] = {
          position: idx % 2 === 0 ? 'left' : 'right',
          display: showAxis,
          grid: { drawOnChartArea: idx === 0, color: th.grid },
          ticks: { color: M.color, font:{size:10}, callback:(v)=> (m==='revenue'||m==='aov') ? AU.fmtTRY(v,{compact:true}) : (m==='cr'? (v*100).toFixed(1)+'%' : U.fmtNum(v)) },
        };
        return {
          label: M.label, yAxisID: axisId,
          data: AU.monthlySeries(rows, m),
          borderColor: M.color, backgroundColor: M.color+'22',
          borderWidth: 2.5, tension: .32, pointRadius: 3, pointHoverRadius: 5, fill: false,
        };
      });
      return {
        type:'line',
        data: { labels, datasets },
        options: {
          responsive:true, maintainAspectRatio:false, interaction:{mode:'index', intersect:false},
          plugins: {
            legend: { display:false },
            tooltip: { callbacks: { label:(c)=>{ const key=order.find(k=>AU.METRICS[k].label===c.dataset.label); return c.dataset.label+': '+AU.METRICS[key].fmt(c.parsed.y); } } },
          },
          scales,
        },
      };
    };

    return h('div', null,
      h('div', { className:'ai-metric-legend' },
        order.map(m => {
          const M = AU.METRICS[m]; const on = enabled.includes(m);
          return h('span', { key:m, className:'ml'+(on?' on':''), style: on?{color:M.color}:{}, onClick:()=>toggle(m) },
            h('span', { className:'dot', style:{background:M.color} }), M.short);
        })
      ),
      h(ChartCanvas, { buildConfig: build, deps:[enabled.join(','), rows], height:360 })
    );
  }

  // ——— Genel sortable tablo ———
  // columns: [{key,label,align,get,render,sortable}]  rows: data array
  function DataTable({columns, rows, initialSort, maxRows}) {
    const [sort, setSort] = useState(initialSort || { key: columns[0].key, dir:'desc' });
    const sorted = useMemo(() => {
      const col = columns.find(c=>c.key===sort.key);
      const getv = (r)=> col && col.get ? col.get(r) : r[sort.key];
      const arr = [...rows].sort((a,b)=>{
        const va=getv(a), vb=getv(b);
        if (typeof va==='number' && typeof vb==='number') return sort.dir==='asc'? va-vb : vb-va;
        return sort.dir==='asc'? String(va).localeCompare(String(vb),'tr') : String(vb).localeCompare(String(va),'tr');
      });
      return maxRows ? arr.slice(0, maxRows) : arr;
    }, [rows, sort]);
    function hdrClick(c){ if (c.sortable===false) return; setSort(s => ({key:c.key, dir: s.key===c.key && s.dir==='desc' ? 'asc':'desc'})); }
    return h('div', { className:'tbl-wrap' },
      h('table', { className:'tbl' },
        h('thead', null, h('tr', null, columns.map(c =>
          h('th', { key:c.key, onClick:()=>hdrClick(c), style:{cursor:c.sortable===false?'default':'pointer', textAlign:c.align||'left', whiteSpace:'nowrap'} },
            c.label, sort.key===c.key ? h('span',{style:{marginLeft:'4px',color:'var(--accent)'}}, sort.dir==='asc'?'▲':'▼') : null)
        ))),
        h('tbody', null, sorted.map((r,i) =>
          h('tr', { key:i }, columns.map(c =>
            h('td', { key:c.key, className: c.align==='right'?'num':'', style:{textAlign:c.align||'left'} },
              c.render ? c.render(r) : (c.get ? c.get(r) : r[c.key]))
          ))
        ))
      )
    );
  }

  // ——— Segment toggle (metrik seçici) ———
  function SegToggle({options, value, onChange}) {
    return h('div', { className:'seg-toggle' },
      options.map(o => h('button', { key:o.key, className: value===o.key?'on':'', onClick:()=>onChange(o.key) }, o.label))
    );
  }

  // ——— Ay multiselect (chip-btn satırı şeklinde, basit ve sağlam) ———
  function MonthFilter({months, selected, onChange}) {
    const allOn = selected.size === 0 || selected.size === months.length;
    function toggle(m){
      // "Tüm aylar" durumundayken tek aya tıklamak o aya izole eder (sezgisel davranış)
      if (selected.size===0){ onChange(new Set([m])); return; }
      const next = new Set(selected);
      if (next.has(m)) next.delete(m); else next.add(m);
      if (next.size===0 || next.size===months.length) { onChange(new Set()); return; }
      onChange(next);
    }
    return h('div', { className:'chips', style:{display:'flex', flexWrap:'wrap', gap:'6px', alignItems:'center'} },
      h('button', { className:'chip-btn'+(allOn?' active':''), style: allOn?{background:'var(--accent)', color:'#fff', borderColor:'var(--accent)'}:{}, onClick:()=>onChange(new Set()) }, 'Tüm aylar'),
      months.map(m => {
        const on = selected.size>0 && selected.has(m);
        const partial = (AU.META.partialMonths||[]).includes(m);
        return h('button', { key:m, className:'chip-btn'+(on?' active':''),
          style: on?{background:'var(--accent)', color:'#fff', borderColor:'var(--accent)'}:{},
          title: partial?'Kısmi ay (rapor üretim tarihine kadar olan veriler)':'',
          onClick:()=>toggle(m) }, AU.trMonth(m), partial? ' *' : '');
      })
    );
  }

  window.COMP = { Term, Section, PngButton, CsvButton, LlmsBadge, KpiStrip, ChartCanvas, chartTheme, MetricToggleChart, DataTable, SegToggle, MonthFilter };
})();
