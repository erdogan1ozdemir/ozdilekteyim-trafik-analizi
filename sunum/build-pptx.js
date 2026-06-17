// build-pptx.js — Özdilekteyim AI Trafik Analizi sunumunun düzenlenebilir PPTX sürümü
const PptxGenJS = require('pptxgenjs');
const path = require('path');
const A = f => path.join(__dirname, 'assets', f);

const CORAL='FF7B52', CORALD='E85F36', TEAL='10332F', TEAL2='1A4238', INK='10332F', INK2='4A4A4A', INK3='8A8A8A',
      LINE='E0E0E0', MINT='E8F5E9', GREEN='2E7D32', GREENW='C8E6C9', RED='D32F2F', REDW='FFCDD2', BLUE='1565C0',
      GOLD='F5A623', WHITE='FFFFFF', BG='FAF8F5';
const HF='Calibri', BF='Calibri';

const p = new PptxGenJS();
p.defineLayout({ name:'W', width:13.33, height:7.5 });
p.layout='W';
p.author='Inbound'; p.company='Inbound'; p.title='Özdilekteyim · AI Trafik Analizi';

const W=13.33, H=7.5;
function breadcrumb(s, sec, title){ s.addText([{text:sec,options:{bold:true,color:CORAL}},{text:'   |   '+title,options:{color:CORAL}}],{x:0.5,y:0.28,w:11,h:0.3,fontFace:HF,fontSize:11,align:'left'}); }
function logoTeal(s){ try{ s.addImage({path:A('inbound-o-teal.png'), x:0.5, y:6.85, w:0.32, h:0.32}); }catch(e){} }
function sourcePill(s, txt){ s.addShape(p.ShapeType.roundRect,{x:1.0,y:6.82,w:2.7,h:0.38,fill:{color:CORAL},rectRadius:0.08,line:{type:'none'}}); s.addText(txt,{x:1.0,y:6.82,w:2.7,h:0.38,fontFace:HF,fontSize:9,bold:true,color:WHITE,align:'center',valign:'middle'}); }
function title(s, parts, x=0.5, y=0.85, sz=30){ s.addText(parts,{x,y,w:11.5,h:0.7,fontFace:HF,fontSize:sz,bold:true,color:INK,align:'left'}); }
function hl(t){ return {text:t,options:{highlight:CORAL}}; }

// 01 KAPAK
let s=p.addSlide(); s.background={color:CORAL};
try{ s.addImage({path:A('inbound-big-o-white.png'), x:9.2, y:-1.4, w:6, h:9, transparency:86}); }catch(e){}
s.addText('ÖZDİLEKTEYİM × INBOUND',{x:0,y:2.3,w:W,h:0.4,fontFace:HF,fontSize:14,color:WHITE,align:'center',charSpacing:3});
s.addText('AI Trafik Analizi',{x:0,y:2.75,w:W,h:1.3,fontFace:HF,fontSize:54,bold:true,color:WHITE,align:'center'});
s.addText('Yapay zeka kaynaklı referral trafiği · Kasım 2025 – Haziran 2026',{x:0,y:4.15,w:W,h:0.5,fontFace:BF,fontSize:18,color:WHITE,align:'center'});
try{ s.addImage({path:A('inbound-wordmark-white.png'), x:5.66, y:6.5, w:2, h:0.42}); }catch(e){}

// 02 AKIŞ
s=p.addSlide(); s.background={color:WHITE};
s.addShape(p.ShapeType.rect,{x:0,y:0,w:W*0.42,h:H,fill:{color:CORAL}});
s.addText('SUNUM AKIŞI',{x:0.6,y:2.4,w:4.5,h:0.35,fontFace:HF,fontSize:13,color:WHITE,charSpacing:2});
s.addText('İçerik\nHaritası',{x:0.6,y:2.75,w:4.5,h:1.6,fontFace:HF,fontSize:46,bold:true,color:WHITE,lineSpacingMultiple:1.0});
const agenda=[['01','Genel Görünüm','Hacim, ciro, dönüşüm ve aylık seyir'],['02','Trafik Nereye Gidiyor','Sayfa tipi, en değerli sayfalar, marka, yükselenler'],['03','Fırsat & llms.txt','Dönüşüm fırsatı sayfaları ve llms.txt etkisi'],['04','Sonraki Adımlar','Değerlendirilebilir aksiyon alanları']];
agenda.forEach((a,i)=>{ const y=1.4+i*1.45; s.addText(a[0],{x:6.1,y,w:6.5,h:0.3,fontFace:BF,fontSize:16,color:INK3}); s.addText(a[1],{x:6.1,y:y+0.28,w:6.5,h:0.4,fontFace:HF,fontSize:22,bold:true,color:TEAL}); s.addText(a[2],{x:6.1,y:y+0.72,w:6.5,h:0.35,fontFace:BF,fontSize:12,color:INK2}); });

