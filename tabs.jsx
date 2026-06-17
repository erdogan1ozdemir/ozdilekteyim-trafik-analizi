// tabs.jsx — AI trafik raporu sekmeleri (window.TABS)
(function(){
  const h = React.createElement;
  const { useState, useRef, useMemo } = React;
  const U = window.U, AU = window.AU, C = window.COMP;
  const { Section, PngButton, CsvButton, LlmsBadge, KpiStrip, MetricToggleChart, DataTable, SegToggle, ChartCanvas, chartTheme, Term } = C;

  // —— Export'lu section (PNG + opsiyonel CSV tools) ——
  function ExportSection(props) {
    const ref = useRef(null);
    const tools = [
      props.csv ? h(CsvButton, { key:'c', rows:props.csv.rows, headers:props.csv.headers, name:props.csv.name }) : null,
      h(PngButton, { key:'p', targetRef:ref, name:props.pngName || 'ozdilekteyim-ai' }),
    ];
    return h(Section, { id:props.id, title:props.title, desc:props.desc, tools, innerRef:ref }, props.children);
  }

  // —— LP gruplama (meta'lı) ——
  function groupLP(rows) {
    const g = AU.groupBy(rows, r => r.lp);
    return g.map(x => ({
      lp:x.key, sessions:x.sessions, tx:x.tx, revenue:x.revenue, aov:x.aov, cr:x.cr,
      inLlms: x._rows.some(r=>r.inLlms), ptype: x._rows[0].ptype, brand: x._rows[0].brand,
    }));
  }

  // —— Feb 2026 dikey işaret çizgisi (custom inline plugin) ——
  function febMarkerPlugin() {
    const idx = AU.MONTHS.indexOf(AU.META.llmsAddedMonth);
    if (idx < 0) return null;
    return {
      id:'febMarker',
      afterDraw(chart){
        const x = chart.scales.x.getPixelForValue(idx);
        const {top, bottom} = chart.chartArea;
        const ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(241,91,42,.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle = 'rgba(241,91,42,.9)'; ctx.font = '600 10px Outfit, sans-serif';
        ctx.fillText('llms.txt ✦', x+5, top+12);
        ctx.restore();
      }
    };
  }

  const fmtBy = (m, v) => AU.METRICS[m].fmt(v);

  // ===================== 1. ÖZET =====================
  function Ozet({rows, allRows}) {
    const t = AU.totals(rows);
    const kpis = [
      { label:'Toplam AI Oturum', value:U.fmtFull(t.sessions), color:AU.METRICS.sessions.color, sub:'ChatGPT referral' },
      { label:'Toplam Ciro', value:AU.fmtTRY(t.revenue), color:AU.METRICS.revenue.color },
      { label:'Transaction', value:U.fmtFull(t.tx), color:AU.METRICS.tx.color },
      { label:'AOV', value:AU.fmtTRY(t.aov), color:AU.METRICS.aov.color, sub:'işlem başına' },
      { label:'Dönüşüm (CR)', value:U.fmtPct(t.cr,2), color:AU.METRICS.cr.color, sub:'oturum → işlem' },
    ];
    // basit nötr insight
    const months = AU.MONTHS;
    const sessSeries = AU.monthlySeries(allRows, 'sessions');
    const peakIdx = sessSeries.indexOf(Math.max(...sessSeries));
    return h('div', null,
      h(KpiStrip, { items:kpis }),
      h('div', { className:'insight-strip', style:{marginBottom:'18px'} },
        h('span', { className:'arrow' }, '➜'),
        h('span', null,
          'Seçili dönemde Özdilekteyim\'e gelen ', h(Term,{t:'referral'},'AI (ChatGPT) referral'),
          ' trafiği ', h('strong',null,U.fmtFull(t.sessions)+' '), h(Term,{t:'session'},'oturum'),
          ' ve ', h('strong',null,AU.fmtTRY(t.revenue)), ' ciro düzeyinde gözlemlenmektedir. ',
          'En yüksek oturum hacmi ', h('strong',null,AU.trMonth(months[peakIdx])), ' ayında öne çıkmaktadır.'
        )
      ),
      h(ExportSection, {
        id:'sec-trend', title:'Aylık AI Trafik Eğrisi',
        desc:'Metrikleri üstteki etiketlerden açıp kapatabilirsiniz. Zaman serisi tüm ayları gösterir; ay filtresi anlık (snapshot) bölümleri etkiler.',
        pngName:'ozdilekteyim-ai-aylik-egri'
      },
        h(MetricToggleChart, { rows:allRows, defaultMetrics:['sessions','revenue'] }),
        h('div', { className:'scope-note' },
          'Kapsam: veri kaynağı ', h('strong',null,'%100 chatgpt.com referral'),'. Tutarlar ', h('strong',null,'₺'),
          ' cinsindendir. ', (AU.META.isSample? 'Eldeki dosya örneklem niteliğindedir; tam veri geldiğinde kapsam genişleyecektir. ':''),
          (AU.META.partialMonths||[]).length? ('İşaretli ay(lar) (*) kısmi dönem içerir: '+AU.META.partialMonths.map(AU.trMonth).join(', ')+'.'):''
        )
      )
    );
  }

  // ===================== 2. AYLIK TREND =====================
  function Trend({rows, allRows}) {
    const months = AU.MONTHS;
    const ms = m => AU.monthlySeries(allRows, m);
    const sess=ms('sessions'), rev=ms('revenue'), tx=ms('tx');
    const tableRows = months.map((m,i)=>({
      ym:m, sessions:sess[i], revenue:rev[i], tx:tx[i],
      dSess: i>0 ? AU.deltaPct(sess[i], sess[i-1]) : null,
    }));
    // MoM büyüme bar chart
    const buildBar = () => {
      const th = chartTheme(); const fp = febMarkerPlugin();
      return {
        type:'bar',
        data:{ labels:months.map(AU.trMonth), datasets:[{
          label:'Oturum', data:sess, backgroundColor: months.map(m=> (AU.META.partialMonths||[]).includes(m)?'rgba(241,91,42,.45)':'rgba(241,91,42,.85)'),
          borderRadius:5,
        }]},
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>'Oturum: '+U.fmtFull(c.parsed.y)}}},
          scales:{ x:{grid:{display:false}, ticks:{color:th.tick,font:{size:11}}}, y:{grid:{color:th.grid}, ticks:{color:th.tick}} } },
        plugins: fp?[fp]:[],
      };
    };
    // LP momentum: son ay vs önceki ay
    const lastM = months[months.length-1], prevM = months[months.length-2];
    const lpLast = new Map(groupLP(allRows.filter(r=>r.ym===lastM)).map(x=>[x.lp,x]));
    const lpPrev = new Map(groupLP(allRows.filter(r=>r.ym===prevM)).map(x=>[x.lp,x]));
    const moversAll = [];
    const keys = new Set([...lpLast.keys(), ...lpPrev.keys()]);
    for (const k of keys){
      const a=(lpLast.get(k)||{}).sessions||0, b=(lpPrev.get(k)||{}).sessions||0;
      if (a+b < 3) continue;
      moversAll.push({lp:k, cur:a, prev:b, diff:a-b, inLlms:(lpLast.get(k)||lpPrev.get(k)||{}).inLlms});
    }
    const risers = [...moversAll].sort((x,y)=>y.diff-x.diff).slice(0,10);
    const fallers = [...moversAll].sort((x,y)=>x.diff-y.diff).slice(0,10);

    const lpCol = {key:'lp', label:'Landing Page', get:r=>r.lp, render:r=>h('span',{className:'lp-cell'}, h('a',{href:AU.lpUrl(r.lp),target:'_blank'},AU.lpLabel(r.lp)), r.inLlms?h(LlmsBadge):null), sortable:false};
    const moverCols = [ lpCol,
      {key:'prev', label:AU.trMonth(prevM), align:'right', render:r=>U.fmtFull(r.prev)},
      {key:'cur', label:AU.trMonth(lastM), align:'right', render:r=>U.fmtFull(r.cur)},
      {key:'diff', label:'Δ Oturum', align:'right', render:r=>h('span',{className:AU.deltaClass(r.diff>0?1:r.diff<0?-1:null)}, (r.diff>0?'+':'')+U.fmtFull(r.diff))},
    ];
    return h('div', null,
      h(ExportSection, { id:'sec-mom', title:'Aydan Aya (MoM) Oturum Değişimi',
        desc:'Kesikli turuncu çizgi llms.txt\'nin eklendiği Şubat 2026 ayını işaret eder. Soluk bar kısmi ayı gösterir.',
        pngName:'ozdilekteyim-ai-mom',
        csv:{ rows:tableRows, name:'aylik-trend', headers:[
          {label:'Ay',get:r=>AU.trMonth(r.ym)},{label:'Oturum',get:r=>Math.round(r.sessions)},
          {label:'Ciro',get:r=>Math.round(r.revenue)},{label:'Transaction',get:r=>Math.round(r.tx)},
          {label:'Oturum Δ%',get:r=>r.dSess==null?'':(r.dSess*100).toFixed(1)} ]}
      },
        h(ChartCanvas, { buildConfig:buildBar, deps:[], height:300 }),
        h('div',{style:{marginTop:'14px'}}, h(DataTable, { columns:[
          {key:'ym',label:'Ay',get:r=>r.ym,render:r=>AU.trMonth(r.ym),sortable:false},
          {key:'sessions',label:'Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
          {key:'revenue',label:'Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)},
          {key:'tx',label:'Transaction',align:'right',render:r=>U.fmtFull(r.tx)},
          {key:'dSess',label:'Oturum Δ%',align:'right',render:r=>r.dSess==null?'–':h('span',{className:AU.deltaClass(r.dSess)},U.fmtPct(r.dSess))},
        ], rows:tableRows, initialSort:{key:'ym',dir:'asc'} }))
      ),
      h('div', { className:'ai-grid-2' },
        h(ExportSection, { id:'sec-risers', title:'Yükselen Sayfalar', desc:AU.trMonth(prevM)+' → '+AU.trMonth(lastM)+' oturum artışı.', pngName:'ozdilekteyim-ai-yukselen' },
          h(DataTable, { columns:moverCols, rows:risers, initialSort:{key:'diff',dir:'desc'} })),
        h(ExportSection, { id:'sec-fallers', title:'Gerileyen Sayfalar', desc:AU.trMonth(prevM)+' → '+AU.trMonth(lastM)+' oturum değişimi.', pngName:'ozdilekteyim-ai-gerileyen' },
          h(DataTable, { columns:moverCols, rows:fallers, initialSort:{key:'diff',dir:'asc'} }))
      )
    );
  }

  // ===================== 3. LANDING PAGE =====================
  function LandingPages({rows}) {
    const [metric, setMetric] = useState('sessions');
    const data = useMemo(()=>groupLP(rows), [rows]);
    const cols = [
      {key:'lp', label:'Landing Page', get:r=>r.lp, sortable:false, render:r=>h('span',{className:'lp-cell'}, h('a',{href:AU.lpUrl(r.lp),target:'_blank'},AU.lpLabel(r.lp)), r.inLlms?h(LlmsBadge):null)},
      {key:'ptype', label:'Tip', get:r=>r.ptype, render:r=>h('span',{className:'pill', style:{fontSize:'11px'}},r.ptype)},
      {key:'sessions', label:'Oturum', align:'right', render:r=>U.fmtFull(r.sessions)},
      {key:'revenue', label:'Ciro', align:'right', render:r=>AU.fmtTRY(r.revenue)},
      {key:'tx', label:'Transaction', align:'right', render:r=>U.fmtFull(r.tx)},
      {key:'cr', label:'CR', align:'right', render:r=>U.fmtPct(r.cr,2)},
    ];
    const csvHeaders=[{label:'Landing Page',get:r=>r.lp},{label:'Tip',get:r=>r.ptype},{label:'llms.txt',get:r=>r.inLlms?'Evet':'Hayır'},
      {label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Ciro',get:r=>Math.round(r.revenue)},{label:'Transaction',get:r=>Math.round(r.tx)}];
    return h('div', null,
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',flexWrap:'wrap',gap:'10px'}},
        h('div',{style:{fontSize:'12.5px',color:'var(--ink-3)'}}, 'Sıralama metriği:'),
        h(SegToggle,{options:[{key:'sessions',label:'Oturum'},{key:'revenue',label:'Ciro'},{key:'tx',label:'Transaction'}],value:metric,onChange:setMetric})
      ),
      h(ExportSection, { id:'sec-lp', title:'Top Landing Page — '+AU.METRICS[metric].short, desc:'Seçili aylara göre dinamik. ✦ llms işareti llms.txt\'de yer alan sayfaları gösterir.', pngName:'ozdilekteyim-ai-landing-page',
        csv:{rows:[...data].sort((a,b)=>b[metric]-a[metric]),headers:csvHeaders,name:'landing-pages'} },
        h(DataTable, { columns:cols, rows:data, initialSort:{key:metric,dir:'desc'}, maxRows:40 })
      )
    );
  }

  // ===================== 4. SAYFA TİPİ =====================
  const PTYPE_COLORS = { 'Ürün':'#F15B2A','Kategori':'#1565C0','Market':'#2E7D32','Sepet/Checkout':'#8E24AA','Anasayfa':'#F5A623','Marka':'#00838F','Hesap':'#6D4C41','Diğer':'#9E9E9E' };
  function PageTypes({rows}) {
    const [metric, setMetric] = useState('sessions');
    const groups = useMemo(()=>AU.groupBy(rows, r=>r.ptype).sort((a,b)=>b[metric]-a[metric]), [rows, metric]);
    const total = groups.reduce((s,g)=>s+g[metric],0) || 1;
    const buildDonut = () => ({
      type:'doughnut',
      data:{ labels:groups.map(g=>g.key), datasets:[{ data:groups.map(g=>g[metric]), backgroundColor:groups.map(g=>PTYPE_COLORS[g.key]||'#999'), borderWidth:2, borderColor:'var(--bg-card)' }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{position:'right', labels:{color:chartTheme().ink, font:{size:11}, boxWidth:12}}, tooltip:{callbacks:{label:c=>c.label+': '+fmtBy(metric,c.parsed)+' ('+(c.parsed/total*100).toFixed(1)+'%)'}} } },
    });
    const cols=[
      {key:'key',label:'Sayfa Tipi',get:r=>r.key,sortable:false,render:r=>h('span',null,h('span',{style:{display:'inline-block',width:'10px',height:'10px',borderRadius:'3px',background:PTYPE_COLORS[r.key]||'#999',marginRight:'7px'}}),r.key)},
      {key:'n',label:'Sayfa',align:'right',render:r=>U.fmtFull(r.n)},
      {key:'sessions',label:'Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
      {key:'revenue',label:'Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)},
      {key:'tx',label:'Transaction',align:'right',render:r=>U.fmtFull(r.tx)},
      {key:'cr',label:'CR',align:'right',render:r=>U.fmtPct(r.cr,2)},
    ];
    return h('div', null,
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginBottom:'12px'}},
        h(SegToggle,{options:[{key:'sessions',label:'Oturum'},{key:'revenue',label:'Ciro'},{key:'tx',label:'Transaction'}],value:metric,onChange:setMetric})),
      h('div',{className:'ai-grid-2'},
        h(ExportSection,{id:'sec-ptype-donut',title:'Sayfa Tipi Dağılımı — '+AU.METRICS[metric].short,desc:'Seçili aylara göre dinamik.',pngName:'ozdilekteyim-ai-sayfa-tipi-donut'},
          h(ChartCanvas,{buildConfig:buildDonut,deps:[metric,rows],height:300})),
        h(ExportSection,{id:'sec-ptype-bar',title:'Pay Dağılımı',desc:AU.METRICS[metric].short+' payı (%).',pngName:'ozdilekteyim-ai-sayfa-tipi-pay'},
          h('div',{className:'ai-ptype-bar'}, groups.map(g=>h('span',{key:g.key,title:g.key+': '+(g[metric]/total*100).toFixed(1)+'%',style:{width:(g[metric]/total*100)+'%',background:PTYPE_COLORS[g.key]||'#999'}}))),
          h('div',{style:{marginTop:'10px',display:'flex',flexWrap:'wrap',gap:'10px'}}, groups.map(g=>h('span',{key:g.key,style:{fontSize:'11.5px',color:'var(--ink-2)'}},h('span',{style:{display:'inline-block',width:'9px',height:'9px',borderRadius:'2px',background:PTYPE_COLORS[g.key]||'#999',marginRight:'5px'}}),g.key+' '+(g[metric]/total*100).toFixed(1)+'%')))
        )
      ),
      h(ExportSection,{id:'sec-ptype-tbl',title:'Sayfa Tipi Tablosu',desc:'Tüm tipler, seçili aylara göre.',pngName:'ozdilekteyim-ai-sayfa-tipi-tablo',
        csv:{rows:groups,name:'sayfa-tipi',headers:[{label:'Tip',get:r=>r.key},{label:'Sayfa',get:r=>r.n},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Ciro',get:r=>Math.round(r.revenue)},{label:'Transaction',get:r=>Math.round(r.tx)}]}},
        h(DataTable,{columns:cols,rows:groups,initialSort:{key:metric,dir:'desc'}})
      )
    );
  }

  // ===================== 5. MARKA & ÜRÜN =====================
  function BrandProduct({rows}) {
    const [metric, setMetric] = useState('sessions');
    const brands = useMemo(()=>AU.groupBy(rows.filter(r=>r.brand), r=>r.brand), [rows]);
    const cols=[
      {key:'key',label:'Marka',get:r=>r.key,sortable:false},
      {key:'n',label:'Sayfa',align:'right',render:r=>U.fmtFull(r.n)},
      {key:'sessions',label:'Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
      {key:'revenue',label:'Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)},
      {key:'tx',label:'Transaction',align:'right',render:r=>U.fmtFull(r.tx)},
      {key:'aov',label:'AOV',align:'right',render:r=>AU.fmtTRY(r.aov)},
    ];
    const buildBar=()=>{
      const top=[...brands].sort((a,b)=>b[metric]-a[metric]).slice(0,12);
      const th=chartTheme();
      return { type:'bar', data:{labels:top.map(b=>b.key),datasets:[{label:AU.METRICS[metric].short,data:top.map(b=>b[metric]),backgroundColor:'#F15B2A',borderRadius:5}]},
        options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmtBy(metric,c.parsed.x)}}},
          scales:{x:{grid:{color:th.grid},ticks:{color:th.tick,callback:v=>metric==='revenue'||metric==='aov'?AU.fmtTRY(v,{compact:true}):U.fmtNum(v)}},y:{grid:{display:false},ticks:{color:th.ink,font:{size:11}}}}} };
    };
    return h('div', null,
      h('div',{className:'scope-note'},'Marka çıkarımı ', h('code',null,'/magaza/marka/'),' path\'i ve ürün slug\'larındaki marka sözlüğü ile yapılır. Eldeki örneklemde ', h('strong',null,'/magaza/marka/'),' kapsamı sınırlıdır; marka kırılımı ağırlıkla ürün slug\'larından türetilmiştir, tam veride zenginleşecektir.'),
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginBottom:'12px'}},
        h(SegToggle,{options:[{key:'sessions',label:'Oturum'},{key:'revenue',label:'Ciro'},{key:'tx',label:'Transaction'}],value:metric,onChange:setMetric})),
      h(ExportSection,{id:'sec-brand-bar',title:'Top Markalar — '+AU.METRICS[metric].short,desc:'Seçili aylara göre dinamik.',pngName:'ozdilekteyim-ai-marka'},
        brands.length? h(ChartCanvas,{buildConfig:buildBar,deps:[metric,rows],height:Math.max(220, Math.min(12,brands.length)*30+60)}) : h('div',{style:{color:'var(--ink-3)',padding:'20px 0'}},'Seçili dönemde marka ataması yapılabilen sayfa bulunmuyor.')
      ),
      h(ExportSection,{id:'sec-brand-tbl',title:'Marka Tablosu',desc:'Trafik, ciro ve transaction perspektifleri.',pngName:'ozdilekteyim-ai-marka-tablo',
        csv:{rows:brands,name:'markalar',headers:[{label:'Marka',get:r=>r.key},{label:'Sayfa',get:r=>r.n},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Ciro',get:r=>Math.round(r.revenue)},{label:'Transaction',get:r=>Math.round(r.tx)}]}},
        brands.length? h(DataTable,{columns:cols,rows:brands,initialSort:{key:metric,dir:'desc'}}) : h('div',{style:{color:'var(--ink-3)'}},'Veri yok.')
      )
    );
  }

  // ===================== 6. DÖNÜŞMEYEN SAYFALAR =====================
  function NoConvert({rows}) {
    const data = useMemo(()=>{
      const g = groupLP(rows).filter(x=>x.ptype!=='Sepet/Checkout' && x.ptype!=='Hesap');
      const maxSess = Math.max(...g.map(x=>x.sessions), 1);
      return g.map(x=>({ ...x, score: x.sessions * (x.tx>0?0.15:1) })) // tx=0 olanlar daha yüksek fırsat skoru
        .filter(x=>x.sessions>=5 && x.tx===0)
        .sort((a,b)=>b.sessions-a.sessions).slice(0,30);
    }, [rows]);
    const cols=[
      {key:'lp',label:'Landing Page',get:r=>r.lp,sortable:false,render:r=>h('span',{className:'lp-cell'},h('a',{href:AU.lpUrl(r.lp),target:'_blank'},AU.lpLabel(r.lp)),r.inLlms?h(LlmsBadge):null)},
      {key:'ptype',label:'Tip',get:r=>r.ptype,render:r=>h('span',{className:'pill',style:{fontSize:'11px'}},r.ptype)},
      {key:'sessions',label:'Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
      {key:'tx',label:'Transaction',align:'right',render:r=>U.fmtFull(r.tx)},
      {key:'revenue',label:'Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)},
    ];
    return h('div', null,
      h('div',{className:'insight-strip',style:{marginBottom:'16px'}},h('span',{className:'arrow'},'➜'),
        h('span',null,'Aşağıdaki sayfalar seçili dönemde belirgin ', h(Term,{t:'session'},'AI oturumu'),' almış fakat henüz ', h(Term,{t:'transaction'},'transaction'),' ile sonuçlanmamıştır. Bu sayfalar, içerik ve dönüşüm akışının gözden geçirilmesiyle değerlendirilebilir fırsat alanı sunmaktadır.')),
      h(ExportSection,{id:'sec-noconv',title:'AI Oturumu Yüksek, Dönüşmeyen Sayfalar',desc:'Oturum ≥ 5 ve transaction = 0 olan sayfalar, oturuma göre sıralı.',pngName:'ozdilekteyim-ai-donusmeyen',
        csv:{rows:data,name:'donusmeyen-sayfalar',headers:[{label:'Landing Page',get:r=>r.lp},{label:'Tip',get:r=>r.ptype},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Transaction',get:r=>r.tx},{label:'llms.txt',get:r=>r.inLlms?'Evet':'Hayır'}]}},
        data.length? h(DataTable,{columns:cols,rows:data,initialSort:{key:'sessions',dir:'desc'}}) : h('div',{style:{color:'var(--ink-3)'}},'Seçili dönemde kriterlere uyan sayfa bulunmuyor.')
      )
    );
  }

  // ===================== 7. llms.txt ETKİSİ =====================
  function LlmsImpact({allRows}) {
    const months = AU.MONTHS;
    const febIdx = months.indexOf(AU.META.llmsAddedMonth);
    const llmsRows = allRows.filter(r=>r.inLlms);
    const otherRows = allRows.filter(r=>!r.inLlms);
    const llmsSeries = AU.monthlySeries(llmsRows,'sessions');
    const otherSeries = AU.monthlySeries(otherRows,'sessions');
    // pre/post
    const sum=(arr,a,b)=>arr.slice(a,b).reduce((s,x)=>s+x,0);
    const preL=sum(llmsSeries,0,febIdx), postL=sum(llmsSeries,febIdx,months.length);
    const preO=sum(otherSeries,0,febIdx), postO=sum(otherSeries,febIdx,months.length);
    const buildLine=()=>{
      const th=chartTheme(); const fp=febMarkerPlugin();
      return { type:'line', data:{labels:months.map(AU.trMonth),datasets:[
        {label:'llms.txt sayfaları', data:llmsSeries, borderColor:'#F15B2A', backgroundColor:'#F15B2A22', borderWidth:2.5, tension:.3, pointRadius:3, fill:true},
        {label:'Diğer sayfalar', data:otherSeries, borderColor:'#1565C0', backgroundColor:'transparent', borderWidth:2, borderDash:[4,3], tension:.3, pointRadius:2, yAxisID:'y2'},
      ]},
      options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'top',labels:{color:th.ink,font:{size:11},boxWidth:14}},tooltip:{callbacks:{label:c=>c.dataset.label+': '+U.fmtFull(c.parsed.y)}}},
        scales:{x:{grid:{color:th.grid},ticks:{color:th.tick,font:{size:11}}},
          y:{position:'left',grid:{color:th.grid},ticks:{color:'#F15B2A'},title:{display:true,text:'llms.txt oturum',color:'#F15B2A',font:{size:10}}},
          y2:{position:'right',grid:{display:false},ticks:{color:'#1565C0'},title:{display:true,text:'diğer oturum',color:'#1565C0',font:{size:10}}}}},
      plugins: fp?[fp]:[] };
    };
    const llmsPages = useMemo(()=>groupLP(llmsRows).sort((a,b)=>b.sessions-a.sessions),[]);
    const cols=[
      {key:'lp',label:'llms.txt Sayfası',get:r=>r.lp,sortable:false,render:r=>h('span',{className:'lp-cell'},h('a',{href:AU.lpUrl(r.lp),target:'_blank'},AU.lpLabel(r.lp)),h(LlmsBadge))},
      {key:'ptype',label:'Tip',get:r=>r.ptype,render:r=>h('span',{className:'pill',style:{fontSize:'11px'}},r.ptype)},
      {key:'sessions',label:'Oturum',align:'right',render:r=>U.fmtFull(r.sessions)},
      {key:'revenue',label:'Ciro',align:'right',render:r=>AU.fmtTRY(r.revenue)},
      {key:'tx',label:'Transaction',align:'right',render:r=>U.fmtFull(r.tx)},
    ];
    return h('div', null,
      h('div',{className:'scope-note'},
        h(Term,{t:'llms.txt'},'llms.txt'),' dosyası ', h('strong',null,'Şubat 2026'),'\'da eklenmiştir; "Önemli Sayfalar" altında ', h('strong',null,AU.META.llmsPathCount+' sayfa'),' tanımlıdır. ',
        'Eldeki örneklemde bu sayfalardan ', h('strong',null,AU.META.llmsInData+' tanesi'),' AI trafiği verisinde görünmektedir. Bu nedenle sayfa-bazlı etki ölçümü tam veri geldiğinde anlam kazanacaktır; aşağıda hem sayfa-bazlı hem de Şubat öncesi/sonrası toplam karşılaştırma sunulmaktadır.'),
      h(KpiStrip,{items:[
        {label:'llms.txt — Şubat öncesi', value:U.fmtFull(preL), color:'#F15B2A', sub:'toplam oturum'},
        {label:'llms.txt — Şubat ve sonrası', value:U.fmtFull(postL), color:'#F15B2A', sub:'toplam oturum'},
        {label:'Diğer — Şubat öncesi', value:U.fmtFull(preO), color:'#1565C0', sub:'toplam oturum'},
        {label:'Diğer — Şubat ve sonrası', value:U.fmtFull(postO), color:'#1565C0', sub:'toplam oturum'},
      ]}),
      h(ExportSection,{id:'sec-llms-chart',title:'llms.txt Sayfaları vs Diğer Sayfalar — Aylık Oturum',desc:'Çift eksen: sol llms.txt sayfaları, sağ diğer sayfalar. Kesikli çizgi Şubat 2026 (llms.txt eklendi).',pngName:'ozdilekteyim-ai-llms-etki'},
        h(ChartCanvas,{buildConfig:buildLine,deps:[],height:340})
      ),
      h(ExportSection,{id:'sec-llms-tbl',title:'Veride Görünen llms.txt Sayfaları',desc:'llms.txt listesinde olup AI trafiği alan sayfalar.',pngName:'ozdilekteyim-ai-llms-tablo',
        csv:{rows:llmsPages,name:'llms-sayfalari',headers:[{label:'Sayfa',get:r=>r.lp},{label:'Tip',get:r=>r.ptype},{label:'Oturum',get:r=>Math.round(r.sessions)},{label:'Ciro',get:r=>Math.round(r.revenue)},{label:'Transaction',get:r=>Math.round(r.tx)}]}},
        llmsPages.length? h(DataTable,{columns:cols,rows:llmsPages,initialSort:{key:'sessions',dir:'desc'}}) : h('div',{style:{color:'var(--ink-3)'}},'Örneklemde eşleşen llms.txt sayfası bulunmuyor (tam veride görünür olacaktır).')
      )
    );
  }

  window.TABS = { Ozet, Trend, LandingPages, PageTypes, BrandProduct, NoConvert, LlmsImpact };
})();
