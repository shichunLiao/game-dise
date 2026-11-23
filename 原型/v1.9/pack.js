// 打包：把 原型/assets/ 的 PNG 與本資料夾 art_kimi/ 的 SVG 內嵌進單檔。
// 用法：node 原型/v1.9/pack.js（也可直接在本資料夾執行 node pack.js）
//
// index.html 從 ../assets/ 載圖；用 file:// 直接打開時，瀏覽器不讓程式讀圖裡的像素（染色、描紅邊都要讀），
// 整套會退回 v1.5 的程式畫法。打包版把每張圖轉成 data: 網址放進 window.__ART，
// 遊戲裡的 artSrc() 先查這張表，所以雙擊打開也有圖。
// 只內嵌圖；three.js 與字體仍和 v1.5 一樣從網路載（沒網路時與 v1.5 相同）。
// index.html 改過之後要重跑一次；index.packed.html 是產物，不要直接改它。
const fs = require('fs');
const path = require('path');

const here = __dirname;
const src = path.join(here, 'index.html');
const out = path.join(here, 'index.packed.html');
const assets = path.join(here, '..', 'assets');
const kimiArt = path.join(here, 'art_kimi');
const DIRS = ['cards', 'crowd', 'deco', 'relics', 'ui', 'fx', 'night', 'draft'];

const html = fs.readFileSync(src, 'utf8');
const art = {};
let bytes = 0;
for (const d of DIRS) {
  for (const f of fs.readdirSync(path.join(assets, d)).sort()) {
    if (!f.endsWith('.png')) continue;
    const buf = fs.readFileSync(path.join(assets, d, f));
    bytes += buf.length;
    art[`${d}/${f}`] = `data:image/png;base64,${buf.toString('base64')}`;
  }
}
if (fs.existsSync(kimiArt)) {
  for (const f of fs.readdirSync(kimiArt).sort()) {
    if (!f.endsWith('.svg')) continue;
    const buf = fs.readFileSync(path.join(kimiArt, f));
    bytes += buf.length;
    art[`art_kimi/${f}`] = `data:image/svg+xml;base64,${buf.toString('base64')}`;
  }
}
const engine = html.split('/* ENGINE START */')[1].split('/* ENGINE END */')[0];
const listSrc = html.match(/const ART_FILES = (\(\(\) => \{[\s\S]*?\n\}\)\(\));/);
if (!listSrc) throw new Error('index.html 裡找不到 ART_FILES，沒有產出');
const artConfig = html.match(/const USE_KIMI_SVG =[\s\S]*?(?=const ART_FILES =)/);
if (!artConfig) throw new Error('index.html 裡找不到新貨圖開關與 artLayer，沒有產出');
const want = new Function(`${engine}; ${artConfig[0]} return ${listSrc[1]};`)();
const missing = want.filter(p => !art[p]);
if (missing.length) throw new Error(`素材少了 ${missing.length} 張：${missing.join('、')}`);

const anchor = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';
if (html.split(anchor).length !== 2) throw new Error('index.html 裡找不到 three.js 那一行（或不只一行），沒有產出');
const inject = `<script>/* 打包內嵌的圖（${Object.keys(art).length} 張），由 pack.js 產生 */window.__ART=${JSON.stringify(art)};</script>\n`;
const charset = '<meta charset="utf-8">\n';
if (!html.startsWith(charset)) throw new Error('index.html 第一行不是 <meta charset="utf-8">，沒有產出');
const note = '<!-- 這個檔案由 原型/v1.9/pack.js 從 index.html 產生，圖已內嵌，可以直接雙擊打開。要改請改 index.html 再重跑 pack.js。 -->\n';
const packed = html
  .replace(charset, charset + note)
  .replace('<title>底色·戏城 v1.9</title>', '<title>底色·戏城 v1.9（单文件）</title>')
  .replace(anchor, inject + anchor);

fs.writeFileSync(out, packed);
const mb = n => (n / 1048576).toFixed(2);
console.log(`內嵌 ${Object.keys(art).length} 張圖（原檔 ${mb(bytes)} MB）→ ${path.relative(process.cwd(), out)}（${mb(Buffer.byteLength(packed))} MB）`);