function separator(num, label){ const s=p.addSlide(); s.background={color:TEAL};
  s.addText(num,{x:-0.5,y:2.3,w:5,h:4,fontFace:HF,fontSize:280,bold:true,color:TEAL2,align:'left'});
  s.addText(label,{x:0,y:3.0,w:W,h:1.2,fontFace:HF,fontSize:48,bold:true,color:WHITE,align:'center'});
  try{ s.addImage({path:A('inbound-o-white.png'),x:6.5,y:6.6,w:0.34,h:0.34}); }catch(e){}
}

// 03 BÖLÜM 01
separator('01','Genel Görünüm');

// 04 KPI
s=p.addSlide(); s.background={color:WHITE}; breadcrumb(s,'Genel Görünüm','Tek bakışta tablo');
title(s,[{text:'Tek bakışta '},hl('tablo')]);
s.addText('Kasım 2025 – Haziran 2026 döneminde yapay zeka kaynaklı (ağırlıkla ChatGPT) referral trafiğinin özeti gösterilmektedir.',{x:0.5,y:1.55,w:12,h:0.4,fontFace:BF,fontSize:13,color:INK2});
const kpis=[['38.237','Toplam AI Oturum',TEAL],['₺639K','Toplam Ciro',TEAL],['251','Transaction',CORAL],['₺2.544','AOV (işlem başına)',CORAL],['+%0,66','Dönüşüm (CR)',TEAL]];
kpis.forEach((k,i)=>{ const w=2.3,gap=0.18,x=0.5+i*(w+gap),y=2.3; s.addShape(p.ShapeType.roundRect,{x,y,w,h:1.9,fill:{color:k[2]},rectRadius:0.12,line:{type:'none'}});
  s.addText(k[0],{x,y:y+0.35,w,h:0.8,fontFace:HF,fontSize:34,bold:true,color:WHITE,align:'center'});
  s.addText(k[1],{x:x+0.1,y:y+1.25,w:w-0.2,h:0.5,fontFace:BF,fontSize:11,color:WHITE,align:'center'}); });
s.addText([{text:'➜  ',options:{color:CORAL,bold:true}},{text:'Kasım 2025',options:{bold:true,color:CORALD}},{text:' alışveriş kampanya dönemiyle (Efsane Cuma) güçlü bir başlangıç oluşturmuş; trafik sonraki aylarda yeniden Kasım seviyelerine yaklaşmış, '},{text:'Mayıs 2026',options:{bold:true,color:CORALD}},{text:'\'da bayram etkisiyle Kasım\'ı da aşmıştır.'}],{x:0.5,y:4.7,w:12.3,h:1,fontFace:BF,fontSize:14,color:INK,fill:{color:'FDEAE2'},align:'left',valign:'middle',margin:10});
logoTeal(s); sourcePill(s,'Kaynak: GA4 · AI referral');

