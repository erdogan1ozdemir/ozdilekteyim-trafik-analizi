// app.jsx — uygulama kabuğu (iki seviyeli nav)
(function(){
  const h = React.createElement;
  const { useState, useMemo } = React;
  const AU = window.AU, C = window.COMP, T = window.TABS;
  const B = window.BRAND || {};

  // Ana sekmeler — şimdilik yalnızca "AI Trafik Analizi" aktif; diğerleri ileride eklenecek
  const MAIN_TABS = [
    { id:'ai', label:'AI Trafik Analizi' },
    { id:'organik', label:'Organik Trafik', soon:true },
    { id:'total', label:'Total Trafik', soon:true },
    { id:'gsc', label:'GSC Analizi', soon:true },
  ];
  const SUB_TABS = [
    { id:'ozet',   label:'Özet',                 Comp:T.Ozet,         series:true  },
    { id:'trend',  label:'Aylık Trend',          Comp:T.Trend,        series:true  },
    { id:'ptype',  label:'Sayfa Tipi',           Comp:T.PageTypes,    snapshot:true },
    { id:'lp',     label:'Landing Page',         Comp:T.LandingPages, snapshot:true },
    { id:'brand',  label:'Marka & Ürün',         Comp:T.BrandProduct, snapshot:true },
    { id:'noconv', label:'Dönüşüm Fırsatı',      Comp:T.NoConvert,    snapshot:true },
    { id:'llms',   label:'llms.txt Etkisi',      Comp:T.LlmsImpact,   series:true  },
  ];

  function App() {
    const [mainTab, setMainTab] = useState('ai');
    const [subTab, setSubTab] = useState('ozet');
    const [theme, setTheme] = useState('light');
    const [selMonths, setSelMonths] = useState(new Set());
    const [filters, setFilters] = useState({ ptypes:[], brands:[], search:'' });
    const [selectedLp, setSelectedLp] = useState(null);

    function toggleTheme(){ const n=theme==='dark'?'light':'dark'; document.documentElement.setAttribute('data-theme',n); setTheme(n); }
    function navTo(id, patch){ if (patch) setFilters(f=>({...f, ...patch})); setSelectedLp(null); setSubTab(id); window.scrollTo({top:0,behavior:'smooth'}); }

    const allRows = AU.ROWS;
    const rows = useMemo(()=>AU.inMonths(allRows, selMonths), [selMonths]);
    const def = SUB_TABS.find(t=>t.id===subTab);
    const showFilter = def.snapshot || def.id==='ozet';

    function renderSub(){
      switch(subTab){
        case 'ozet':   return h(def.Comp, { rows, allRows, navTo });
        case 'trend':  return h(def.Comp, { rows, allRows });
        case 'lp':     return h(def.Comp, { rows, filters, setFilters, selectedLp, setSelectedLp });
        case 'ptype':  return h(def.Comp, { rows, navTo });
        case 'brand':  return h(def.Comp, { rows });
        case 'noconv': return h(def.Comp, { rows });
        case 'llms':   return h(def.Comp, { allRows });
      }
    }

    return h('div', null,
      // Header
      h('div', { className:'topbar' },
        h('div', { className:'logo' },
          h('img', { src:'assets/brand-logo.svg', alt:B.name||'Özdilekteyim', style:{height:30, marginRight:14, filter:'brightness(0) invert(1)', flexShrink:0}, onError:(e)=>{e.target.style.display='none';} }),
          h('div', { className:'title-block' },
            h('div', { className:'subtitle' }, B.subtitle || ''),
            h('div', { className:'title' }, B.title || ''))
        ),
        h('div', { className:'spacer' }),
        h('div', { className:'header-right' },
          h('button', { className:'theme-toggle', onClick:toggleTheme, title:'Tema değiştir' },
            h('span',{className:'tt-icon'}, theme==='dark'?'☀':'☾'), theme==='dark'?'Açık':'Koyu'),
          h('div', { className:'inbound-logo-wrap' }, h('img',{src:'assets/agency-logo.png', alt:'Inbound', style:{height:20, display:'block'}, onError:(e)=>{e.target.replaceWith(Object.assign(document.createElement('span'),{textContent:'Inbound',style:'color:#fff;font-weight:700;font-size:13px'}));}})))
      ),
      // Ana sekmeler (yalnızca aktif olanlar; "yakında" olanlar gizli)
      MAIN_TABS.filter(t=>!t.soon).length>1 ? h('div', { className:'main-tabs' },
        MAIN_TABS.filter(t=>!t.soon).map(t => h('button', { key:t.id, className:'main-tab'+(mainTab===t.id?' active':''), onClick:()=>setMainTab(t.id) }, t.label))
      ) : null,
      // Alt sekmeler
      h('div', { className:'tabs', role:'tablist' },
        SUB_TABS.map(t => h('button', { key:t.id, className:'tab'+(subTab===t.id?' active':''), 'aria-selected':subTab===t.id,
          onClick:()=>{ setSubTab(t.id); window.scrollTo({top:0,behavior:'smooth'}); } }, t.label))
      ),
      // İçerik
      h('div', { className:'content' },
        showFilter ? h('div', { className:'ai-toc', style:{gap:'8px', alignItems:'center'} },
          h('span', { style:{fontSize:'12px',fontWeight:700,color:'var(--ink-2)',marginRight:'4px'} }, 'Ay filtresi:'),
          h(C.MonthFilter, { months:AU.MONTHS, selected:selMonths, onChange:setSelMonths })
        ) : null,
        h('div', { className:'tab-content-anim', key:subTab+'|'+theme }, renderSub())
      ),
      // Footer
      h('div', { style:{textAlign:'center',padding:'10px 20px 30px',color:'var(--ink-3)',fontSize:'11.5px'} },
        'Özdilekteyim · AI (ChatGPT referral) Trafik Analizi · Inbound · Üretim: '+AU.META.generatedAt+' · '+AU.META.rowCount+' satır')
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
