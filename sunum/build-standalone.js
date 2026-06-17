#!/usr/bin/env node
/* build-standalone.js — sunum/deck.html'i tek self-contained HTML'e dönüştürür.
 * - colors_and_type.css + slides.css inline (@font-face kaldırılır, fontlar Google Fonts CDN)
 * - deck-stage.js inline
 * - logo PNG'leri base64 data URI olarak gömülür (img src + css url)
 * Çıktı: sunum/deck-standalone.html  (çift tıkla açılır tek dosya)
 */
const fs = require('fs');
const path = require('path');
const D = __dirname;
const read = f => fs.readFileSync(path.join(D, f), 'utf8');

let deck = read('deck.html');
let colors = read('colors_and_type.css');
let slides = read('slides.css');
const stage = read('deck-stage.js');

// 1) @font-face bloklarını kaldır (Google Fonts CDN ile değiştirilecek)
colors = colors.replace(/@font-face\s*\{[^}]*\}/g, '').replace(/^\s*\n/gm, '');
// slides.css'in başındaki @import'u sil (colors'ı elle önüne koyacağız)
slides = slides.replace(/@import\s+url\([^)]*\);?/g, '');
let css = colors + '\n' + slides;

// 2) logo PNG'lerini base64 olarak göm (hem css url hem img src)
const ASSETS = ['inbound-big-o-white.png','inbound-wordmark-white.png','inbound-o-white.png','inbound-o-teal.png'];
const dataUri = {};
for (const a of ASSETS) {
  const b64 = fs.readFileSync(path.join(D, 'assets', a)).toString('base64');
  dataUri[a] = `data:image/png;base64,${b64}`;
}
const swap = (s) => {
  for (const a of ASSETS) {
    s = s.split('assets/'+a).join(dataUri[a]);
  }
  return s;
};
css = swap(css);
deck = swap(deck);

// 3) deck.html'den <link slides.css> ve <script deck-stage.js> referanslarını çıkar,
//    inline <style> ve <script> ile değiştir; Google Fonts CDN ekle
const fontsLink =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">';

deck = deck.replace(/<link rel="stylesheet" href="slides\.css">/, fontsLink + '\n<style>\n' + css + '\n</style>');
deck = deck.replace(/<script src="deck-stage\.js"><\/script>/, '<script>\n' + stage + '\n</script>');

fs.writeFileSync(path.join(D, 'deck-standalone.html'), deck);
const kb = (fs.statSync(path.join(D, 'deck-standalone.html')).size/1024).toFixed(0);
console.log('✓ sunum/deck-standalone.html yazıldı ('+kb+' KB) — tek dosya, çift tıkla açılır');