// 05 AYLIK TREND (çift eksen line + aylık metrik tablosu)
s=p.addSlide(); s.background={color:WHITE}; breadcrumb(s,'Genel Görünüm','Aylık seyir');
title(s,[{text:'Aylık AI\'dan gelen '},hl('trafik & ciro')]);
const MON=['Kas 25','Ara 25','Oca 26','Şub 26','Mar 26','Nis 26','May 26','Haz 26'];
const SESS=[5264,4000,4703,3578,4762,4988,7575,3367], REV=[138985,47020,37897,56242,65071,89865,121636,81874], TX=[33,26,15,19,30,44,54,30];
const REVK=['₺139K','₺47K','₺38K','₺56K','₺65K','₺90K','₺122K','₺82K'];
const SESSF=['5.264','4.000','4.703','3.578','4.762','4.988','7.575','3.367'];
s.addChart([
  {type:p.ChartType.line,data:[{name:'Oturum',labels:MON,values:SESS}],options:{chartColors:[CORAL],lineSize:3,lineSmooth:true}},
  {type:p.ChartType.line,data:[{name:'Ciro (₺)',labels:MON,values:REV}],options:{chartColors:[GREEN],lineSize:3,lineSmooth:true,secondaryValAxis:true,secondaryCatAxis:true}}
],{x:0.5,y:1.55,w:12.3,h:2.55,showLegend:true,legendPos:'t',legendFontFace:BF,
   valAxes:[{valAxisLabelColor:CORAL,valGridLine:{style:'none'},valAxisLabelFontFace:BF},{valAxisLabelColor:GREEN,valGridLine:{style:'none'},valAxisLabelFontFace:BF}],
   catAxes:[{catAxisLabelColor:INK2,catAxisLabelFontFace:BF,catAxisLabelFontSize:9},{catAxisHidden:true}]});
// Aylık metrik tablosu (chart altında)
const hdr=[{text:'',options:{fill:{color:TEAL}}}].concat(MON.map(m=>({text:m,options:{bold:true,color:WHITE,fill:{color:TEAL},align:'center',fontSize:10}})));
const rOtr=[{text:'AI Oturum',options:{bold:true,color:CORALD}}].concat(SESSF.map(v=>({text:v,options:{align:'center',fontSize:11}})));
const rRev=[{text:'Ciro',options:{bold:true,color:GREEN}}].concat(REVK.map(v=>({text:v,options:{align:'center',fontSize:11}})));
const rTx=[{text:'Transaction',options:{bold:true,color:BLUE}}].concat(TX.map(v=>({text:String(v),options:{align:'center',fontSize:11}})));
s.addTable([hdr,rOtr,rRev,rTx],{x:0.5,y:4.35,w:12.3,colW:[1.7].concat(Array(8).fill(1.325)),fontFace:BF,fontSize:11,color:INK,rowH:0.42,border:{type:'solid',color:LINE,pt:0.5},valign:'middle'});
s.addText([{text:'➜  ',options:{color:CORAL,bold:true}},{text:'Kasım',options:{bold:true,color:CORALD}},{text:' Efsane Cuma ile dönemin en yüksek cirosunu (₺139K) oluşturmuş; '},{text:'Mayıs',options:{bold:true,color:CORALD}},{text:' bayram dönemiyle Kasım\'ı da aşmıştır. Haziran ayı bitmediği için chart düşüş gösterebilir.'}],{x:0.5,y:6.5,w:12.3,h:0.6,fontFace:BF,fontSize:12,color:INK});
logoTeal(s); sourcePill(s,'Kaynak: GA4 · AI referral');

// 06 BÖLÜM 02
separator('02','Trafik Nereye Gidiyor');

// 07 SAYFA TİPİ (doughnut + tablo)
s=p.addSlide(); s.background={color:WHITE}; breadcrumb(s,'Trafik Nereye Gidiyor','Sayfa tipi dağılımı');
title(s,[{text:'Sayfa tipine göre '},hl('dağılım')]);
s.addChart(p.ChartType.doughnut,[{name:'Oturum',labels:['Ürün','Market','Kategori','Sepet/Checkout','Anasayfa','Marka'],values:[29328,7193,952,235,173,162]}],
  {x:0.4,y:1.7,w:6,h:4.6,holeSize:62,chartColors:[CORAL,GREEN,BLUE,'8E24AA',GOLD,'00838F'],showLegend:true,legendPos:'r',legendFontFace:BF,legendFontSize:11,showValue:false});
