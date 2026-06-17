// build-pptx-img.js — slides_img/ PNG'lerini tam-sayfa görsel olarak PPTX'e gömer.
// Böylece PPTX, HTML deck ile birebir aynı görünür (renkler/detaylar dahil).
// Önce render-slides.js çalıştırılmalı.
const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, 'slides_img');
const files = fs.readdirSync(dir).filter(f => /^slide-\d+\.png$/.test(f)).sort();
if (!files.length) { console.error('slides_img/ boş — önce render-slides.js çalıştır'); process.exit(1); }

const p = new PptxGenJS();
p.defineLayout({ name: 'W', width: 13.33, height: 7.5 });
p.layout = 'W';
p.author = 'Inbound'; p.company = 'Inbound'; p.title = 'Özdilekteyim · AI Trafik Analizi';

for (const f of files) {
  const s = p.addSlide();
  s.addImage({ path: path.join(dir, f), x: 0, y: 0, w: 13.33, h: 7.5 });
}

const OUT = path.join(__dirname, 'Ozdilekteyim-AI-Trafik-Analizi-Sunum.pptx');
p.writeFile({ fileName: OUT }).then(() => {
  const mb = (fs.statSync(OUT).size / 1048576).toFixed(2);
  console.log('✓ PPTX (görsel-temelli, HTML ile birebir): ' + files.length + ' slayt, ' + mb + ' MB → ' + OUT);
});
