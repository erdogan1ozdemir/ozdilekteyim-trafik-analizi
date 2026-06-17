// components.jsx — paylaşılan UI bileşenleri (window.COMP)
(function(){
  const h = React.createElement;
  const { useState, useRef, useEffect, useMemo } = React;
  const U = window.U, AU = window.AU;

  // datalabels eklentisini global kaydet, varsayılan KAPALI
  if (window.Chart && window.ChartDataLabels) {
    window.Chart.register(window.ChartDataLabels);
    window.Chart.defaults.set('plugins.datalabels', { display:false });
  }

  const GLOSSARY = {
    'session':'Bir kullanıcının siteyle tek ziyaret oturumu (GA4 metriği).',
    'CR':'Conversion Rate — oturum başına tamamlanan transaction oranı.',
    'AOV':'Average Order Value — transaction başına ortalama sepet tutarı.',
    'llms.txt':'Yapay zeka modellerine sitenin öne çıkan sayfalarını tanıtan standart metin dosyası.',
    'referral':'Başka bir kaynaktan (burada chatgpt.com) gelen yönlendirme trafiği.',
    'Landing Page':'Kullanıcının siteye giriş yaptığı ilk sayfa.',
    'transaction':'Tamamlanan satın alma işlemi.',
  };
  function Term({t, children}) { return h('span',{className:'term','data-term':t,title:GLOSSARY[t]||''}, children||t); }

  function Section({id, title, desc, children, tools, innerRef}) {
    return h('section', { id, ref:innerRef, className:'ai-section card' },
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

  function PngButton({targetRef, name}) {
    const [busy, setBusy] = useState(false);
    return h('button', { className:'png-btn', disabled:busy,
      onClick: async () => { if (!targetRef.current) return; setBusy(true); try { await AU.downloadPNG(targetRef.current, name); } finally { setBusy(false); } }
    }, busy ? '…' : '⤓ PNG');
  }
  function CsvButton({rows, headers, name}) {
    return h('button', { className:'png-btn', onClick: () => U.downloadCSV((name||'veri')+'.csv', U.toCSV(rows, headers)) }, '⤓ CSV');
  }
  function LlmsBadge() {
    return h('span', { className:'ai-llms-badge', title:'Bu sayfa llms.txt "Önemli Sayfalar" listesinde yer alıyor (Şubat 2026 eklendi).' }, '✦ llms');
  }

  // ——— Yeni KPI kartları: gradient/gölge + opsiyonel sparkline (sol bar YOK) ———
  function KpiStrip({items, cols}) {
    return h('div', { className:'kpi2-grid', style:{gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))'} },
      items.map((it,i) => {
        const c = it.color || 'var(--accent)';
        let sp = null;
        if (it.spark && it.spark.length>1) {
          const {line, area} = U.sparkPath(it.spark, 120, 30, 2);
          sp = h('svg', { className:'k-spark', width:'100%', height:30, viewBox:'0 0 120 30', preserveAspectRatio:'none' },
            h('path',{d:area, fill:c, fillOpacity:.13}), h('path',{d:line, stroke:c, strokeWidth:1.6, fill:'none', strokeLinecap:'round', strokeLinejoin:'round'}));
        }
        return h('div', { key:i, className:'kpi2' },
          h('div', { className:'k-glow', style:{background:`linear-gradient(135deg, color-mix(in srgb, ${c} 13%, var(--bg-card)) 0%, var(--bg-card) 62%)`} }),
          h('div', { className:'k-label' }, it.label),
          h('div', { className:'k-value', style:{color:c} }, it.value),
          it.sub ? h('div', { className:'k-sub' }, it.sub) : null,
          sp
        );
      })
    );
  }

  function chartTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return { grid: dark?'rgba(255,255,255,.06)':'rgba(16,51,47,.07)', tick: dark?'#B8B0A3':'#8A8A8A', ink: dark?'#F5F1EA':'#10332F' };
  }

  function ChartCanvas({buildConfig, deps, height}) {
    const ref = useRef(null), chartRef = useRef(null);
    useEffect(() => {
      if (!ref.current || !window.Chart) return;
      chartRef.current = new window.Chart(ref.current.getContext('2d'), buildConfig());
      return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, deps || []);
    return h('div', { className:'ai-chart-wrap', style:{height:(height||320)+'px'} }, h('canvas', { ref }));
  }

  // ——— Çoklu metrik çizgi grafiği: metrik toggle + değer etiketi toggle ———
  function MetricChart({rows, defaultMetrics, height, label}) {
    const [enabled, setEnabled] = useState(defaultMetrics || ['sessions','revenue']);
    const [showLabels, setShowLabels] = useState(false);
    const labels = AU.MONTHS.map(AU.trMonth);
    const order = ['sessions','revenue','tx','aov','cr'];
    function toggle(m){ setEnabled(prev => prev.includes(m) ? (prev.length>1?prev.filter(x=>x!==m):prev) : [...prev, m]); }
    const build = () => {
      const th = chartTheme();
      const en = order.filter(m => enabled.includes(m));
      const scales = { x: { grid:{color:th.grid}, ticks:{color:th.tick, font:{size:11}} } };
      const datasets = en.map((m, idx) => {
        const M = AU.METRICS[m]; const axisId = 'y_'+m; const showAxis = idx < 2;
        scales[axisId] = { position: idx%2===0?'left':'right', display:showAxis, grid:{drawOnChartArea:idx===0, color:th.grid},
          ticks:{ color:M.color, font:{size:10}, callback:v=> (m==='revenue'||m==='aov')?AU.fmtTRY(v,{compact:true}):(m==='cr'?(v*100).toFixed(1)+'%':U.fmtNum(v)) } };
        return { label:M.label, yAxisID:axisId, data:AU.monthlySeries(rows, m), borderColor:M.color, backgroundColor:M.color+'22',
          borderWidth:2.5, tension:.32, pointRadius:3, pointHoverRadius:5, fill:false,
          datalabels:{ display:showLabels, color:M.color, anchor:'end', align:'top', font:{family:'Bricolage Grotesque', weight:700, size:10},
            formatter:v=> (m==='revenue'||m==='aov')?AU.fmtTRY(v,{compact:true}):(m==='cr'?(v*100).toFixed(1)+'%':U.fmtNum(v)) } };
      });
      return { type:'line', data:{labels, datasets},
        options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false},
          plugins:{ legend:{display:false}, datalabels:{display:showLabels},
            tooltip:{ callbacks:{ label:c=>{ const k=order.find(x=>AU.METRICS[x].label===c.dataset.label); return c.dataset.label+': '+AU.METRICS[k].fmt(c.parsed.y); } } } },
          scales } };
    };
    return h('div', null,
      h('div', { style:{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'} },
        h('div', { className:'ai-metric-legend' },
          order.map(m => { const M=AU.METRICS[m]; const on=enabled.includes(m);
            return h('span', { key:m, className:'ml'+(on?' on':''), style:on?{color:M.color}:{}, onClick:()=>toggle(m) },
              h('span',{className:'dot',style:{background:M.color}}), M.short); })
        ),
        h('button', { className:'lbl-toggle'+(showLabels?' on':''), onClick:()=>setShowLabels(s=>!s), title:'Grafik üzerinde değerleri göster/gizle' },
          (showLabels?'✓ ':'')+'Değerler')
      ),
      h(ChartCanvas, { buildConfig:build, deps:[enabled.join(','), showLabels, rows], height:height||360 })
    );
  }

  // ——— Donut (Chart.js) — çerçevesiz; dilim üstünde marka + % (sığarsa, dinamik punto) ———
  function Donut({groups, metric, colors, height, onSliceClick}) {
    const total = groups.reduce((s,g)=>s+g[metric],0) || 1;
    const build = () => ({ type:'doughnut',
      data:{ labels:groups.map(g=>g.key), datasets:[{ data:groups.map(g=>g[metric]), backgroundColor:groups.map(g=>colors[g.key]||'#999'), borderWidth:0, hoverOffset:6, spacing:1 }] },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'58%',
        onClick: onSliceClick ? (e,els)=>{ if(els.length) onSliceClick(groups[els[0].index].key); } : undefined,
        plugins:{ legend:{position:'right', labels:{color:chartTheme().ink, font:{size:11}, boxWidth:12, usePointStyle:true, pointStyle:'circle'}},
          datalabels:{ display:(ctx)=>{ const v=ctx.dataset.data[ctx.dataIndex]; return v/total>=0.06; },
            color:'#fff', textAlign:'center', font:(ctx)=>{ const p=ctx.dataset.data[ctx.dataIndex]/total; const sz=p>=0.18?13:p>=0.10?11:9; return {family:'Bricolage Grotesque', weight:700, size:sz, lineHeight:1.05}; },
            formatter:(v,ctx)=>{ const p=(v/total*100); const name=ctx.chart.data.labels[ctx.dataIndex]; return p>=0.10*100? [name, '%'+p.toFixed(0)] : '%'+p.toFixed(0); } },
          tooltip:{callbacks:{label:c=>c.label+': '+AU.METRICS[metric].fmt(c.parsed)+' ('+(c.parsed/total*100).toFixed(1)+'%)'}} } } });
    return h(ChartCanvas, { buildConfig:build, deps:[metric, groups], height:height||300 });
  }

  // ——— Modal overlay ———
  function Modal({title, onClose, children, width}) {
    useEffect(()=>{ const k=e=>{ if(e.key==='Escape') onClose(); }; document.addEventListener('keydown',k); return ()=>document.removeEventListener('keydown',k); },[]);
    return h('div', { className:'ai-modal-overlay', onClick:onClose },
      h('div', { className:'ai-modal', style:{maxWidth:(width||820)+'px'}, onClick:e=>e.stopPropagation() },
        h('div', { className:'ai-modal-head' }, h('strong',null,title), h('button',{className:'ai-modal-x', onClick:onClose, 'aria-label':'Kapat'},'×')),
        h('div', { className:'ai-modal-body' }, children)
      )
    );
  }

  // ——— Not kartı (yapısal not bloğu) ———
  function NoteCard({label, children, tone}) {
    return h('div', { className:'note-card'+(tone?(' '+tone):'') },
      h('div', { className:'note-label' }, label||'NOT'),
      h('div', { className:'note-body' }, children)
    );
  }

  // ——— Isı haritası tablosu (Sezon Takvimi stili): satır × ay, hmColor; tıklanır ———
  function HeatTable({rows, months, onRowClick, deltaKey, deltaLabel}) {
    const lbls = months.map(AU.trMonth);
    const cols = `200px repeat(${months.length}, minmax(40px,1fr))` + (deltaKey?' 76px':'');
    const grid = [];
    grid.push(h('div',{key:'corner', className:'hm-head hm-corner'}));
    lbls.forEach((m,i)=>grid.push(h('div',{key:'h'+i, className:'hm-head'}, m)));
    if (deltaKey) grid.push(h('div',{key:'hd', className:'hm-head'}, deltaLabel||'Δ'));
    rows.forEach((row,ri)=>{
      const max=Math.max(...row.values), min=Math.min(...row.values), range=max-min||1;
      grid.push(h('div',{key:'l'+ri, className:'hm-row-label'+(onRowClick?' clickable':''), title:row.label, onClick:onRowClick?()=>onRowClick(row):undefined},
        h('span',{style:{fontWeight:600}}, row.label)));
      row.values.forEach((v,i)=>{ const t=(v-min)/range;
        grid.push(h('div',{key:`c${ri}-${i}`, className:'hm-cell'+(onRowClick?' clickable':''), style:{background:v>0?U.hmColor(t):'var(--line-soft)', color:v>0?U.hmText(t):'var(--ink-3)'}, onClick:onRowClick?()=>onRowClick(row):undefined},
          h('span',{className:'hm-val'}, v>0?U.fmtNum(v):'·'))); });
      if (deltaKey) grid.push(h('div',{key:'d'+ri, className:'hm-delta', onClick:onRowClick?()=>onRowClick(row):undefined, style:onRowClick?{cursor:'pointer'}:{}},
        h('span',{className: row[deltaKey]>0?'delta-pos':row[deltaKey]<0?'delta-neg':'delta-neu'}, (row[deltaKey]>0?'+':'')+U.fmtNum(row[deltaKey]))));
    });
    return h('div',{className:'heatmap-scroll'}, h('div',{className:'heatmap', style:{gridTemplateColumns:cols}}, grid));
  }

  // ——— Marka donut + çok-metrikli liste ———
  function BrandDonut({groups, metric, selected, onToggle, height}) {
    const PAL = ['#F15B2A','#1565C0','#2E7D32','#8E24AA','#F5A623','#00838F','#D32F2F','#6D4C41','#5E35B1','#00897B','#C2185B','#7CB342','#FB8C00','#3949AB'];
    const top = [...groups].sort((a,b)=>b[metric]-a[metric]).slice(0,12);
    const colorOf = {}; top.forEach((g,i)=>colorOf[g.key]=PAL[i%PAL.length]);
    const total = top.reduce((s,g)=>s+g[metric],0)||1;
    const build = () => ({ type:'doughnut',
      data:{ labels:top.map(g=>g.key), datasets:[{ data:top.map(g=>g[metric]), backgroundColor:top.map(g=>colorOf[g.key]), borderWidth:0, hoverOffset:6, spacing:1 }] },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
        onClick:(e,els)=>{ if(els.length && onToggle) onToggle(top[els[0].index].key); },
        plugins:{ legend:{display:false}, datalabels:{display:false},
          tooltip:{callbacks:{label:c=>c.label+': '+AU.METRICS[metric].fmt(c.parsed)+' ('+(c.parsed/total*100).toFixed(1)+'%)'}} } } });
    const selSet = selected && selected.length ? new Set(selected) : null;
    return h('div', { style:{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px,1fr))', gap:'22px', alignItems:'center'} },
      h(ChartCanvas, { buildConfig:build, deps:[metric, groups, selected], height:height||320 }),
      h('div', { className:'brand-legend' },
        h('div', { className:'bl-head' }, h('span',null,''), h('span',null,'Marka'), h('span',null,'Oturum'), h('span',null,'Ciro'), h('span',null,'Tx')),
        top.map(g => h('div', { key:g.key, className:'bl-row'+(selSet&&selSet.has(g.key)?' on':''), onClick:()=>onToggle&&onToggle(g.key) },
          h('span',{className:'sw', style:{background:colorOf[g.key]}}),
          h('span',{className:'bl-name'}, g.key),
          h('span',{className:'bl-v'}, U.fmtNum(g.sessions)),
          h('span',{className:'bl-v'}, AU.fmtTRY(g.revenue,{compact:true})),
          h('span',{className:'bl-v'}, U.fmtNum(g.tx))))
      )
    );
  }

  // ——— sortable + tıklanabilir tablo (artımlı sayfalama ile) ———
  function DataTable({columns, rows, initialSort, maxRows, onRowClick, activeKey, keyOf, pageSize}) {
    const PS = pageSize || 60;
    const [sort, setSort] = useState(initialSort || { key: columns[0].key, dir:'desc' });
    const [shown, setShown] = useState(PS);
    const sortedAll = useMemo(() => {
      const col = columns.find(c=>c.key===sort.key);
      const getv = (r)=> col && col.get ? col.get(r) : r[sort.key];
      const arr = [...rows].sort((a,b)=>{ const va=getv(a), vb=getv(b);
        if (typeof va==='number' && typeof vb==='number') return sort.dir==='asc'?va-vb:vb-va;
        return sort.dir==='asc'?String(va).localeCompare(String(vb),'tr'):String(vb).localeCompare(String(va),'tr'); });
      return maxRows ? arr.slice(0, maxRows) : arr;
    }, [rows, sort, maxRows]);
    useEffect(()=>{ setShown(PS); }, [rows, sort.key, sort.dir]); // filtre/sıralama değişince başa dön
    const sorted = sortedAll.slice(0, shown);
    function hdrClick(c){ if (c.sortable===false) return; setSort(s => ({key:c.key, dir: s.key===c.key && s.dir==='desc'?'asc':'desc'})); }
    const rest = sortedAll.length - shown;
    return h('div', null,
      h('div', { className:'tbl-wrap' },
        h('table', { className:'tbl' },
          h('thead', null, h('tr', null, columns.map(c =>
            h('th', { key:c.key, onClick:()=>hdrClick(c), style:{cursor:c.sortable===false?'default':'pointer', textAlign:c.align||'left', whiteSpace:'nowrap'} },
              c.label, sort.key===c.key ? h('span',{style:{marginLeft:'4px',color:'var(--accent)'}}, sort.dir==='asc'?'▲':'▼') : null))
          )),
          h('tbody', null, sorted.map((r,i) => {
            const k = keyOf ? keyOf(r) : i;
            const active = activeKey!=null && k===activeKey;
            return h('tr', { key:i, className:(onRowClick?'row-clickable ':'')+(active?'row-active':''), onClick: onRowClick?()=>onRowClick(r):undefined },
              columns.map(c => h('td', { key:c.key, className:c.align==='right'?'num':'', style:{textAlign:c.align||'left'} },
                c.render ? c.render(r) : (c.get ? c.get(r) : r[c.key]))));
          }))
        )
      ),
      rest>0 ? h('div', { className:'tbl-more' },
        h('span',{style:{fontSize:'12px',color:'var(--ink-3)',marginRight:'10px'}}, sorted.length+' / '+sortedAll.length+' satır'),
        h('button', { className:'chip-btn', onClick:()=>setShown(s=>s+PS) }, 'Daha fazla göster (+'+Math.min(PS,rest)+')'),
        rest>PS ? h('button', { className:'chip-btn', style:{marginLeft:'6px'}, onClick:()=>setShown(sortedAll.length) }, 'Tümünü göster ('+U.fmtFull(sortedAll.length)+')') : null
      ) : null
    );
  }

  function SegToggle({options, value, onChange}) {
    return h('div', { className:'seg-toggle' }, options.map(o => h('button', { key:o.key, className:value===o.key?'on':'', onClick:()=>onChange(o.key) }, o.label)));
  }

  // ——— MultiSelect (checkbox dropdown) ———
  function MultiSelect({label, options, selected, onChange, width, colorMap}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => { const onDoc=e=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown',onDoc); return ()=>document.removeEventListener('mousedown',onDoc); }, []);
    const toggle = (o)=> selected.includes(o)?onChange(selected.filter(x=>x!==o)):onChange([...selected,o]);
    const txt = selected.length===0?`Tüm ${label}`: selected.length===1?selected[0]: `${selected.length} ${label} seçili`;
    return h('div', { ref, className:'multiselect', style:{width:width||190} },
      h('button', { className:'multiselect-trigger'+(open?' open':''), onClick:()=>setOpen(!open) }, h('span',{className:'ms-text'},txt), h('span',{className:'ms-caret'},'▾')),
      open && h('div', { className:'multiselect-panel' },
        h('div', { className:'ms-actions' }, h('button',{className:'ms-action',onClick:()=>onChange([])},'Temizle')),
        h('div', { className:'ms-options' }, options.map(o => h('label',{key:o, className:'ms-option'},
          h('input',{type:'checkbox', checked:selected.includes(o), onChange:()=>toggle(o)}),
          colorMap && h('span',{className:'ms-swatch', style:{background:colorMap[o]||'#888'}}),
          h('span',{className:'ms-label'},o))))
      )
    );
  }

  function SearchInput({value, onChange, placeholder}) {
    return h('div', { className:'search-box' },
      h('span', { className:'si' }, h('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round'},h('circle',{cx:11,cy:11,r:7}),h('line',{x1:21,y1:21,x2:16.65,y2:16.65}))),
      h('input', { type:'text', value, placeholder:placeholder||'Ara…', onChange:e=>onChange(e.target.value) }),
      value ? h('button', { className:'clr', onClick:()=>onChange(''), title:'Temizle' }, '×') : null
    );
  }

  function MonthFilter({months, selected, onChange}) {
    const allOn = selected.size === 0;
    function toggle(m){
      if (selected.size===0){ onChange(new Set([m])); return; }
      const next = new Set(selected);
      if (next.has(m)) next.delete(m); else next.add(m);
      if (next.size===0 || next.size===months.length) { onChange(new Set()); return; }
      onChange(next);
    }
    return h('div', { className:'chips', style:{display:'flex', flexWrap:'wrap', gap:'6px', alignItems:'center'} },
      h('button', { className:'chip-btn'+(allOn?' active':''), style: allOn?{background:'var(--accent)',color:'#fff',borderColor:'var(--accent)'}:{}, onClick:()=>onChange(new Set()) }, 'Tüm aylar'),
      months.map(m => { const on = selected.size>0 && selected.has(m); const partial=(AU.META.partialMonths||[]).includes(m);
        return h('button', { key:m, className:'chip-btn'+(on?' active':''), style:on?{background:'var(--accent)',color:'#fff',borderColor:'var(--accent)'}:{},
          title: partial?'Kısmi ay':'', onClick:()=>toggle(m) }, AU.trMonth(m)+(partial?' *':'')); })
    );
  }

  // ——— Özet mini-özet kartı: çok-metrikli (oturum/ciro/tx) ———
  function SummaryCard({title, goLabel, onGo, rows, totals}) {
    return h('div', { className:'summary-card', onClick:onGo },
      h('div', { className:'sc-head' }, h('span',{className:'sc-title'},title), h('span',{className:'sc-go'}, (goLabel||'Detay')+' →')),
      totals ? h('div', { className:'sc-spark-row' },
        h('div',{className:'sc-metric', style:{'--m':AU.METRICS.sessions.color}}, h('div',{className:'ml2'},'Oturum'), h('div',{className:'mv2'}, U.fmtNum(totals.sessions))),
        h('div',{className:'sc-metric', style:{'--m':AU.METRICS.revenue.color}}, h('div',{className:'ml2'},'Ciro'), h('div',{className:'mv2'}, AU.fmtTRY(totals.revenue,{compact:true}))),
        h('div',{className:'sc-metric', style:{'--m':AU.METRICS.tx.color}}, h('div',{className:'ml2'},'Transaction'), h('div',{className:'mv2'}, U.fmtNum(totals.tx)))
      ) : null,
      h('div', { style:{marginTop:totals?'10px':'0'} },
        h('div',{className:'sc-row', style:{fontSize:'9.5px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color:'var(--ink-3)', borderBottom:'1px solid var(--line)'}},
          h('span',{className:'nm'}, ''), h('span',{style:{display:'flex',gap:'14px'}}, h('span',{style:{minWidth:'44px',textAlign:'right'}},'Otr'), h('span',{style:{minWidth:'52px',textAlign:'right'}},'Ciro'), h('span',{style:{minWidth:'26px',textAlign:'right'}},'Tx'))),
        rows.map((r,i)=>h('div',{key:i, className:'sc-row'},
          h('span',{className:'nm'}, r.nm),
          h('span',{style:{display:'flex',gap:'14px',fontFamily:'Bricolage Grotesque',fontWeight:600,fontVariantNumeric:'tabular-nums'}},
            h('span',{style:{minWidth:'44px',textAlign:'right',color:'var(--ink)'}}, U.fmtNum(r.sessions)),
            h('span',{style:{minWidth:'52px',textAlign:'right',color:'var(--ink-2)'}}, AU.fmtTRY(r.revenue,{compact:true})),
            h('span',{style:{minWidth:'26px',textAlign:'right',color:'var(--ink-2)'}}, U.fmtNum(r.tx)))))
      )
    );
  }

  // ——— Tekrar kullanılabilir filtre çubuğu (arama + tip + marka) ———
  function FilterBar({filters, setFilters, showSearch=true, showPtype=true, showBrand=true, extra}) {
    const set = (patch)=>setFilters(f=>({...f, ...patch}));
    const hasF = (filters.search) || (filters.ptypes&&filters.ptypes.length) || (filters.brands&&filters.brands.length);
    return h('div', null,
      h('div', { className:'filter-row' },
        showSearch ? h(SearchInput, { value:filters.search||'', onChange:v=>set({search:v}), placeholder:'Landing page veya marka ara…' }) : null,
        showPtype ? h(MultiSelect, { label:'tip', options:AU.ALL_PTYPES, selected:filters.ptypes||[], onChange:v=>set({ptypes:v}), width:165 }) : null,
        showBrand ? h(MultiSelect, { label:'marka', options:AU.ALL_BRANDS, selected:filters.brands||[], onChange:v=>set({brands:v}), width:185 }) : null,
        extra || null
      ),
      hasF ? h('div', { className:'active-filter-chips' },
        (filters.ptypes||[]).map(p=>h('span',{key:'p'+p,className:'afc',onClick:()=>set({ptypes:filters.ptypes.filter(x=>x!==p)})},'Tip: '+p,h('span',{className:'x'},'×'))),
        (filters.brands||[]).map(b=>h('span',{key:'b'+b,className:'afc',onClick:()=>set({brands:filters.brands.filter(x=>x!==b)})},'Marka: '+b,h('span',{className:'x'},'×'))),
        filters.search?h('span',{className:'afc',onClick:()=>set({search:''})},'Arama: '+filters.search,h('span',{className:'x'},'×')):null,
        h('button',{className:'chip-btn',onClick:()=>setFilters(f=>({...f, ptypes:[], brands:[], search:''}))},'× Temizle')
      ) : null
    );
  }

  window.COMP = { Term, Section, PngButton, CsvButton, LlmsBadge, KpiStrip, ChartCanvas, chartTheme, MetricChart, Donut, BrandDonut, DataTable, SegToggle, MultiSelect, SearchInput, MonthFilter, SummaryCard, FilterBar, Modal, NoteCard, HeatTable };
})();