const ptRows=[[{text:'Sayfa Tipi',options:{bold:true}},{text:'Oturum',options:{bold:true,align:'right'}},{text:'Pay',options:{bold:true,align:'right'}},{text:'Ciro',options:{bold:true,align:'right'}}]];
[['Ürün','29.328','%76,7','₺460.842'],['Market','7.193','%18,8','₺10.642'],['Kategori','952','%2,5','₺109.758'],['Sepet/Checkout','235','%0,6','₺49.730'],['Anasayfa','173','%0,5','₺0']].forEach(r=>ptRows.push([r[0],{text:r[1],options:{align:'right'}},{text:r[2],options:{align:'right'}},{text:r[3],options:{align:'right'}}]));
s.addTable(ptRows,{x:6.7,y:1.9,w:6.1,fontFace:BF,fontSize:12,color:INK,border:{type:'solid',color:LINE,pt:0.5},fill:{color:WHITE},rowH:0.4,valign:'middle',
  colW:[2.2,1.3,0.9,1.7]});
s.addText('AI trafiğinin %76,7\'si ürün sayfalarına yönelirken, kategori sayfaları az oturumla yüksek ciro getirmektedir.',{x:6.7,y:5.0,w:6.1,h:0.8,fontFace:BF,fontSize:12,color:INK2,italic:true});
logoTeal(s); sourcePill(s,'Kaynak: GA4 · AI referral');

// 08 EN DEĞERLİ SAYFALAR (3 kolon)
s=p.addSlide(); s.background={color:WHITE}; breadcrumb(s,'Trafik Nereye Gidiyor','En değerli sayfalar');
title(s,[{text:'En değerli '},hl('sayfalar')]);
const cols3=[['EN ÇOK OTURUM','Trafik',[['philips su arıtma','317'],['/magaza','235'],['sjcam kamera','195'],['anasayfa','173'],['özdilek point seti','98']]],
  ['EN ÇOK CİRO · ÜRÜN','Ciro',[['fissler vitavit prem.','₺20,0K'],['fissler vitaquick','₺16,0K'],['fissler vitavit mat','₺14,0K'],['özdilek pike takımı','₺11,9K'],['stanley termos','₺5,1K']]],
  ['EN ÇOK İŞLEM · ÜRÜN','Transaction',[['stanley termos','3'],['sjcam kamera','2'],['lumberjack ayakkabı','2'],['tefal tost makinesi','2'],['özdilek yorgan','2']]]];
cols3.forEach((c,i)=>{ const x=0.5+i*4.2,y=1.7; s.addShape(p.ShapeType.roundRect,{x,y,w:3.9,h:4.2,fill:{color:'FBFAF8'},line:{color:LINE,pt:1},rectRadius:0.1});
  s.addText(c[0],{x:x+0.25,y:y+0.25,w:3.4,h:0.3,fontFace:HF,fontSize:10,bold:true,color:CORAL,charSpacing:1});
  s.addText(c[1],{x:x+0.25,y:y+0.55,w:3.4,h:0.4,fontFace:HF,fontSize:18,bold:true,color:TEAL});
  const rows=c[2].map(r=>[{text:r[0],options:{fontSize:12,color:INK2}},{text:r[1],options:{fontSize:12,bold:true,color:CORALD,align:'right'}}]);
  s.addTable(rows,{x:x+0.25,y:y+1.15,w:3.4,colW:[2.3,1.1],fontFace:BF,rowH:0.42,border:{type:'solid',color:'F0EDE8',pt:0.5},valign:'middle'}); });
s.addText([{text:'➜  ',options:{color:CORAL,bold:true}},{text:'Cironun önemli bölümü sepet ve onay adımlarında toplanmakta; ürün düzeyinde Fissler düdüklü tencere serisi ve Stanley termos öne çıkmaktadır.'}],{x:0.5,y:6.1,w:12.3,h:0.6,fontFace:BF,fontSize:12.5,color:INK});
logoTeal(s); sourcePill(s,'Kaynak: GA4 · AI referral');

