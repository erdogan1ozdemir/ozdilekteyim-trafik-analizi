// tabs.jsx — AI trafik raporu alt sekmeleri (window.TABS)
(function(){
  const h = React.createElement;
  const { useState, useRef, useMemo } = React;
  const U = window.U, AU = window.AU, C = window.COMP;
  const { Section, PngButton, CsvButton, LlmsBadge, KpiStrip, MetricChart, Donut, BrandDonut, DataTable, SegToggle,
          ChartCanvas, chartTheme, Term, MultiSelect, SearchInput, SummaryCard, FilterBar, Modal, NoteCard, HeatTable } = C;

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
  const brandCol = {key:'brand', label:'Marka', get:r=>r.brand||'', render:r=>r.brand?h('span',{className:'pill',style:{fontSize:'11px'}},r.brand):h('span',{style:{color:'var(--ink-3)'}},'–')};
  const fmtBy = (m,v)=>AU.METRICS[m].fmt(v);
  const metricSeg = (metric,setMetric)=>h(SegToggle,{options:[{key:'sessions',label:'Oturum'},{key:'revenue',label:'Ciro'},{key:'tx',label:'Transaction'}],value:metric,onChange:setMetric});

  // marka × ay ısı haritası satırları
  function brandHeatRows(allRows, metric, opts){
    opts=opts||{}; const months=AU.MONTHS;
    const totals=AU.groupBy(allRows.filter(r=>r.brand), r=>r.brand);
    const rise=AU.momentum(allRows, r=>r.brand); const dMap=new Map(rise.map(x=>[x.key,x.diff]));
    const series=new Map(totals.map(b=>[b.key, new Array(months.length).fill(0)]));
    for(const r of allRows){ if(r.brand && series.has(r.brand)){ const i=months.indexOf(r.ym); if(i>=0) series.get(r.brand)[i]+=r[metric]; } }
    let arr=totals.map(b=>({label:b.key, key:b.key, values:series.get(b.key), diff:dMap.get(b.key)||0, total:b[metric]}));
    arr.sort((a,b)=> opts.sortBy==='diff' ? b.diff-a.diff : b.total-a.total);
    if(opts.onlyRising) arr=arr.filter(x=>x.diff>0);
    return opts.limit ? arr.slice(0,opts.limit) : arr;
  }

  // marka detay modalı: aylık çoklu-metrik akış + marka LP tablosu
  function BrandModalView({brand, allRows, onClose}){
    const rows=allRows.filter(r=>r.brand===brand);
    const t=AU.totals(rows);
    const lps=groupLP(rows).sort((a,b)=>b.sessions-a.sessions).slice(0,12);
    const cols=[ {key:'lp',label:'Sayfa',get:r=>r.lp,sortable:false,render:lpCell},
      {key:'sessions',label:'Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
      {key:'revenue',label:'Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)},
      {key:'tx',label:'Tx',align:'right',render:r=>U.fmtFull(r.tx)} ];
    return h(Modal, { title:brand+' · marka detayı', onClose, width:880 },
      h(KpiStrip, { cols:4, items:[
        {label:'Oturum', value:U.fmtFull(t.sessions), color:AU.METRICS.sessions.color},
        {label:'Ciro', value:AU.fmtTRY(t.revenue), color:AU.METRICS.revenue.color},
        {label:'Transaction', value:U.fmtFull(t.tx), color:AU.METRICS.tx.color},
        {label:'AI trafikli sayfa', value:U.fmtFull(new Set(rows.map(r=>r.lp)).size), color:'#8E24AA'} ]}),
      h('div',{style:{fontSize:'12.5px',fontWeight:700,color:'var(--ink-2)',margin:'6px 0 4px'}},'Aylık akış'),
      h(MetricChart, { rows, defaultMetrics:['sessions','revenue'], height:260 }),
      h('div',{style:{fontSize:'12.5px',fontWeight:700,color:'var(--ink-2)',margin:'14px 0 6px'}},'Bu markanın en çok trafik alan sayfaları'),
      h(DataTable, { columns:cols, rows:lps, initialSort:{key:'sessions',dir:'desc'} })
    );
  }

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
    // bölüm özetleri — kendi filtresine (arama/tip/marka) göre; ilk 5 görünür, 15'e kadar scroll
    const [filters, setFilters] = useState({ search:'', ptypes:[], brands:[] });
    const frows = useMemo(()=>AU.applyFilters(rows, filters), [rows, filters]);
    const N = 15;
    const lpTop = groupLP(frows).sort((a,b)=>b.sessions-a.sessions).slice(0,N);
    const ptTop = AU.groupBy(frows,r=>r.ptype).sort((a,b)=>b.sessions-a.sessions).slice(0,N);
    const brAll = AU.groupBy(frows.filter(r=>r.brand),r=>r.brand); const brTop=[...brAll].sort((a,b)=>b.sessions-a.sessions).slice(0,N);
    const brTot = brAll.reduce((a,g)=>({sessions:a.sessions+g.sessions,revenue:a.revenue+g.revenue,tx:a.tx+g.tx}),{sessions:0,revenue:0,tx:0});
    const ftot = AU.totals(frows);
    const firsat = groupLP(frows).filter(x=>x.tx===0 && x.ptype!=='Sepet/Checkout' && x.ptype!=='Hesap' && x.sessions>=5).sort((a,b)=>b.sessions-a.sessions);
    const fTot = firsat.reduce((a,g)=>({sessions:a.sessions+g.sessions,revenue:a.revenue+g.revenue,tx:a.tx+g.tx}),{sessions:0,revenue:0,tx:0});
    const llmsTop = groupLP(frows.filter(r=>r.inLlms)).sort((a,b)=>b.sessions-a.sessions).slice(0,N);
    const llmsT = AU.totals(frows.filter(r=>r.inLlms));
    const mk = (g)=>({nm:g.key||AU.lpLabel(g.lp), sessions:g.sessions, revenue:g.revenue, tx:g.tx});

    // aylık yükselen markalar (ısı haritası)
    const months = AU.MONTHS;
    const [modalBrand, setModalBrand] = useState(null);
    const monthlyRisers = useMemo(()=>brandHeatRows(allRows,'sessions',{sortBy:'diff', onlyRising:true, limit:10}), []);

    return h('div', null,
      h(KpiStrip, { items:kpis, cols:5 }),
      h('div', { className:'insight-strip', style:{marginBottom:'18px'} }, h('span',{className:'arrow'},'➜'),
        h('span', null, 'Seçili dönemde ', h(Term,{t:'referral'},'AI (ChatGPT) referral'), ' trafiği ',
          h('strong',null,U.fmtFull(t.sessions)+' '), h(Term,{t:'session'},'oturum'), ' ve ', h('strong',null,AU.fmtTRY(t.revenue)),
          ' ciro düzeyindedir. ', h('strong',null,'Kasım 2025'), ' alışveriş kampanya dönemiyle (Efsane Cuma) güçlü bir başlangıç oluşturmuş; sonraki aylarda trafik kademeli olarak yeniden Kasım seviyelerine yaklaşmış, ',
          h('strong',null,AU.trMonth(peak)), ' ayında bayram dönemi etkisiyle Kasım\'ı da aşmıştır.')),
      h(ExportSection, { id:'sec-trend', title:'Aylık AI Trafik Eğrisi',
        desc:'Metrikleri üstteki etiketlerden açıp kapatabilir, "Değerler" ile grafik üzerinde sayıları gösterebilirsiniz. Oturum, ciro ve transaction aynı anda izlenebilir.',
        pngName:'ozdilekteyim-ai-aylik-egri' },
        h(MetricChart, { rows:allRows, defaultMetrics:['sessions','revenue'] }),
        h('div', { className:'scope-note' }, 'Kapsam: yapay zeka kaynaklı referral trafiği, ', h('strong',null,'ağırlıkla chatgpt.com'),
          ' (az miktarda Perplexity ve Copilot dahil). Tutarlar ', h('strong',null,'₺'), ' cinsindendir. ',
          (AU.META.partialMonths||[]).length? ('İşaretli ay(lar) (*) kısmi dönem içerir: '+AU.META.partialMonths.map(AU.trMonth).join(', ')+'.'):'')
      ),
      h('div', { style:{margin:'2px 0 12px'} }, h(FilterBar, { filters, setFilters })),
      h('div', { style:{margin:'4px 0 14px', fontSize:'13px', fontWeight:700, color:'var(--ink-2)'} }, 'Bölüm özetleri',
        h('span',{style:{fontWeight:500,color:'var(--ink-3)',fontSize:'12px',marginLeft:'8px'}},'· her kart 15 satıra kadar, kaydırılabilir')),
      h('div', { className:'summary-grid' },
        h(SummaryCard, { title:'Landing Page', goLabel:'Landing Page', onGo:()=>navTo('lp'), totals:ftot, rows:lpTop.map(mk) }),
        h(SummaryCard, { title:'Sayfa Tipi', goLabel:'Sayfa Tipi', onGo:()=>navTo('ptype'), totals:ftot, rows:ptTop.map(mk) }),
        h(SummaryCard, { title:'Marka & Ürün', goLabel:'Marka & Ürün', onGo:()=>navTo('brand'), totals:brTot, rows:brTop.map(mk) }),
        h(SummaryCard, { title:'Dönüşüm Fırsatı', goLabel:'Dönüşüm Fırsatı', onGo:()=>navTo('noconv'), totals:fTot, rows:firsat.slice(0,N).map(mk) }),
        h(SummaryCard, { title:'llms.txt sayfaları', goLabel:'llms.txt Etkisi', onGo:()=>navTo('llms'), totals:{sessions:llmsT.sessions,revenue:llmsT.revenue,tx:llmsT.tx}, rows:llmsTop.map(mk) })
      ),
      // aylık yükselen markalar — ısı haritası (tıklanır)
      h(ExportSection, { id:'sec-rise', title:'Zaman İçinde Yükselen Markalar — Marka Sezon Takvimi',
        desc:'Dönem genelinde oturum artışı en yüksek 10 marka; her ay için oturum yoğunluğu ısı tonuyla gösterilir (kırmızı düşük → yeşil yüksek). Δ, dönemin ilk yarısı ile ikinci yarısı farkıdır. Bir markaya tıklayarak detayını açabilirsiniz.',
        pngName:'ozdilekteyim-ai-yukselen-aylik',
        csv:{ rows:monthlyRisers, name:'yukselen-markalar-aylik', headers:[{label:'Marka',get:r=>r.label}].concat(months.map((m,i)=>({label:AU.trMonth(m),get:r=>Math.round(r.values[i])}))).concat([{label:'Δ',get:r=>Math.round(r.diff)}]) } },
        h(C.HeatTable, { rows:monthlyRisers, months, deltaKey:'diff', deltaLabel:'Δ', onRowClick:r=>setModalBrand(r.key) })
      ),
      modalBrand ? h(BrandModalView, { brand:modalBrand, allRows, onClose:()=>setModalBrand(null) }) : null
    );
  }

  // ============ 2. AYLIK TREND ============
  function Trend({rows, allRows}) {
    const months = AU.MONTHS;
    const sessAll=AU.monthlySeries(allRows,'sessions'), revAll=AU.monthlySeries(allRows,'revenue'), txAll=AU.monthlySeries(allRows,'tx');
    const tableRows = months.map((m,i)=>({ ym:m, sessions:sessAll[i], revenue:revAll[i], tx:txAll[i], dSess:i>0?AU.deltaPct(sessAll[i],sessAll[i-1]):null }));
    const lastM=months[months.length-1], prevM=months[months.length-2];
    const lpLast=new Map(groupLP(allRows.filter(r=>r.ym===lastM)).map(x=>[x.lp,x]));
    const lpPrev=new Map(groupLP(allRows.filter(r=>r.ym===prevM)).map(x=>[x.lp,x]));
    const movers=[]; for (const k of new Set([...lpLast.keys(),...lpPrev.keys()])){ const a=(lpLast.get(k)||{}).sessions||0,b=(lpPrev.get(k)||{}).sessions||0; if(a+b<3)continue; movers.push({lp:k,cur:a,prev:b,diff:a-b,inLlms:(lpLast.get(k)||lpPrev.get(k)||{}).inLlms}); }
    const risers=[...movers].sort((x,y)=>y.diff-x.diff).slice(0,10), fallers=[...movers].sort((x,y)=>x.diff-y.diff).slice(0,10);
    const moverCols=[ {key:'lp',label:'Landing Page',get:r=>r.lp,sortable:false,render:lpCell},
      {key:'prev',label:AU.trMonth(prevM),align:'right',render:r=>U.fmtFull(r.prev)},
      {key:'cur',label:AU.trMonth(lastM),align:'right',render:r=>U.fmtFull(r.cur)},
      {key:'diff',label:'Δ Oturum',align:'right',render:r=>h('span',{className:AU.deltaClass(r.diff>0?1:r.diff<0?-1:null)},(r.diff>0?'+':'')+U.fmtFull(r.diff))} ];
    return h('div', null,
      h(ExportSection, { id:'sec-mom', title:'Aylık Trend — Oturum · Ciro · Transaction',
        desc:'Üç metrik aynı anda izlenebilir; etiketlerden açıp kapatın, "Değerler" ile sayıları gösterin. Kasım kampanya tepesi ve Mayıs bayram tepesi belirgindir.',
        pngName:'ozdilekteyim-ai-trend',
        csv:{ rows:tableRows, name:'aylik-trend', headers:[{label:'Ay',get:r=>AU.trMonth(r.ym)},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Ciro',get:r=>Math.round(r.revenue)},{label:'Transaction',get:r=>Math.round(r.tx)},{label:'Oturum Δ%',get:r=>r.dSess==null?'':(r.dSess*100).toFixed(1)}] } },
        h(MetricChart, { rows:allRows, defaultMetrics:['sessions','revenue','tx'], height:360 }),
        h('div',{className:'insight-strip',style:{marginTop:'14px'}},h('span',{className:'arrow'},'➜'),
          h('span',null,h('strong',null,'Kasım 2025'),' Efsane Cuma ile dönemin en yüksek cirosunu (₺139K) oluşturmuş; trafik sonraki aylarda yeniden bu seviyelere yaklaşmış, ',h('strong',null,'Mayıs 2026'),' bayram dönemiyle Kasım\'ı da aşmıştır.')),
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

  // ============ 3. SAYFA TİPİ ============
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
        metricSeg(metric,setMetric)),
      h('div',{className:'ai-grid-2'},
        h(ExportSection,{id:'sec-ptype-donut',title:'Sayfa Tipi Dağılımı — '+AU.METRICS[metric].short,desc:'Seçili aylara göre dinamik. Dilime tıklayınca ilgili tip Landing Page\'de açılır.',pngName:'ozdilekteyim-ai-sayfa-tipi-donut'},
          h(Donut,{groups, metric, colors:PTYPE_COLORS, height:300, onSliceClick:go})),
        h(ExportSection,{id:'sec-ptype-bar',title:AU.METRICS[metric].short+' Payı',desc:'Renkli bölüme ya da satıra tıklayarak ilgili tipi Landing Page\'de açabilirsiniz.',pngName:'ozdilekteyim-ai-sayfa-tipi-pay'},
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

  // LP detay modalı: o sayfanın aylık çoklu-metrik akışı + meta
  function LpModalView({lp, allRows, onClose}){
    const rows=allRows.filter(r=>r.lp===lp);
    const t=AU.totals(rows); const meta=rows[0]||{};
    return h(Modal, { title:AU.lpLabel(lp)+' · sayfa detayı', onClose, width:840 },
      h('div',{style:{marginBottom:'12px',fontSize:'12px',color:'var(--ink-3)',display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}},
        h('a',{href:AU.lpUrl(lp),target:'_blank',style:{color:'var(--accent-deep)',textDecoration:'none'}}, AU.lpUrl(lp)),
        meta.brand?h('span',{className:'pill',style:{fontSize:'11px'}},meta.brand):null,
        h('span',{className:'pill',style:{fontSize:'11px'}},meta.ptype),
        meta.inLlms?h(LlmsBadge):null),
      h(KpiStrip,{cols:4, items:[
        {label:'Oturum',value:U.fmtFull(t.sessions),color:AU.METRICS.sessions.color},
        {label:'Ciro',value:AU.fmtTRY(t.revenue),color:AU.METRICS.revenue.color},
        {label:'Transaction',value:U.fmtFull(t.tx),color:AU.METRICS.tx.color},
        {label:'CR',value:U.fmtPct(t.cr,2),color:AU.METRICS.cr.color} ]}),
      h('div',{style:{fontSize:'12.5px',fontWeight:700,color:'var(--ink-2)',margin:'6px 0 4px'}},'Bu sayfanın aylık akışı'),
      h(MetricChart, { rows, defaultMetrics:['sessions','revenue'], height:280 })
    );
  }

  // ============ 4. LANDING PAGE ============
  function LandingPages({rows, filters, setFilters, selectedLp, setSelectedLp}) {
    const [metric, setMetric] = useState('sessions');
    const filtered = useMemo(()=>AU.applyFilters(rows, filters), [rows, filters]);
    const data = useMemo(()=>groupLP(filtered), [filtered]);
    const cols = [
      {key:'lp', label:'Landing Page', get:r=>r.lp, sortable:false, render:lpCell}, brandCol,
      {key:'ptype', label:'Tip', get:r=>r.ptype, render:r=>h('span',{className:'pill',style:{fontSize:'11px'}},r.ptype)},
      {key:'sessions', label:'Oturum', align:'right', render:r=>U.fmtFull(r.sessions)},
      {key:'revenue', label:'Ciro', align:'right', render:r=>AU.fmtTRY(r.revenue)},
      {key:'tx', label:'Transaction', align:'right', render:r=>U.fmtFull(r.tx)},
      {key:'cr', label:'CR', align:'right', render:r=>U.fmtPct(r.cr,2)},
    ];
    const csvHeaders=[{label:'Landing Page',get:r=>r.lp},{label:'Marka',get:r=>r.brand||''},{label:'Tip',get:r=>r.ptype},{label:'llms.txt',get:r=>r.inLlms?'Evet':'Hayır'},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Ciro',get:r=>Math.round(r.revenue)},{label:'Transaction',get:r=>Math.round(r.tx)}];
    return h('div', null,
      h(ExportSection, { id:'sec-lp-chart', title:'Filtrelenmiş set · aylık akış',
        desc:'Aşağıdaki filtre/aramaya göre dinamik. Tablodan bir satıra tıklayınca o sayfanın detay grafiği açılır.',
        pngName:'ozdilekteyim-ai-lp-akis' },
        h(MetricChart, { rows:filtered, defaultMetrics:['sessions','revenue'], height:300 })
      ),
      // FILTRELER — chart altında, tablonun hemen üstünde
      h(FilterBar, { filters, setFilters, extra: metricSeg(metric,setMetric) }),
      h(ExportSection, { id:'sec-lp', title:'Landing Page Tablosu — '+AU.METRICS[metric].short,
        desc:'Excel\'deki tüm sayfalar tekilleştirilmiş haldedir (toplamda oturum almış '+data.length+' sayfa). Bir satıra tıklayınca üstteki grafik o sayfanın akışına döner. ✦ llms işareti llms.txt sayfalarını gösterir.',
        pngName:'ozdilekteyim-ai-landing-page', csv:{rows:[...data].sort((a,b)=>b[metric]-a[metric]),headers:csvHeaders,name:'landing-pages'} },
        h(DataTable, { columns:cols, rows:data, initialSort:{key:metric,dir:'desc'},
          onRowClick:r=>setSelectedLp(r.lp), activeKey:selectedLp, keyOf:r=>r.lp })
      ),
      selectedLp ? h(LpModalView, { lp:selectedLp, allRows:AU.ROWS, onClose:()=>setSelectedLp(null) }) : null
    );
  }

  // ============ 5. MARKA & ÜRÜN ============
  function BrandProduct({rows}) {
    const [metric, setMetric] = useState('sessions');
    const [filters, setFilters] = useState({ search:'', ptypes:[], brands:[] });
    const [modalBrand, setModalBrand] = useState(null);
    const heatRows = useMemo(()=>brandHeatRows(AU.ROWS, metric, {sortBy:'sessions'}), [metric]);
    const brandRows = useMemo(()=>AU.groupBy(rows.filter(r=>r.brand),r=>r.brand), [rows]);
    const selSet = filters.brands.length?new Set(filters.brands):null;
    // LP tablosu: filtreye göre (marka + tip + arama)
    const lpRows = useMemo(()=>groupLP(AU.applyFilters(rows.filter(r=>r.brand), filters)), [rows, filters]);
    const lpCols=[ {key:'lp',label:'Landing Page',get:r=>r.lp,sortable:false,render:lpCell}, brandCol,
      {key:'ptype',label:'Tip',get:r=>r.ptype,render:r=>h('span',{className:'pill',style:{fontSize:'11px'}},r.ptype)},
      {key:'sessions',label:'Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
      {key:'revenue',label:'Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)},
      {key:'tx',label:'Transaction',align:'right',render:r=>U.fmtFull(r.tx)},
      {key:'cr',label:'CR',align:'right',render:r=>U.fmtPct(r.cr,2)} ];
    const toggleBrand = (b)=> setFilters(f=>({...f, brands: f.brands.includes(b)?f.brands.filter(x=>x!==b):[...f.brands,b]}));
    return h('div', null,
      h('div',{className:'scope-note'},'Marka çıkarımı ', h('code',null,'/magaza/marka/'),' path\'i ve ürün slug sözlüğü ile yapılır. Donut veya listeden bir markaya tıklayarak seçebilir, alttaki tabloyu filtreleyebilirsiniz.'),
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginBottom:'10px'}}, metricSeg(metric,setMetric)),
      h(ExportSection,{id:'sec-brand-donut',title:'Marka Dağılımı — '+AU.METRICS[metric].short,desc:'Top 12 marka; donut veya listeden tıklayınca seçilir ve alttaki LP tablosu filtrelenir. Liste her marka için oturum, ciro ve transaction gösterir.',pngName:'ozdilekteyim-ai-marka'},
        brandRows.length? h(BrandDonut,{groups:brandRows, metric, selected:filters.brands, onToggle:toggleBrand, height:340}) : h('div',{style:{color:'var(--ink-3)',padding:'20px 0'}},'Seçili dönemde marka ataması yapılabilen sayfa bulunmuyor.')),
      // FILTRELER — chart altında, tablonun hemen üstünde (tek marka filtresi: duplicate yok)
      h(FilterBar, { filters, setFilters }),
      h(ExportSection,{id:'sec-brand-lp',title:'Marka Sayfaları'+(filters.brands.length?(' · '+filters.brands.join(', ')):' (tümü)'),desc:'Seçili markalara ait landing page\'ler, tüm metriklerle. '+lpRows.length+' sayfa.',pngName:'ozdilekteyim-ai-marka-lp',
        csv:{rows:[...lpRows].sort((a,b)=>b[metric]-a[metric]),name:'marka-landing-pages',headers:[{label:'Landing Page',get:r=>r.lp},{label:'Marka',get:r=>r.brand},{label:'Tip',get:r=>r.ptype},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Ciro',get:r=>Math.round(r.revenue)},{label:'Transaction',get:r=>Math.round(r.tx)}]}},
        lpRows.length? h(DataTable,{columns:lpCols,rows:lpRows,initialSort:{key:metric,dir:'desc'},maxRows:50}) : h('div',{style:{color:'var(--ink-3)'}},'Seçili filtrede sayfa yok.')),
      h(ExportSection,{id:'sec-brand-heat',title:'Marka Sezon Takvimi — '+AU.METRICS[metric].short,
        desc:'Tüm markaların aydan aya '+AU.METRICS[metric].short.toLowerCase()+' yoğunluğu (kırmızı düşük → yeşil yüksek, satır içi ölçek). Δ dönemin ilk/ikinci yarı farkıdır. Bir markaya tıklayarak detayını (aylık akış + sayfalar) açabilirsiniz. Metrik üstteki butonlardan değişir.',
        pngName:'ozdilekteyim-ai-marka-sezon',
        csv:{rows:heatRows,name:'marka-sezon-takvimi',headers:[{label:'Marka',get:r=>r.label}].concat(AU.MONTHS.map((m,i)=>({label:AU.trMonth(m),get:r=>Math.round(r.values[i])}))).concat([{label:'Δ oturum',get:r=>Math.round(r.diff)}])}},
        h(C.HeatTable,{rows:heatRows, months:AU.MONTHS, deltaKey:'diff', deltaLabel:'Δ otr', maxHeight:430, onRowClick:r=>setModalBrand(r.key)})),
      modalBrand ? h(BrandModalView,{brand:modalBrand, allRows:AU.ROWS, onClose:()=>setModalBrand(null)}) : null
    );
  }

  // ============ 6. DÖNÜŞÜM FIRSATI ============
  function NoConvert({rows}) {
    const [filters, setFilters] = useState({ search:'', ptypes:[], brands:[] });
    const base = useMemo(()=>groupLP(AU.applyFilters(rows, filters)).filter(x=>x.ptype!=='Sepet/Checkout' && x.ptype!=='Hesap' && x.sessions>=10 && x.tx===0).sort((a,b)=>b.sessions-a.sessions), [rows, filters]);
    const data = base;
    const topBar = base.slice(0,12);
    const buildBar=()=>{ const th=chartTheme();
      return { type:'bar', data:{labels:topBar.map(x=>AU.lpLabel(x.lp).slice(0,32)),datasets:[{label:'Oturum',data:topBar.map(x=>x.sessions),backgroundColor:topBar.map(x=>PTYPE_COLORS[x.ptype]||'#F15B2A'),borderRadius:5,datalabels:{display:false}}]},
        options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},datalabels:{display:false},tooltip:{callbacks:{label:c=>'Oturum: '+U.fmtFull(c.parsed.x)+' · transaction: 0'}}},
          scales:{x:{grid:{color:th.grid},ticks:{color:th.tick}},y:{grid:{display:false},ticks:{color:th.ink,font:{size:10.5}}}}} };
    };
    const cols=[ {key:'lp',label:'Landing Page',get:r=>r.lp,sortable:false,render:lpCell}, brandCol,
      {key:'ptype',label:'Tip',get:r=>r.ptype,render:r=>h('span',{className:'pill',style:{fontSize:'11px'}},r.ptype)},
      {key:'sessions',label:'Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
      {key:'tx',label:'Transaction',align:'right',render:r=>U.fmtFull(r.tx)},
      {key:'revenue',label:'Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)} ];
    return h('div', null,
      h('div',{className:'insight-strip',style:{marginBottom:'16px'}},h('span',{className:'arrow'},'➜'),
        h('span',null,'Aşağıdaki sayfalar seçili dönemde belirgin ',h(Term,{t:'session'},'AI oturumu'),' almış fakat henüz ',h(Term,{t:'transaction'},'transaction'),' ile sonuçlanmamıştır; içerik ve dönüşüm akışının gözden geçirilmesiyle değerlendirilebilir ',h('strong',null,'dönüşüm fırsatı'),' sunmaktadır.')),
      h(ExportSection,{id:'sec-noconv-bar',title:'En Yüksek Oturumlu Dönüşüm Fırsatı Sayfaları',desc:'Oturum ≥ 5 ve transaction = 0. Renk sayfa tipini gösterir.',pngName:'ozdilekteyim-ai-firsat-bar'},
        topBar.length? h(ChartCanvas,{buildConfig:buildBar,deps:[rows,filters],height:Math.max(220,topBar.length*28+50)}) : h('div',{style:{color:'var(--ink-3)'}},'Kriterlere uyan sayfa yok.')),
      h(FilterBar, { filters, setFilters }),
      h(ExportSection,{id:'sec-noconv',title:'Dönüşüm Fırsatı Sayfaları Tablosu',desc:'Oturum ≥ 10 ve transaction = 0 olan tüm sayfalar, oturuma göre sıralı. '+base.length+' sayfa kriterlere uyuyor.',pngName:'ozdilekteyim-ai-firsat',
        csv:{rows:data,name:'donusum-firsati-sayfalari',headers:[{label:'Landing Page',get:r=>r.lp},{label:'Marka',get:r=>r.brand||''},{label:'Tip',get:r=>r.ptype},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Transaction',get:r=>r.tx},{label:'llms.txt',get:r=>r.inLlms?'Evet':'Hayır'}]}},
        data.length? h(DataTable,{columns:cols,rows:data,initialSort:{key:'sessions',dir:'desc'}}) : h('div',{style:{color:'var(--ink-3)'}},'Kriterlere uyan sayfa yok.'))
    );
  }

  // ============ 7. llms.txt ETKİSİ ============
  function LlmsImpact({allRows}) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState([]);
    const months = AU.MONTHS, fi = months.indexOf(AU.META.llmsAddedMonth);
    const llmsRows = allRows.filter(r=>r.inLlms), otherRows = allRows.filter(r=>!r.inLlms);
    const llmsSeries=AU.monthlySeries(llmsRows,'sessions'), otherSeries=AU.monthlySeries(otherRows,'sessions');
    const sum=(a,x,y)=>a.slice(x,y).reduce((s,v)=>s+v,0);
    const preL=sum(llmsSeries,0,fi),postL=sum(llmsSeries,fi,months.length),postO=sum(otherSeries,fi,months.length);
    const buildLine=()=>{ const th=chartTheme();
      return { type:'line', data:{labels:months.map(AU.trMonth),datasets:[
        {label:'llms.txt sayfaları',data:llmsSeries,borderColor:'#F15B2A',backgroundColor:'#F15B2A22',borderWidth:2.5,tension:.3,pointRadius:3,fill:true,datalabels:{display:false}},
        {label:'Diğer sayfalar',data:otherSeries,borderColor:'#1565C0',backgroundColor:'transparent',borderWidth:2,borderDash:[4,3],tension:.3,pointRadius:2,yAxisID:'y2',datalabels:{display:false}} ]},
        options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
          plugins:{legend:{position:'top',labels:{color:th.ink,font:{size:11},boxWidth:14,usePointStyle:true,pointStyle:'circle'}},datalabels:{display:false},tooltip:{callbacks:{label:c=>c.dataset.label+': '+U.fmtFull(c.parsed.y)}}},
          scales:{x:{grid:{color:th.grid},ticks:{color:th.tick,font:{size:11}}},
            y:{position:'left',grid:{color:th.grid},ticks:{color:'#F15B2A'},title:{display:true,text:'llms.txt oturum',color:'#F15B2A',font:{size:10}}},
            y2:{position:'right',grid:{display:false},ticks:{color:'#1565C0'},title:{display:true,text:'diğer oturum',color:'#1565C0',font:{size:10}}}}},
        plugins: fi>=0?[{id:'fm',afterDraw(ch){const x=ch.scales.x.getPixelForValue(fi);const{top,bottom}=ch.chartArea;const c=ch.ctx;c.save();c.strokeStyle='rgba(241,91,42,.55)';c.lineWidth=1.5;c.setLineDash([5,4]);c.beginPath();c.moveTo(x,top);c.lineTo(x,bottom);c.stroke();c.setLineDash([]);c.fillStyle='rgba(241,91,42,.9)';c.font='600 10px Outfit,sans-serif';c.fillText('llms.txt ✦',x+5,top+12);c.restore();}}]:[] };
    };
    const disc = useMemo(()=>{
      const pages = groupLP(llmsRows); const relLpAll = new Set();
      const out = pages.map(p=>{ const info=AU.llmsTokens(p.lp); const rel=AU.relatedProductRows(allRows,p.lp,p.brand);
        const relSess=rel.reduce((s,r)=>s+r.sessions,0); const relCount=new Set(rel.map(r=>r.lp)).size;
        for(const r of rel) relLpAll.add(r.lp); return {...p, llmsType:info.type, relSess, relCount}; });
      const uniqTotal = allRows.filter(r=>r.ptype==='Ürün'&&relLpAll.has(r.lp)).reduce((s,r)=>s+r.sessions,0);
      return { pages:out, uniqTotal };
    }, []);
    const totalRel = disc.uniqTotal;
    const filtered = useMemo(()=>{ let d=disc.pages;
      if(typeFilter.length){const s=new Set(typeFilter); d=d.filter(x=>s.has(x.llmsType));}
      if(search.trim()){const q=search.trim().toLowerCase(); d=d.filter(x=>x.lp.toLowerCase().includes(q));}
      return d;
    }, [disc, typeFilter, search]);
    const cols=[
      {key:'lp',label:'llms.txt Sayfası',get:r=>r.lp,sortable:false,render:r=>h('span',{className:'lp-cell'},h('a',{href:AU.lpUrl(r.lp),target:'_blank'},AU.lpLabel(r.lp)),h(LlmsBadge))},
      {key:'llmsType',label:'Tür',get:r=>r.llmsType,render:r=>h('span',{className:'pill',style:{fontSize:'11px'}},r.llmsType)},
      {key:'sessions',label:'Doğrudan Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
      {key:'relSess',label:'İlişkili Ürün Oturumu',align:'right',render:r=>U.fmtFull(r.relSess)},
      {key:'relCount',label:'İlişkili Ürün Sayısı',align:'right',render:r=>U.fmtFull(r.relCount)},
      {key:'revenue',label:'Doğrudan Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)},
    ];
    return h('div', null,
      h(C.NoteCard, { label:'NOT' },
        h(Term,{t:'llms.txt'},'llms.txt'),' dosyası ',h('strong',null,'Şubat 2026'),'\'da eklenmiştir; "Önemli Sayfalar" altında ',h('strong',null,AU.META.llmsPathCount+' sayfa'),' tanımlıdır, bunlardan ',h('strong',null,AU.META.llmsInData+' tanesi'),' AI trafiği verisinde gözlemlenmektedir. ',
        'Bu sayfalar ağırlıkla kategori/marka niteliğindedir; aşağıda hem doğrudan oturum hem de bu kategori/markalardaki ',h('strong',null,'ürünlere gelen ilişkili trafik'),' birlikte sunulmaktadır.'),
      h(KpiStrip,{cols:4, items:[
        {label:'llms.txt · Şubat öncesi',value:U.fmtFull(preL),color:'#F15B2A',sub:'doğrudan oturum'},
        {label:'llms.txt · Şubat ve sonrası',value:U.fmtFull(postL),color:'#F15B2A',sub:'doğrudan oturum'},
        {label:'İlişkili ürün keşfi',value:U.fmtFull(totalRel),color:'#2E7D32',sub:'kategori/markaların ürün oturumu'},
        {label:'Diğer · Şubat sonrası',value:U.fmtFull(postO),color:'#1565C0',sub:'llms.txt dışı oturum'},
      ]}),
      h(ExportSection,{id:'sec-llms-chart',title:'llms.txt Sayfaları vs Diğer — Aylık Oturum',desc:'Çift eksen: sol llms.txt sayfaları, sağ diğer sayfalar. Kesikli çizgi Şubat 2026 (llms.txt eklendi).',pngName:'ozdilekteyim-ai-llms-etki'},
        h(ChartCanvas,{buildConfig:buildLine,deps:[],height:340})),
      h(C.NoteCard, { label:'YÖNTEM', tone:'method' }, h('strong',null,'İlişki nasıl kuruldu? '),
        'llms.txt\'deki her sayfa bir markaya ya da kategoriye karşılık gelir (ör. Adidas spor ayakkabı sayfası). İlgili ürünler, ',h('strong',null,'aynı markaya ya da aynı kategoriye bağlı'),' ürün sayfalarıdır; bu sayfaların bağlı olduğu kategori/marka teyit edilmiştir. Toplam değer her ürünü ',h('strong',null,'yalnızca bir kez sayar'),' (mükerrer sayım yoktur).'),
      h('div',{className:'insight-strip',style:{margin:'4px 0 8px'}},h('span',{className:'arrow'},'➜'),
        h('span',null,'llms.txt sayfalarının doğrudan oturumu sınırlı seyretse de, bu marka ve kategorilerin ürün sayfalarına gelen ',h('strong',null,'ilişkili trafik '+U.fmtFull(totalRel)+' oturum'),' düzeyindedir; kullanıcıların kategori sayfası yerine doğrudan ilgili ürün sayfalarına ulaşmış olabileceği değerlendirilebilir.')),
      // FILTRELER — chart altında, tablonun hemen üstünde
      h('div',{className:'filter-row'},
        h(SearchInput,{value:search,onChange:setSearch,placeholder:'llms.txt sayfası ara…'}),
        h(MultiSelect,{label:'tür',options:['Marka','Kategori'],selected:typeFilter,onChange:setTypeFilter,width:160})),
      h(ExportSection,{id:'sec-llms-tbl',title:'llms.txt Sayfaları ve Ürün Keşfi',desc:'Her llms.txt sayfasının doğrudan oturumu ve bağlı olduğu kategori/markadaki ürünlere gelen ilişkili oturum. '+filtered.length+' sayfa.',pngName:'ozdilekteyim-ai-llms-tablo',
        csv:{rows:filtered,name:'llms-kesif',headers:[{label:'Sayfa',get:r=>r.lp},{label:'Tür',get:r=>r.llmsType},{label:'Doğrudan Oturum',get:r=>Math.round(r.sessions)},{label:'İlişkili Ürün Oturumu',get:r=>Math.round(r.relSess)},{label:'İlişkili Ürün Sayısı',get:r=>r.relCount},{label:'Doğrudan Ciro',get:r=>Math.round(r.revenue)}]}},
        filtered.length? h(DataTable,{columns:cols,rows:filtered,initialSort:{key:'relSess',dir:'desc'}}) : h('div',{style:{color:'var(--ink-3)'}},'Eşleşen llms.txt sayfası bulunmuyor.'))
    );
  }

  window.TABS = { Ozet, Trend, LandingPages, PageTypes, BrandProduct, NoConvert, LlmsImpact };
})();
