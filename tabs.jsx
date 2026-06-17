// tabs.jsx — AI trafik raporu alt sekmeleri (window.TABS)
(function(){
  const h = React.createElement;
  const { useState, useRef, useMemo } = React;
  const U = window.U, AU = window.AU, C = window.COMP;
  const { Section, PngButton, CsvButton, LlmsBadge, KpiStrip, MetricChart, Donut, DataTable, SegToggle,
          ChartCanvas, chartTheme, Term, MultiSelect, SearchInput, SummaryCard } = C;

  function ExportSection(props) {
    const ref = useRef(null);
    const tools = [
      props.csv ? h(CsvButton, { key:'c', rows:props.csv.rows, headers:props.csv.headers, name:props.csv.name }) : null,
      h(PngButton, { key:'p', targetRef:ref, name:props.pngName || 'ozdilekteyim-ai' }),
    ];
    return h(Section, { id:props.id, title:props.title, desc:props.desc, tools, innerRef:ref }, props.children);
  }

  function groupLP(rows) {
    return AU.groupBy(rows, r => r.lp).map(x => ({
      lp:x.key, sessions:x.sessions, tx:x.tx, revenue:x.revenue, aov:x.aov, cr:x.cr,
      inLlms:x._rows.some(r=>r.inLlms), ptype:x._rows[0].ptype, brand:x._rows[0].brand,
    }));
  }
  const PTYPE_COLORS = { 'Ürün':'#F15B2A','Kategori':'#1565C0','Market':'#2E7D32','Sepet/Checkout':'#8E24AA','Anasayfa':'#F5A623','Marka':'#00838F','Hesap':'#6D4C41','Diğer':'#9E9E9E' };
  const lpCell = r => h('span',{className:'lp-cell'}, h('a',{href:AU.lpUrl(r.lp),target:'_blank',onClick:e=>e.stopPropagation()}, AU.lpLabel(r.lp)), r.inLlms?h(LlmsBadge):null);
  const fmtBy = (m,v)=>AU.METRICS[m].fmt(v);

  // ============ 1. ÖZET ============
  function Ozet({rows, allRows, navTo}) {
    const t = AU.totals(rows);
    const kpis = [
      { label:'Toplam AI Oturum', value:U.fmtFull(t.sessions), color:AU.METRICS.sessions.color, sub:'ChatGPT referral', spark:AU.monthlySeries(allRows,'sessions') },
      { label:'Toplam Ciro', value:AU.fmtTRY(t.revenue), color:AU.METRICS.revenue.color, spark:AU.monthlySeries(allRows,'revenue') },
      { label:'Transaction', value:U.fmtFull(t.tx), color:AU.METRICS.tx.color, spark:AU.monthlySeries(allRows,'tx') },
      { label:'AOV', value:AU.fmtTRY(t.aov), color:AU.METRICS.aov.color, sub:'işlem başına' },
      { label:'Dönüşüm (CR)', value:U.fmtPct(t.cr,2), color:AU.METRICS.cr.color, sub:'oturum → işlem' },
    ];
    const sess = AU.monthlySeries(allRows,'sessions');
    const peak = AU.MONTHS[sess.indexOf(Math.max(...sess))];
    // mini özetler
    const lpTop = groupLP(rows).sort((a,b)=>b.sessions-a.sessions).slice(0,5);
    const pt = AU.groupBy(rows,r=>r.ptype).sort((a,b)=>b.sessions-a.sessions).slice(0,5);
    const ptTot = AU.groupBy(rows,r=>r.ptype).reduce((s,g)=>s+g.sessions,0)||1;
    const brands = AU.groupBy(rows.filter(r=>r.brand),r=>r.brand).sort((a,b)=>b.sessions-a.sessions).slice(0,5);
    const noconv = groupLP(rows).filter(x=>x.tx===0 && x.ptype!=='Sepet/Checkout' && x.ptype!=='Hesap' && x.sessions>=5).sort((a,b)=>b.sessions-a.sessions).slice(0,5);
    const llmsN = AU.META.llmsInData;
    // zaman içinde yükselenler (dönemin ilk yarısı → ikinci yarısı, tüm aylar üzerinden)
    const mLbl = AU.momentumLabels();
    const riseLp = AU.momentum(allRows, r=>r.lp).filter(x=>x.diff>0).slice(0,5);
    const riseBrand = AU.momentum(allRows, r=>r.brand).filter(x=>x.diff>0).slice(0,5);
    const riseProd = AU.momentum(allRows, r=>r.lp, r=>r.ptype==='Ürün').filter(x=>x.diff>0).slice(0,5);
    return h('div', null,
      h(KpiStrip, { items:kpis, cols:5 }),
      h('div', { className:'insight-strip', style:{marginBottom:'18px'} }, h('span',{className:'arrow'},'➜'),
        h('span', null, 'Seçili dönemde ', h(Term,{t:'referral'},'AI (ChatGPT) referral'), ' trafiği ',
          h('strong',null,U.fmtFull(t.sessions)+' '), h(Term,{t:'session'},'oturum'), ' ve ', h('strong',null,AU.fmtTRY(t.revenue)),
          ' ciro düzeyindedir. En yüksek oturum hacmi ', h('strong',null,AU.trMonth(peak)), ' ayında öne çıkmaktadır.')),
      h(ExportSection, { id:'sec-trend', title:'Aylık AI Trafik Eğrisi',
        desc:'Metrikleri üstteki etiketlerden açıp kapatabilir, "Değerler" ile grafik üzerinde sayıları gösterebilirsiniz. Zaman serisi tüm ayları gösterir.',
        pngName:'ozdilekteyim-ai-aylik-egri' },
        h(MetricChart, { rows:allRows, defaultMetrics:['sessions','revenue'] }),
        h('div', { className:'scope-note' }, 'Kapsam: yapay zeka kaynaklı referral trafiği, ', h('strong',null,'ağırlıkla chatgpt.com'),
          ' (az miktarda Perplexity ve Copilot dahil). Tutarlar ', h('strong',null,'₺'), ' cinsindendir. ',
          (AU.META.partialMonths||[]).length? ('İşaretli ay(lar) (*) kısmi dönem içerir: '+AU.META.partialMonths.map(AU.trMonth).join(', ')+'.'):'')
      ),
      h('div', { style:{margin:'4px 0 14px', fontSize:'13px', fontWeight:700, color:'var(--ink-2)'} }, 'Bölüm özetleri'),
      h('div', { className:'summary-grid' },
        h(SummaryCard, { title:'Top Landing Page · oturum', goLabel:'Landing Page', onGo:()=>navTo('lp'),
          rows: lpTop.map(x=>({nm:AU.lpLabel(x.lp), vv:U.fmtFull(x.sessions)})) }),
        h(SummaryCard, { title:'Sayfa Tipi · oturum payı', goLabel:'Sayfa Tipi', onGo:()=>navTo('ptype'),
          rows: pt.map(g=>({nm:g.key, vv:'%'+(g.sessions/ptTot*100).toFixed(1)})) }),
        h(SummaryCard, { title:'Top Markalar · oturum', goLabel:'Marka & Ürün', onGo:()=>navTo('brand'),
          rows: brands.map(g=>({nm:g.key, vv:U.fmtFull(g.sessions)})) }),
        h(SummaryCard, { title:'Dönüşmeyen sayfalar · oturum', goLabel:'Dönüşmeyen', onGo:()=>navTo('noconv'),
          rows: noconv.map(x=>({nm:AU.lpLabel(x.lp), vv:U.fmtFull(x.sessions)})) }),
        h(SummaryCard, { title:'llms.txt etkisi', goLabel:'llms.txt Etkisi', onGo:()=>navTo('llms'),
          rows:[ {nm:'Listede tanımlı sayfa', vv:AU.META.llmsPathCount}, {nm:'Veride görünen', vv:llmsN}, {nm:'llms.txt eklendi', vv:AU.trMonth(AU.META.llmsAddedMonth)} ] })
      ),
      h('div', { style:{margin:'22px 0 14px', fontSize:'13px', fontWeight:700, color:'var(--ink-2)'} },
        'Zaman içinde yükselenler ', h('span',{style:{fontWeight:500,color:'var(--ink-3)',fontSize:'12px'}}, '· '+mLbl.early[0]+'–'+mLbl.early[mLbl.early.length-1]+' → '+mLbl.late[0]+'–'+mLbl.late[mLbl.late.length-1]+' oturum artışı')),
      h('div', { className:'summary-grid', style:{gridTemplateColumns:'repeat(3,1fr)'} },
        h(SummaryCard, { title:'Yükselen Landing Page', goLabel:'Landing Page', onGo:()=>navTo('lp'),
          rows: riseLp.map(x=>({nm:AU.lpLabel(x.key), vv:'+'+U.fmtFull(x.diff)})) }),
        h(SummaryCard, { title:'Yükselen Markalar', goLabel:'Marka & Ürün', onGo:()=>navTo('brand'),
          rows: riseBrand.map(x=>({nm:x.key, vv:'+'+U.fmtFull(x.diff)})) }),
        h(SummaryCard, { title:'Yükselen Ürünler', goLabel:'Landing Page', onGo:()=>navTo('lp',{ptypes:['Ürün']}),
          rows: riseProd.map(x=>({nm:AU.lpLabel(x.key), vv:'+'+U.fmtFull(x.diff)})) })
      )
    );
  }

  // ============ 2. AYLIK TREND ============
  function Trend({rows, allRows}) {
    const [metric, setMetric] = useState('sessions');
    const [showLabels, setShowLabels] = useState(false);
    const months = AU.MONTHS;
    const series = AU.monthlySeries(allRows, metric);
    const sessAll = AU.monthlySeries(allRows,'sessions'), revAll=AU.monthlySeries(allRows,'revenue'), txAll=AU.monthlySeries(allRows,'tx');
    const tableRows = months.map((m,i)=>({ ym:m, sessions:sessAll[i], revenue:revAll[i], tx:txAll[i], dSess:i>0?AU.deltaPct(sessAll[i],sessAll[i-1]):null }));
    const fi = months.indexOf(AU.META.llmsAddedMonth);
    const buildBar = () => { const th=chartTheme(); const M=AU.METRICS[metric];
      return { type:'bar', data:{ labels:months.map(AU.trMonth), datasets:[{ label:M.short, data:series,
          backgroundColor: months.map(m=>(AU.META.partialMonths||[]).includes(m)?M.color+'73':M.color), borderRadius:5,
          datalabels:{ display:showLabels, anchor:'end', align:'top', color:M.color, font:{family:'Bricolage Grotesque',weight:700,size:11}, formatter:v=>fmtBy(metric,v) } }] },
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false}, datalabels:{display:showLabels},
            tooltip:{callbacks:{label:c=>M.short+': '+fmtBy(metric,c.parsed.y)}} },
          scales:{ x:{grid:{display:false},ticks:{color:th.tick,font:{size:11}}}, y:{grid:{color:th.grid},ticks:{color:th.tick,callback:v=>metric==='revenue'||metric==='aov'?AU.fmtTRY(v,{compact:true}):U.fmtNum(v)}} } },
        plugins: fi>=0 ? [{ id:'fm', afterDraw(ch){ const x=ch.scales.x.getPixelForValue(fi); const {top,bottom}=ch.chartArea; const c=ch.ctx;
          c.save(); c.strokeStyle='rgba(241,91,42,.55)'; c.lineWidth=1.5; c.setLineDash([5,4]); c.beginPath(); c.moveTo(x,top); c.lineTo(x,bottom); c.stroke();
          c.setLineDash([]); c.fillStyle='rgba(241,91,42,.9)'; c.font='600 10px Outfit,sans-serif'; c.fillText('llms.txt ✦',x+5,top+12); c.restore(); } }] : [] };
    };
    // movers
    const lastM=months[months.length-1], prevM=months[months.length-2];
    const lpLast=new Map(groupLP(allRows.filter(r=>r.ym===lastM)).map(x=>[x.lp,x]));
    const lpPrev=new Map(groupLP(allRows.filter(r=>r.ym===prevM)).map(x=>[x.lp,x]));
    const movers=[]; for (const k of new Set([...lpLast.keys(),...lpPrev.keys()])){ const a=(lpLast.get(k)||{}).sessions||0, b=(lpPrev.get(k)||{}).sessions||0; if(a+b<3)continue; movers.push({lp:k,cur:a,prev:b,diff:a-b,inLlms:(lpLast.get(k)||lpPrev.get(k)||{}).inLlms}); }
    const risers=[...movers].sort((x,y)=>y.diff-x.diff).slice(0,10), fallers=[...movers].sort((x,y)=>x.diff-y.diff).slice(0,10);
    const moverCols=[ {key:'lp',label:'Landing Page',get:r=>r.lp,sortable:false,render:lpCell},
      {key:'prev',label:AU.trMonth(prevM),align:'right',render:r=>U.fmtFull(r.prev)},
      {key:'cur',label:AU.trMonth(lastM),align:'right',render:r=>U.fmtFull(r.cur)},
      {key:'diff',label:'Δ Oturum',align:'right',render:r=>h('span',{className:AU.deltaClass(r.diff>0?1:r.diff<0?-1:null)},(r.diff>0?'+':'')+U.fmtFull(r.diff))} ];
    return h('div', null,
      h(ExportSection, { id:'sec-mom', title:'Aydan Aya (MoM) Değişim',
        desc:'Metrik seçilebilir; "Değerler" ile grafik üzerindeki sayılar açılır. Kesikli çizgi Şubat 2026 (llms.txt). Soluk bar kısmi ayı gösterir.',
        pngName:'ozdilekteyim-ai-mom',
        csv:{ rows:tableRows, name:'aylik-trend', headers:[{label:'Ay',get:r=>AU.trMonth(r.ym)},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Ciro',get:r=>Math.round(r.revenue)},{label:'Transaction',get:r=>Math.round(r.tx)},{label:'Oturum Δ%',get:r=>r.dSess==null?'':(r.dSess*100).toFixed(1)}] } },
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px',flexWrap:'wrap',gap:'8px'}},
          h(SegToggle,{options:[{key:'sessions',label:'Oturum'},{key:'revenue',label:'Ciro'},{key:'tx',label:'Transaction'}],value:metric,onChange:setMetric}),
          h('button',{className:'lbl-toggle'+(showLabels?' on':''),onClick:()=>setShowLabels(s=>!s)},(showLabels?'✓ ':'')+'Değerler')),
        h(ChartCanvas, { buildConfig:buildBar, deps:[metric,showLabels], height:300 }),
        h('div',{style:{marginTop:'14px'}}, h(DataTable,{ columns:[
          {key:'ym',label:'Ay',get:r=>r.ym,render:r=>AU.trMonth(r.ym),sortable:false},
          {key:'sessions',label:'Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
          {key:'revenue',label:'Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)},
          {key:'tx',label:'Transaction',align:'right',render:r=>U.fmtFull(r.tx)},
          {key:'dSess',label:'Oturum Δ%',align:'right',render:r=>r.dSess==null?'–':h('span',{className:AU.deltaClass(r.dSess)},U.fmtPct(r.dSess))} ], rows:tableRows, initialSort:{key:'ym',dir:'asc'} }))
      ),
      h('div', { className:'ai-grid-2' },
        h(ExportSection, { id:'sec-risers', title:'Yükselen Sayfalar', desc:AU.trMonth(prevM)+' → '+AU.trMonth(lastM)+' oturum artışı.', pngName:'ozdilekteyim-ai-yukselen' }, h(DataTable,{columns:moverCols,rows:risers,initialSort:{key:'diff',dir:'desc'}})),
        h(ExportSection, { id:'sec-fallers', title:'Gerileyen Sayfalar', desc:AU.trMonth(prevM)+' → '+AU.trMonth(lastM)+' oturum değişimi.', pngName:'ozdilekteyim-ai-gerileyen' }, h(DataTable,{columns:moverCols,rows:fallers,initialSort:{key:'diff',dir:'asc'}}))
      )
    );
  }

  // ============ 3. LANDING PAGE ============
  function LandingPages({rows, filters, setFilters, selectedLp, setSelectedLp}) {
    const [metric, setMetric] = useState('sessions');
    const filtered = useMemo(()=>AU.applyFilters(rows, filters), [rows, filters]);
    const data = useMemo(()=>groupLP(filtered), [filtered]);
    const chartRows = selectedLp ? AU.ROWS.filter(r=>r.lp===selectedLp) : filtered;
    const cols = [
      {key:'lp', label:'Landing Page', get:r=>r.lp, sortable:false, render:lpCell},
      {key:'brand', label:'Marka', get:r=>r.brand||'', render:r=>r.brand?h('span',{className:'pill',style:{fontSize:'11px'}},r.brand):h('span',{style:{color:'var(--ink-3)'}},'–')},
      {key:'ptype', label:'Tip', get:r=>r.ptype, render:r=>h('span',{className:'pill',style:{fontSize:'11px'}},r.ptype)},
      {key:'sessions', label:'Oturum', align:'right', render:r=>U.fmtFull(r.sessions)},
      {key:'revenue', label:'Ciro', align:'right', render:r=>AU.fmtTRY(r.revenue)},
      {key:'tx', label:'Transaction', align:'right', render:r=>U.fmtFull(r.tx)},
      {key:'cr', label:'CR', align:'right', render:r=>U.fmtPct(r.cr,2)},
    ];
    const csvHeaders=[{label:'Landing Page',get:r=>r.lp},{label:'Marka',get:r=>r.brand||''},{label:'Tip',get:r=>r.ptype},{label:'llms.txt',get:r=>r.inLlms?'Evet':'Hayır'},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Ciro',get:r=>Math.round(r.revenue)},{label:'Transaction',get:r=>Math.round(r.tx)}];
    const set=(patch)=>setFilters(f=>({...f, ...patch}));
    const hasF = filters.search || filters.ptypes.length || filters.brands.length;
    return h('div', null,
      h('div',{className:'filter-row'},
        h(SearchInput,{value:filters.search, onChange:v=>set({search:v}), placeholder:'Landing page veya marka ara…'}),
        h(MultiSelect,{label:'tip', options:AU.ALL_PTYPES, selected:filters.ptypes, onChange:v=>set({ptypes:v}), colorMap:PTYPE_COLORS, width:170}),
        h(MultiSelect,{label:'marka', options:AU.ALL_BRANDS, selected:filters.brands, onChange:v=>set({brands:v}), width:190}),
        h('div',{style:{flex:1}}),
        h(SegToggle,{options:[{key:'sessions',label:'Oturum'},{key:'revenue',label:'Ciro'},{key:'tx',label:'Transaction'}],value:metric,onChange:setMetric})
      ),
      hasF ? h('div',{className:'active-filter-chips'},
        filters.ptypes.map(p=>h('span',{key:'p'+p,className:'afc',onClick:()=>set({ptypes:filters.ptypes.filter(x=>x!==p)})},'Tip: '+p,h('span',{className:'x'},'×'))),
        filters.brands.map(b=>h('span',{key:'b'+b,className:'afc',onClick:()=>set({brands:filters.brands.filter(x=>x!==b)})},'Marka: '+b,h('span',{className:'x'},'×'))),
        filters.search?h('span',{className:'afc',onClick:()=>set({search:''})},'Arama: '+filters.search,h('span',{className:'x'},'×')):null,
        h('button',{className:'chip-btn',onClick:()=>setFilters({ptypes:[],brands:[],search:''})},'× Tümünü temizle')
      ) : null,
      h(ExportSection, { id:'sec-lp-chart',
        title: selectedLp ? ('Sayfa akışı · '+AU.lpLabel(selectedLp)) : 'Filtrelenmiş set · aylık akış',
        desc: selectedLp ? 'Seçili sayfanın tüm aylardaki metrik akışı. Tabloda tekrar tıklayarak set görünümüne dönülür.' : 'Aşağıdaki filtre/aramaya göre dinamik. Tablodan bir satıra tıklayınca o sayfanın akışı gösterilir.',
        pngName:'ozdilekteyim-ai-lp-akis' },
        selectedLp ? h('div',{style:{marginBottom:'8px'}}, h('button',{className:'chip-btn',onClick:()=>setSelectedLp(null)},'← Set görünümüne dön')) : null,
        h(MetricChart, { rows:chartRows, defaultMetrics:['sessions','revenue'], height:300 })
      ),
      h(ExportSection, { id:'sec-lp', title:'Landing Page Tablosu — '+AU.METRICS[metric].short,
        desc:'Bir satıra tıklayınca üstteki grafik o sayfanın akışına döner. ✦ llms işareti llms.txt sayfalarını gösterir. '+data.length+' sayfa.',
        pngName:'ozdilekteyim-ai-landing-page', csv:{rows:[...data].sort((a,b)=>b[metric]-a[metric]),headers:csvHeaders,name:'landing-pages'} },
        h(DataTable, { columns:cols, rows:data, initialSort:{key:metric,dir:'desc'}, maxRows:50,
          onRowClick:r=>setSelectedLp(selectedLp===r.lp?null:r.lp), activeKey:selectedLp, keyOf:r=>r.lp })
      )
    );
  }

  // ============ 4. SAYFA TİPİ ============
  function PageTypes({rows, navTo}) {
    const [metric, setMetric] = useState('sessions');
    const groups = useMemo(()=>AU.groupBy(rows,r=>r.ptype).sort((a,b)=>b[metric]-a[metric]), [rows, metric]);
    const total = groups.reduce((s,g)=>s+g[metric],0)||1;
    const go = pt => navTo('lp', {ptypes:[pt]});
    const cols=[
      {key:'key',label:'Sayfa Tipi',get:r=>r.key,sortable:false,render:r=>h('span',null,h('span',{style:{display:'inline-block',width:'10px',height:'10px',borderRadius:'3px',background:PTYPE_COLORS[r.key]||'#999',marginRight:'7px'}}),r.key)},
      {key:'n',label:'Sayfa',align:'right',render:r=>U.fmtFull(r.n)},
      {key:'sessions',label:'Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
      {key:'revenue',label:'Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)},
      {key:'tx',label:'Transaction',align:'right',render:r=>U.fmtFull(r.tx)},
      {key:'cr',label:'CR',align:'right',render:r=>U.fmtPct(r.cr,2)},
    ];
    return h('div', null,
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',flexWrap:'wrap',gap:'8px'}},
        h('div',{style:{fontSize:'12.5px',color:'var(--ink-3)'}},'Sayfa tipine tıklayınca Landing Page sekmesinde o tip filtrelenir.'),
        h(SegToggle,{options:[{key:'sessions',label:'Oturum'},{key:'revenue',label:'Ciro'},{key:'tx',label:'Transaction'}],value:metric,onChange:setMetric})),
      h('div',{className:'ai-grid-2'},
        h(ExportSection,{id:'sec-ptype-donut',title:'Sayfa Tipi Dağılımı — '+AU.METRICS[metric].short,desc:'Seçili aylara göre dinamik.',pngName:'ozdilekteyim-ai-sayfa-tipi-donut'},
          h(Donut,{groups, metric, colors:PTYPE_COLORS, height:300})),
        h(ExportSection,{id:'sec-ptype-bar',title:AU.METRICS[metric].short+' Payı',desc:'Renkli bölüme tıklayarak ilgili tipi Landing Page sekmesinde açabilirsiniz.',pngName:'ozdilekteyim-ai-sayfa-tipi-pay'},
          h('div',{className:'ai-ptype-bar'}, groups.map(g=>h('span',{key:g.key,className:'clickable-pt',title:g.key+': '+(g[metric]/total*100).toFixed(1)+'% — tıkla',style:{width:(g[metric]/total*100)+'%',background:PTYPE_COLORS[g.key]||'#999'},onClick:()=>go(g.key)}))),
          h('div',{style:{marginTop:'14px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}, groups.map(g=>h('button',{key:g.key,className:'clickable-pt',onClick:()=>go(g.key),
            style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'8px',fontSize:'12.5px',color:'var(--ink-2)',background:'var(--bg-card)',border:'1px solid var(--line)',borderRadius:'8px',padding:'7px 11px',cursor:'pointer'}},
            h('span',null,h('span',{style:{display:'inline-block',width:'9px',height:'9px',borderRadius:'2px',background:PTYPE_COLORS[g.key]||'#999',marginRight:'6px'}}),g.key),
            h('span',{style:{fontFamily:'Bricolage Grotesque',fontWeight:700,color:'var(--ink)'}},(g[metric]/total*100).toFixed(1)+'%'))))
        )
      ),
      h(ExportSection,{id:'sec-ptype-tbl',title:'Sayfa Tipi Tablosu',desc:'Bir satıra tıklayınca o tip Landing Page sekmesinde filtrelenir.',pngName:'ozdilekteyim-ai-sayfa-tipi-tablo',
        csv:{rows:groups,name:'sayfa-tipi',headers:[{label:'Tip',get:r=>r.key},{label:'Sayfa',get:r=>r.n},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Ciro',get:r=>Math.round(r.revenue)},{label:'Transaction',get:r=>Math.round(r.tx)}]}},
        h(DataTable,{columns:cols,rows:groups,initialSort:{key:metric,dir:'desc'},onRowClick:r=>go(r.key),keyOf:r=>r.key})
      )
    );
  }

  // ============ 5. MARKA & ÜRÜN ============
  function BrandProduct({rows}) {
    const [metric, setMetric] = useState('sessions');
    const [sel, setSel] = useState([]);
    const brandRows = useMemo(()=>AU.groupBy(rows.filter(r=>r.brand),r=>r.brand), [rows]);
    const top = useMemo(()=>[...brandRows].sort((a,b)=>b[metric]-a[metric]).slice(0,14), [brandRows, metric]);
    const selSet = sel.length?new Set(sel):null;
    const lpRows = useMemo(()=>groupLP(rows.filter(r=>r.brand && (!selSet||selSet.has(r.brand)))), [rows, sel]);
    const buildBar=()=>{ const th=chartTheme();
      return { type:'bar', data:{labels:top.map(b=>b.key),datasets:[{label:AU.METRICS[metric].short,data:top.map(b=>b[metric]),
        backgroundColor:top.map(b=>selSet&&selSet.has(b.key)?'#E85F36':(selSet?'#F15B2A66':'#F15B2A')),borderRadius:5}]},
        options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,onClick:(e,els)=>{ if(els.length){ const k=top[els[0].index].key; setSel(s=>s.includes(k)?s.filter(x=>x!==k):[...s,k]); } },
          plugins:{legend:{display:false},datalabels:{display:false},tooltip:{callbacks:{label:c=>fmtBy(metric,c.parsed.x)}}},
          scales:{x:{grid:{color:th.grid},ticks:{color:th.tick,callback:v=>metric==='revenue'||metric==='aov'?AU.fmtTRY(v,{compact:true}):U.fmtNum(v)}},y:{grid:{display:false},ticks:{color:th.ink,font:{size:11}}}}} };
    };
    const lpCols=[ {key:'lp',label:'Landing Page',get:r=>r.lp,sortable:false,render:lpCell},
      {key:'brand',label:'Marka',get:r=>r.brand||'',render:r=>h('span',{className:'pill',style:{fontSize:'11px'}},r.brand)},
      {key:'sessions',label:'Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
      {key:'revenue',label:'Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)},
      {key:'tx',label:'Transaction',align:'right',render:r=>U.fmtFull(r.tx)},
      {key:'cr',label:'CR',align:'right',render:r=>U.fmtPct(r.cr,2)} ];
    return h('div', null,
      h('div',{className:'scope-note'},'Marka çıkarımı ', h('code',null,'/magaza/marka/'),' path\'i ve ürün slug sözlüğü ile yapılır. Grafikten bir markaya tıklayarak alttaki tabloyu ve seçimi filtreleyebilirsiniz.'),
      h('div',{className:'filter-row'},
        h(MultiSelect,{label:'marka',options:AU.ALL_BRANDS,selected:sel,onChange:setSel,width:200}),
        sel.length?h('button',{className:'chip-btn',onClick:()=>setSel([])},'× Temizle ('+sel.length+')'):null,
        h('div',{style:{flex:1}}),
        h(SegToggle,{options:[{key:'sessions',label:'Oturum'},{key:'revenue',label:'Ciro'},{key:'tx',label:'Transaction'}],value:metric,onChange:setMetric})),
      h(ExportSection,{id:'sec-brand-bar',title:'Top Markalar — '+AU.METRICS[metric].short,desc:'Bir markaya tıklayınca seçilir; alttaki LP tablosu ve seçim ona göre filtrelenir.',pngName:'ozdilekteyim-ai-marka'},
        brandRows.length? h(ChartCanvas,{buildConfig:buildBar,deps:[metric,sel,rows],height:Math.max(220,top.length*30+50)}) : h('div',{style:{color:'var(--ink-3)',padding:'20px 0'}},'Seçili dönemde marka ataması yapılabilen sayfa bulunmuyor.')),
      h(ExportSection,{id:'sec-brand-lp',title:'Marka Sayfaları' + (sel.length?(' · '+sel.join(', ')):' (tümü)'),desc:'Seçili markalara ait landing page\'ler, tüm metriklerle. '+lpRows.length+' sayfa.',pngName:'ozdilekteyim-ai-marka-lp',
        csv:{rows:[...lpRows].sort((a,b)=>b[metric]-a[metric]),name:'marka-landing-pages',headers:[{label:'Landing Page',get:r=>r.lp},{label:'Marka',get:r=>r.brand},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Ciro',get:r=>Math.round(r.revenue)},{label:'Transaction',get:r=>Math.round(r.tx)}]}},
        lpRows.length? h(DataTable,{columns:lpCols,rows:lpRows,initialSort:{key:metric,dir:'desc'},maxRows:50}) : h('div',{style:{color:'var(--ink-3)'}},'Veri yok.'))
    );
  }

  // ============ 6. DÖNÜŞMEYEN ============
  function NoConvert({rows}) {
    const data = useMemo(()=>groupLP(rows).filter(x=>x.ptype!=='Sepet/Checkout' && x.ptype!=='Hesap' && x.sessions>=5 && x.tx===0).sort((a,b)=>b.sessions-a.sessions).slice(0,30), [rows]);
    const topBar = data.slice(0,12);
    const buildBar=()=>{ const th=chartTheme();
      return { type:'bar', data:{labels:topBar.map(x=>AU.lpLabel(x.lp).slice(0,32)),datasets:[{label:'Oturum',data:topBar.map(x=>x.sessions),backgroundColor:topBar.map(x=>PTYPE_COLORS[x.ptype]||'#F15B2A'),borderRadius:5,
        datalabels:{display:false}}]},
        options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},datalabels:{display:false},tooltip:{callbacks:{label:c=>'Oturum: '+U.fmtFull(c.parsed.x)+' · transaction: 0'}}},
          scales:{x:{grid:{color:th.grid},ticks:{color:th.tick}},y:{grid:{display:false},ticks:{color:th.ink,font:{size:10.5}}}}} };
    };
    const cols=[ {key:'lp',label:'Landing Page',get:r=>r.lp,sortable:false,render:lpCell},
      {key:'ptype',label:'Tip',get:r=>r.ptype,render:r=>h('span',{className:'pill',style:{fontSize:'11px'}},r.ptype)},
      {key:'sessions',label:'Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
      {key:'tx',label:'Transaction',align:'right',render:r=>U.fmtFull(r.tx)},
      {key:'revenue',label:'Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)} ];
    return h('div', null,
      h('div',{className:'insight-strip',style:{marginBottom:'16px'}},h('span',{className:'arrow'},'➜'),
        h('span',null,'Aşağıdaki sayfalar seçili dönemde belirgin ',h(Term,{t:'session'},'AI oturumu'),' almış fakat henüz ',h(Term,{t:'transaction'},'transaction'),' ile sonuçlanmamıştır; içerik ve dönüşüm akışının gözden geçirilmesiyle değerlendirilebilir fırsat alanı sunmaktadır.')),
      h(ExportSection,{id:'sec-noconv-bar',title:'En Yüksek Oturumlu Dönüşmeyen Sayfalar',desc:'Oturum ≥ 5 ve transaction = 0. Renk sayfa tipini gösterir.',pngName:'ozdilekteyim-ai-donusmeyen-bar'},
        data.length? h(ChartCanvas,{buildConfig:buildBar,deps:[rows],height:Math.max(220,topBar.length*28+50)}) : h('div',{style:{color:'var(--ink-3)'}},'Kriterlere uyan sayfa yok.')),
      h(ExportSection,{id:'sec-noconv',title:'Dönüşmeyen Sayfalar Tablosu',desc:'Oturuma göre sıralı ilk 30 sayfa.',pngName:'ozdilekteyim-ai-donusmeyen',
        csv:{rows:data,name:'donusmeyen-sayfalar',headers:[{label:'Landing Page',get:r=>r.lp},{label:'Tip',get:r=>r.ptype},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Transaction',get:r=>r.tx},{label:'llms.txt',get:r=>r.inLlms?'Evet':'Hayır'}]}},
        data.length? h(DataTable,{columns:cols,rows:data,initialSort:{key:'sessions',dir:'desc'}}) : h('div',{style:{color:'var(--ink-3)'}},'Kriterlere uyan sayfa yok.'))
    );
  }

  // ============ 7. llms.txt ETKİSİ ============
  function LlmsImpact({allRows}) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState([]); // 'Marka' | 'Kategori'
    const months = AU.MONTHS, fi = months.indexOf(AU.META.llmsAddedMonth);
    const llmsRows = allRows.filter(r=>r.inLlms), otherRows = allRows.filter(r=>!r.inLlms);
    const llmsSeries=AU.monthlySeries(llmsRows,'sessions'), otherSeries=AU.monthlySeries(otherRows,'sessions');
    const sum=(a,x,y)=>a.slice(x,y).reduce((s,v)=>s+v,0);
    const preL=sum(llmsSeries,0,fi),postL=sum(llmsSeries,fi,months.length),preO=sum(otherSeries,0,fi),postO=sum(otherSeries,fi,months.length);
    const buildLine=()=>{ const th=chartTheme();
      return { type:'line', data:{labels:months.map(AU.trMonth),datasets:[
        {label:'llms.txt sayfaları',data:llmsSeries,borderColor:'#F15B2A',backgroundColor:'#F15B2A22',borderWidth:2.5,tension:.3,pointRadius:3,fill:true,datalabels:{display:false}},
        {label:'Diğer sayfalar',data:otherSeries,borderColor:'#1565C0',backgroundColor:'transparent',borderWidth:2,borderDash:[4,3],tension:.3,pointRadius:2,yAxisID:'y2',datalabels:{display:false}} ]},
        options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
          plugins:{legend:{position:'top',labels:{color:th.ink,font:{size:11},boxWidth:14}},datalabels:{display:false},tooltip:{callbacks:{label:c=>c.dataset.label+': '+U.fmtFull(c.parsed.y)}}},
          scales:{x:{grid:{color:th.grid},ticks:{color:th.tick,font:{size:11}}},
            y:{position:'left',grid:{color:th.grid},ticks:{color:'#F15B2A'},title:{display:true,text:'llms.txt oturum',color:'#F15B2A',font:{size:10}}},
            y2:{position:'right',grid:{display:false},ticks:{color:'#1565C0'},title:{display:true,text:'diğer oturum',color:'#1565C0',font:{size:10}}}}},
        plugins: fi>=0?[{id:'fm',afterDraw(ch){const x=ch.scales.x.getPixelForValue(fi);const{top,bottom}=ch.chartArea;const c=ch.ctx;c.save();c.strokeStyle='rgba(241,91,42,.55)';c.lineWidth=1.5;c.setLineDash([5,4]);c.beginPath();c.moveTo(x,top);c.lineTo(x,bottom);c.stroke();c.setLineDash([]);c.fillStyle='rgba(241,91,42,.9)';c.font='600 10px Outfit,sans-serif';c.fillText('llms.txt ✦',x+5,top+12);c.restore();}}]:[] };
    };
    // llms sayfaları + kategori/marka→ürün keşfi (marka-temelli, breadcrumb ile doğrulanmış)
    const disc = useMemo(()=>{
      const pages = groupLP(llmsRows);
      const relLpAll = new Set();
      const out = pages.map(p=>{
        const info = AU.llmsTokens(p.lp);
        const rel = AU.relatedProductRows(allRows, p.lp, p.brand);
        const relSess = rel.reduce((s,r)=>s+r.sessions,0);
        const relCount = new Set(rel.map(r=>r.lp)).size;
        for (const r of rel) relLpAll.add(r.lp);
        return { ...p, llmsType:info.type, relSess, relCount };
      });
      const uniqTotal = allRows.filter(r=>r.ptype==='Ürün' && relLpAll.has(r.lp)).reduce((s,r)=>s+r.sessions,0);
      return { pages:out, uniqTotal };
    }, []);
    const discovery = disc.pages;
    const filtered = useMemo(()=>{
      let d = discovery;
      if (typeFilter.length){ const s=new Set(typeFilter); d=d.filter(x=>s.has(x.llmsType)); }
      if (search.trim()){ const q=search.trim().toLowerCase(); d=d.filter(x=>x.lp.toLowerCase().includes(q)); }
      return d;
    }, [discovery, typeFilter, search]);
    const cols=[
      {key:'lp',label:'llms.txt Sayfası',get:r=>r.lp,sortable:false,render:r=>h('span',{className:'lp-cell'},h('a',{href:AU.lpUrl(r.lp),target:'_blank'},AU.lpLabel(r.lp)),h(LlmsBadge))},
      {key:'llmsType',label:'Tür',get:r=>r.llmsType,render:r=>h('span',{className:'pill',style:{fontSize:'11px'}},r.llmsType)},
      {key:'sessions',label:'Direkt Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
      {key:'relSess',label:'İlişkili Ürün Oturumu',align:'right',render:r=>U.fmtFull(r.relSess)},
      {key:'relCount',label:'İlişkili Ürün Sayısı',align:'right',render:r=>U.fmtFull(r.relCount)},
      {key:'revenue',label:'Direkt Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)},
    ];
    const totalRel = disc.uniqTotal;
    return h('div', null,
      h('div',{className:'scope-note'},
        h(Term,{t:'llms.txt'},'llms.txt'),' dosyası ',h('strong',null,'Şubat 2026'),'\'da eklenmiştir; "Önemli Sayfalar" altında ',h('strong',null,AU.META.llmsPathCount+' sayfa'),' tanımlıdır, bunlardan ',h('strong',null,AU.META.llmsInData+' tanesi'),' AI trafiği verisinde gözlemlenmektedir. ',
        'Bu sayfalar ağırlıkla kategori/marka niteliğinde olduğundan, aşağıda hem doğrudan oturum hem de ',h('strong',null,'bu kategori/markalardaki ürünlere gelen ilişkili trafik (keşif)'),' birlikte sunulmaktadır. İlişkili eşleştirme ağırlıkla ',h('strong',null,'marka temellidir'),' (ör. llms.txt\'deki Adidas filtreli sayfa → AI trafiği alan Adidas ürün sayfaları); bağlılık örnek sayfalarda ',h('strong',null,'breadcrumb ile teyit edilmiştir'),'. Toplam değer örtüşmesiz (benzersiz ürün) hesaplanır.'),
      h(KpiStrip,{cols:4, items:[
        {label:'llms.txt · Şubat öncesi',value:U.fmtFull(preL),color:'#F15B2A',sub:'doğrudan oturum'},
        {label:'llms.txt · Şubat ve sonrası',value:U.fmtFull(postL),color:'#F15B2A',sub:'doğrudan oturum'},
        {label:'İlişkili ürün keşfi',value:U.fmtFull(totalRel),color:'#2E7D32',sub:'marka/kategori ürün oturumu (örtüşmesiz)'},
        {label:'Diğer · Şubat sonrası',value:U.fmtFull(postO),color:'#1565C0',sub:'llms.txt dışı oturum'},
      ]}),
      h(ExportSection,{id:'sec-llms-chart',title:'llms.txt Sayfaları vs Diğer — Aylık Oturum',desc:'Çift eksen: sol llms.txt sayfaları, sağ diğer sayfalar. Kesikli çizgi Şubat 2026 (llms.txt eklendi).',pngName:'ozdilekteyim-ai-llms-etki'},
        h(ChartCanvas,{buildConfig:buildLine,deps:[],height:340})),
      h('div',{className:'insight-strip',style:{margin:'4px 0 16px'}},h('span',{className:'arrow'},'➜'),
        h('span',null,'llms.txt sayfalarının doğrudan oturumu sınırlı seyretse de, bu marka ve kategorilerin ürün sayfalarına gelen ',h('strong',null,'ilişkili trafik '+U.fmtFull(totalRel)+' oturum (örtüşmesiz)'),' düzeyindedir; kullanıcıların kategori sayfası yerine doğrudan ilgili ürün sayfalarına ulaşmış olabileceği değerlendirilebilir.')),
      h('div',{className:'filter-row'},
        h(SearchInput,{value:search,onChange:setSearch,placeholder:'llms.txt sayfası ara…'}),
        h(MultiSelect,{label:'tür',options:['Marka','Kategori'],selected:typeFilter,onChange:setTypeFilter,width:160})),
      h(ExportSection,{id:'sec-llms-tbl',title:'llms.txt Sayfaları ve Ürün Keşfi',desc:'Her llms.txt sayfasının doğrudan oturumu ve ilgili kategori/markadaki ürünlere gelen ilişkili oturum. '+filtered.length+' sayfa.',pngName:'ozdilekteyim-ai-llms-tablo',
        csv:{rows:filtered,name:'llms-kesif',headers:[{label:'Sayfa',get:r=>r.lp},{label:'Tür',get:r=>r.llmsType},{label:'Direkt Oturum',get:r=>Math.round(r.sessions)},{label:'İlişkili Ürün Oturumu',get:r=>Math.round(r.relSess)},{label:'İlişkili Ürün Sayısı',get:r=>r.relCount},{label:'Direkt Ciro',get:r=>Math.round(r.revenue)}]}},
        filtered.length? h(DataTable,{columns:cols,rows:filtered,initialSort:{key:'relSess',dir:'desc'}}) : h('div',{style:{color:'var(--ink-3)'}},'Eşleşen llms.txt sayfası bulunmuyor.'))
    );
  }

  window.TABS = { Ozet, Trend, LandingPages, PageTypes, BrandProduct, NoConvert, LlmsImpact };
})();