// 09 MARKA (bar + liste)
s=p.addSlide(); s.background={color:WHITE}; breadcrumb(s,'Trafik Nereye Gidiyor','Marka merceği');
title(s,[{text:'Marka '},hl('merceği')]);
s.addChart(p.ChartType.bar,[{name:'Oturum',labels:['Özdilek','Mavi','Adidas','Skechers','Philips','Pierre Cardin','Calvin Klein','Guess','Koton','Merrell'],values:[1823,1299,1232,867,847,610,588,542,472,454]}],
  {x:0.5,y:1.7,w:7.2,h:4.8,barDir:'bar',chartColors:[CORAL],showValue:true,dataLabelColor:INK,dataLabelFontFace:BF,dataLabelFontSize:10,catAxisLabelColor:INK,catAxisLabelFontFace:BF,valAxisHidden:true,showLegend:false,valGridLine:{style:'none'}});
const brTbl=[[{text:'Marka',options:{bold:true}},{text:'Oturum',options:{bold:true,align:'right'}},{text:'Ciro',options:{bold:true,align:'right'}},{text:'Tx',options:{bold:true,align:'right'}}]];
[['Özdilek','1.823','₺41,7K','12'],['Mavi','1.299','₺13,9K','11'],['Adidas','1.232','₺34,5K','13'],['Skechers','867','₺39,8K','9'],['Philips','847','₺12,7K','2'],['Pierre Cardin','610','₺22,5K','6'],['Calvin Klein','588','₺19,7K','4'],['Guess','542','₺6,8K','2'],['Koton','472','₺4,8K','4'],['Merrell','454','₺22,6K','4']].forEach(r=>brTbl.push([r[0],{text:r[1],options:{align:'right'}},{text:r[2],options:{align:'right'}},{text:r[3],options:{align:'right'}}]));
s.addTable(brTbl,{x:8.0,y:1.7,w:4.8,colW:[1.7,1.1,1.2,0.8],fontFace:BF,fontSize:10.5,color:INK,rowH:0.36,border:{type:'solid',color:LINE,pt:0.5},valign:'middle'});
logoTeal(s); sourcePill(s,'Kaynak: GA4 · AI referral');

// 10 YÜKSELENLER
s=p.addSlide(); s.background={color:WHITE}; breadcrumb(s,'Trafik Nereye Gidiyor','Zaman içinde yükselenler');
title(s,[{text:'Zaman içinde '},hl('yükselenler')]);
s.addText('Dönemin ilk yarısı (Kas–Şub) ile ikinci yarısı (Mar–Haz) arasındaki AI oturum artışı (Δ).',{x:0.5,y:1.55,w:12,h:0.4,fontFace:BF,fontSize:13,color:INK2});
s.addText('Yükselen markalar · Δ oturum',{x:0.5,y:2.1,w:6,h:0.35,fontFace:HF,fontSize:14,bold:true,color:CORALD});
s.addChart(p.ChartType.bar,[{name:'Δ Oturum',labels:['Özdilek','Adidas','Skechers','SJCAM','Philips','New Balance','Puma','Mavi','Urban Care','Under Armour'],values:[391,300,277,247,247,190,140,123,89,69]}],
  {x:0.5,y:2.5,w:6.5,h:3.8,barDir:'bar',chartColors:[CORAL],showValue:true,dataLabelColor:INK,dataLabelFontFace:BF,catAxisLabelColor:INK,catAxisLabelFontFace:BF,valAxisHidden:true,showLegend:false,valGridLine:{style:'none'}});
s.addText('Yükselen sayfalar / ürünler · Δ oturum',{x:7.4,y:2.1,w:5.4,h:0.35,fontFace:HF,fontSize:14,bold:true,color:CORALD});
const riseLp=[['philips su arıtma cihazı','+211'],['sjcam aksiyon kamera','+193'],['anasayfa','+153'],['özdilek point happy aile seti','+52'],['acton pocket camera gimbal','+44']].map(r=>[{text:r[0],options:{fontSize:12,color:INK2}},{text:r[1],options:{fontSize:12,bold:true,color:GREEN,align:'right'}}]);
s.addTable(riseLp,{x:7.4,y:2.55,w:5.4,colW:[4.1,1.3],fontFace:BF,rowH:0.45,border:{type:'solid',color:'F0EDE8',pt:0.5},valign:'middle'});
s.addText('Özdilek, Adidas ve Skechers ikinci yarıda en belirgin artışı; elektronikte Philips ve SJCAM öne çıkmaktadır.',{x:7.4,y:5.0,w:5.4,h:0.9,fontFace:BF,fontSize:12,color:INK2,italic:true});
logoTeal(s); sourcePill(s,'Kaynak: GA4 · AI referral');

