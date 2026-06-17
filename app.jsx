// app.jsx — uygulama kabuğu
(function(){
  const h = React.createElement;
  const { useState, useMemo } = React;
  const AU = window.AU, C = window.COMP, T = window.TABS;
  const B = window.BRAND || {};

  const TAB_DEFS = [
    { id:'ozet',   label:'Özet',            Comp:T.Ozet,         series:true  },
    { id:'trend',  label:'Aylık Trend',     Comp:T.Trend,        series:true  },
    { id:'lp',     label:'Landing Page',    Comp:T.LandingPages, snapshot:true },
    { id:'ptype',  label:'Sayfa Tipi',      Comp:T.PageTypes,    snapshot:true },
    { id:'brand',  label:'Marka & Ürün',    Comp:T.BrandProduct, snapshot:true },
    { id:'noconv', label:'Dönüşmeyen',      Comp:T.NoConvert,    snapshot:true },
    { id:'llms',   label:'llms.txt Etkisi', Comp:T.LlmsImpact,   series:true  },
  ];

  function ThemeToggle({theme, onToggle}) {
    return h('button', { className:'chip-btn inbound-ctrl', onClick:onToggle, title:'Tema değiştir',
      style:{background:'rgba(255,255,255,.16)', color:'#fff', border:'1px solid rgba(255,255,255,.3)'} },
      theme==='dark' ? '☀ Açık' : '🌙 Koyu');
  }

  function App() {
    const [tab, setTab] = useState('ozet');
    const [theme, setTheme] = useState('light');
    const [selMonths, setSelMonths] = useState(new Set());

    function toggleTheme(){
      const next = theme==='dark'?'light':'dark';
      document.documentElement.setAttribute('data-theme', next);
      setTheme(next);
    }

    const allRows = AU.ROWS;
    const rows = useMemo(()=>AU.inMonths(allRows, selMonths), [selMonths]);
    const def = TAB_DEFS.find(t=>t.id===tab);
    const showFilter = def.snapshot || def.id==='ozet';

    return h('div', null,
      // —— Header ——
      h('div', { className:'topbar' },
        h('div', { className:'logo' },
          h('div', { className:'logo-dot' }),
          h('div', { className:'title-block' },
            h('div', { style:{fontFamily:'Bricolage Grotesque',fontWeight:700,fontSize:'17px',color:'#fff'} }, B.name || 'Özdilekteyim'),
            h('div', { className:'subtitle' }, B.subtitle || '')
          )
        ),
        h('div', { className:'spacer' }),
        h('div', { style:{color:'#fff',fontSize:'13px',fontWeight:600,opacity:.92,marginRight:'8px'} }, B.title || ''),
        h('div', { className:'inbound-brand' },
          h('div', { className:'inbound-logo-wrap', style:{background:'rgba(255,255,255,.16)'} },
            h('span', { style:{color:'#fff',fontWeight:700,fontSize:'13px',letterSpacing:'.02em'} }, 'Inbound')),
          h(ThemeToggle, { theme, onToggle:toggleTheme })
        )
      ),
      // —— ToC / tab navigasyonu ——
      h('div', { className:'tabs', role:'tablist' },
        TAB_DEFS.map(t => h('button', {
          key:t.id, className:'tab'+(tab===t.id?' active':''), 'aria-selected':tab===t.id,
          onClick:()=>{ setTab(t.id); window.scrollTo({top:0,behavior:'smooth'}); }
        }, t.label))
      ),
      // —— İçerik ——
      h('div', { className:'content' },
        showFilter ? h('div', { className:'ai-toc', style:{gap:'8px', alignItems:'center'} },
          h('span', { style:{fontSize:'12px',fontWeight:700,color:'var(--ink-2)',marginRight:'4px'} }, 'Ay filtresi:'),
          h(C.MonthFilter, { months:AU.MONTHS, selected:selMonths, onChange:setSelMonths })
        ) : null,
        h('div', { className:'tab-content-anim', key:tab+'|'+theme+'|'+(selMonths.size) },
          h(def.Comp, { rows, allRows, selMonths })
        )
      ),
      // —— Footer ——
      h('div', { style:{textAlign:'center',padding:'10px 20px 30px',color:'var(--ink-3)',fontSize:'11.5px'} },
        'Özdilekteyim · AI (ChatGPT referral) Trafik Analizi · Inbound · Üretim: '+AU.META.generatedAt+
        ' · '+AU.META.rowCount+' satır'+(AU.META.isSample?' (örneklem)':'')
      )
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