// 11 BÖLÜM 03
separator('03','Fırsat & llms.txt');

// 12 DÖNÜŞÜM FIRSATI
s=p.addSlide(); s.background={color:WHITE}; breadcrumb(s,'Fırsat & llms.txt','Dönüşüm fırsatı sayfaları');
title(s,[{text:'AI oturumu yüksek, '},hl('dönüşüm fırsatı'),{text:' taşıyan sayfalar'}],0.5,0.85,28);
const fRows=[[{text:'Sayfa',options:{bold:true}},{text:'Tip',options:{bold:true}},{text:'Oturum',options:{bold:true,align:'right'}},{text:'İşlem',options:{bold:true,align:'right'}}]];
[['philips su arıtma cihazı','Ürün','317','0'],['anasayfa','Anasayfa','173','0'],['özdilek point happy aile seti','Ürün','98','0'],['philips hava temizleme cihazı','Ürün','67','0'],['acton pocket camera gimbal','Ürün','62','0'],['acton selfie aksiyon kamerası','Ürün','54','0'],['dyson supersonic saç kurutma','Ürün','47','0'],['tcl movetime çocuk saati','Ürün','42','0'],['getorix oyun yarış direksiyonu','Ürün','41','0'],['acton instant print fotoğraf mak.','Ürün','38','0']].forEach(r=>fRows.push([r[0],r[1],{text:r[2],options:{align:'right'}},{text:r[3],options:{align:'right',fill:{color:REDW},color:RED,bold:true}}]));
s.addTable(fRows,{x:0.5,y:1.8,w:7.3,colW:[3.6,1.5,1.1,1.1],fontFace:BF,fontSize:11,color:INK,rowH:0.4,border:{type:'solid',color:LINE,pt:0.5},valign:'middle'});
s.addText([{text:'Philips',options:{bold:true,color:CORALD}},{text:' ürün sayfaları yüksek ilgi görmekte fakat işleme dönüşmemektedir; fiyat, stok ve içerik bütünlüğü değerlendirilebilir.\n\n'},{text:'Acton',options:{bold:true,color:CORALD}},{text:' kamera ürünleri tekrarlı şekilde listede yer almaktadır.\n\nAnasayfa girişlerinin ilgili kategori/ürünlere yönlendirme akışı gözden geçirilebilir.'}],{x:8.1,y:1.9,w:4.7,h:4,fontFace:BF,fontSize:13,color:INK2,valign:'top'});
logoTeal(s); sourcePill(s,'Kaynak: GA4 · AI referral');

// 13 llms.txt ETKİSİ
s=p.addSlide(); s.background={color:WHITE}; breadcrumb(s,'Fırsat & llms.txt','llms.txt etkisi');
title(s,[{text:'llms.txt '},hl('etkisi')]);
s.addText('llms.txt Şubat 2026\'da eklendi; "Önemli Sayfalar" altında 83 sayfa tanımlı, 62\'si veride görünüyor.',{x:0.5,y:1.5,w:12,h:0.35,fontFace:BF,fontSize:12.5,color:INK2});
const llmsK=[['37 → 40','llms.txt doğrudan oturum (Şubat öncesi → sonrası)',CORAL],['12.359','İlişkili ürün keşfi · oturum',TEAL],['13.930','Diğer · Şubat öncesi',TEAL],['24.230','Diğer · Şubat sonrası',TEAL]];
llmsK.forEach((k,i)=>{ const w=2.95,x=0.5+i*(w+0.13),y=2.0; s.addShape(p.ShapeType.roundRect,{x,y,w,h:1.5,fill:{color:k[2]},rectRadius:0.1,line:{type:'none'}});
  s.addText(k[0],{x,y:y+0.2,w,h:0.6,fontFace:HF,fontSize:26,bold:true,color:WHITE,align:'center'});
  s.addText(k[1],{x:x+0.12,y:y+0.85,w:w-0.24,h:0.55,fontFace:BF,fontSize:9.5,color:WHITE,align:'center'}); });
s.addChart([
  {type:p.ChartType.line,data:[{name:'llms.txt sayfaları',labels:MON,values:[13,11,13,19,7,6,5,3]}],options:{chartColors:[CORAL],lineSize:2.5,lineSmooth:true}},
  {type:p.ChartType.line,data:[{name:'Diğer sayfalar',labels:MON,values:[5251,3989,4690,3559,4755,4982,7570,3364]}],options:{chartColors:[BLUE],lineSize:2.5,lineSmooth:true,secondaryValAxis:true,secondaryCatAxis:true}}
],{x:0.5,y:3.8,w:12.3,h:2.7,showLegend:true,legendPos:'t',legendFontFace:BF,
   valAxes:[{valAxisLabelColor:CORAL,valGridLine:{style:'none'},valAxisLabelFontFace:BF},{valAxisLabelColor:BLUE,valGridLine:{style:'none'},valAxisLabelFontFace:BF}],
   catAxes:[{catAxisLabelColor:INK2,catAxisLabelFontFace:BF},{catAxisHidden:true}]});
logoTeal(s); sourcePill(s,'Kaynak: GA4 · llms.txt');

// 14 llms ÜRÜN KEŞFİ
s=p.addSlide(); s.background={color:WHITE}; breadcrumb(s,'Fırsat & llms.txt','Ürün keşfi · doğrulanmış');
title(s,[{text:'llms.txt sayfaları nasıl '},hl('ürün keşfine'),{text:' dönüşüyor?'}],0.5,0.85,26);
s.addText([{text:'Yöntem: ',options:{bold:true}},{text:'llms.txt\'deki her sayfa bir markaya/kategoriye karşılık gelir. İlişkili ürünler aynı markaya/kategoriye bağlı ürün sayfalarıdır; bağlılık ürün sayfasındaki kategori bilgisinden teyit edilmiştir. Toplamda her ürün yalnızca bir kez sayılır.'}],{x:0.5,y:1.5,w:12.3,h:0.7,fontFace:BF,fontSize:12,color:INK2});
const kRows=[[{text:'Marka (llms.txt)',options:{bold:true}},{text:'llms sayfa',options:{bold:true,align:'right'}},{text:'AI trafikli ürün',options:{bold:true,align:'right'}},{text:'İlişkili oturum',options:{bold:true,align:'right'}}]];
[['Mavi','4','1.052','1.254'],['Adidas','3','789','1.224'],['Skechers','3','559','862'],['Pierre Cardin','1','546','605'],['Calvin Klein','1','417','583'],['Guess','2','466','530']].forEach((r,idx)=>kRows.push([r[0],{text:r[1],options:{align:'right'}},{text:r[2],options:{align:'right'}},{text:r[3],options:{align:'right',bold:idx<2,color:idx<2?GREEN:INK,fill:idx<2?{color:GREENW}:undefined}}]));
s.addTable(kRows,{x:0.5,y:2.4,w:7.0,colW:[2.6,1.4,1.6,1.4],fontFace:BF,fontSize:12,color:INK,rowH:0.45,border:{type:'solid',color:LINE,pt:0.5},valign:'middle'});
s.addShape(p.ShapeType.roundRect,{x:7.9,y:2.4,w:4.9,h:3.0,fill:{color:MINT},rectRadius:0.1,line:{type:'none'}});
s.addText([{text:'Örnek · bağlı olduğu marka\n',options:{bold:true,color:TEAL,fontSize:13}},
  {text:'llms.txt sayfası: ',options:{bold:true}},{text:'Adidas Erkek Spor Ayakkabı\n',options:{}},{text:'kategori: Ayakkabı › Spor · marka: Adidas\n\n',options:{color:INK3,fontSize:11}},
  {text:'İlişkili ürün: ',options:{bold:true}},{text:'Adidas Duramo Speed\n',options:{}},{text:'kategori: Spor Ayakkabıları · marka: Adidas\n\n',options:{color:INK3,fontSize:11}},
  {text:'Aynı markaya bağlı 789 Adidas ürünü, toplam 1.224 oturum AI trafiği almıştır.',options:{bold:true,color:TEAL}}],{x:8.1,y:2.55,w:4.5,h:2.7,fontFace:BF,fontSize:12,color:INK2,valign:'top'});
s.addText([{text:'➜  ',options:{color:CORAL,bold:true}},{text:'Toplam ',options:{}},{text:'12.359 oturum',options:{bold:true,color:CORALD}},{text:' (her ürün bir kez sayılarak) llms.txt\'deki marka ve kategorilerin ürün sayfalarına ulaşmıştır.'}],{x:0.5,y:5.7,w:12.3,h:0.6,fontFace:BF,fontSize:12.5,color:INK});
logoTeal(s); sourcePill(s,'Kaynak: GA4 · llms.txt · sayfa kategori bilgisi');

// 15 SONRAKİ ADIMLAR
s=p.addSlide(); s.background={color:WHITE}; breadcrumb(s,'Sonraki Adımlar','Değerlendirilebilir alanlar');
title(s,[{text:'Sonraki '},hl('adımlar')]);
const steps=[['01','Dönüşüm akışı','Yüksek AI oturumu alan ürün sayfalarında fiyat, stok ve içerik bütünlüğünün değerlendirilmesi.',false],
  ['02','llms.txt kapsamı','Öne çıkan ürün sayfalarının llms.txt kapsamına eklenmesi ve etkisinin takibi.',false],
  ['03','llms-full.txt & dinamik üretim','Google\'ın optimizasyon dokümanlarına llms.txt\'yi eklemesiyle bu yapı değer kazanmaktadır; kapsamlı bir llms-full.txt\'nin dinamik üretimi değerlendirilebilir.',false],
  ['04','İçerik Üretimi - Kategori & Ürün','Hero ürün ve öne çıkan kategorilere SEO + GEO uyumlu içerik. Kategori içerikleri üretiliyor; ürün içerikleri planlandı.',true],
  ['05','Sürekli takip','Aylık AI trafik raporunun düzenli güncellenmesi ve kanal performansının izlenmesi.',false]];
steps.forEach((st,i)=>{ const col=i%3,row=Math.floor(i/3); const x=0.5+col*4.2,y=1.8+row*2.55; s.addShape(p.ShapeType.roundRect,{x,y,w:3.9,h:2.3,fill:{color:'FBFAF8'},line:{color:LINE,pt:1},rectRadius:0.1});
  s.addText(st[0],{x:x+0.2,y:y+0.15,w:1.5,h:0.7,fontFace:HF,fontSize:34,bold:true,color:'F3CDBB'});
  if(st[3]) s.addText('IN PROGRESS',{x:x+2.0,y:y+0.25,w:1.7,h:0.3,fontFace:HF,fontSize:8,bold:true,color:WHITE,fill:{color:GOLD},align:'center',valign:'middle',rectRadius:0.1});
  s.addText(st[1],{x:x+0.2,y:y+0.85,w:3.5,h:0.5,fontFace:HF,fontSize:15,bold:true,color:TEAL});
  s.addText(st[2],{x:x+0.2,y:y+1.35,w:3.5,h:0.85,fontFace:BF,fontSize:11,color:INK2}); });
logoTeal(s);

// 16 KAPANIŞ
s=p.addSlide(); s.background={color:CORAL};
try{ s.addImage({path:A('inbound-big-o-white.png'),x:-1.5,y:-1,w:6,h:9,transparency:86}); }catch(e){}
s.addText('Teşekkürler',{x:0,y:2.7,w:W,h:1.4,fontFace:HF,fontSize:60,bold:true,color:WHITE,align:'center'});
s.addText('welcome@inbound.com.tr',{x:0,y:4.2,w:W,h:0.4,fontFace:BF,fontSize:16,color:WHITE,align:'center'});
s.addText('Özdilekteyim × Inbound · AI Trafik Analizi · © 2026 Inbound',{x:0,y:4.65,w:W,h:0.35,fontFace:BF,fontSize:11,color:WHITE,align:'center'});

const OUT = path.join(__dirname, 'Ozdilekteyim-AI-Trafik-Analizi-Sunum.pptx');
p.writeFile({ fileName: OUT }).then(()=>console.log('✓ PPTX yazıldı:', OUT));
