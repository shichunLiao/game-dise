// 戏城 v1.9 UI 回归：作品名、旧存档键、「家」印章层叠、元宵／后台安全间距。
// 需要 Google Chrome 与 playwright-core；NODE_PATH 可指向外部 node_modules。
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
const CASES = [
  ['desktop', { width: 1366, height: 768 }],
  ['laptop', { width: 1024, height: 640 }],
  ['mobile', { width: 390, height: 844 }],
];
const PAGES = ['index.html', 'index.packed.html'];
let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? '通过' : '失败'}  ${msg}`); if (!cond) fails += 1; };

const overlap = (a, b, gap = 0) => !!a && !!b && a.right + gap > b.left && b.right + gap > a.left && a.bottom + gap > b.top && b.bottom + gap > a.top;
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

(async () => {
  const source = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const repo = path.join(__dirname, '..', '..');
  let staleNames = '';
  try {
    staleNames = execFileSync('git', ['-c', 'core.quotepath=false', 'grep', '-n', '-E', '底色[·](戏城|戲城)|<title>底色|<div class="t">底色</div>|github\\.io/game-dise', '--', '*.md', '*.html', '*.js', '*.py', '*.json', ':!*.log', ':!**/*.log', ':!原型/v1.9/check_ui.js'], { cwd: repo, encoding: 'utf8' });
  } catch (e) {
    if (e.status !== 1) throw e;
  }
  ok(!staleNames, `仓库作品名／Pages 链接审计无旧写法${staleNames ? `：\n${staleNames}` : ''}`);
  ok(fs.existsSync(path.join(repo, '設計', '戏城_遊戲概念說明.pdf')) && !fs.existsSync(path.join(repo, '設計', '底色_遊戲概念說明.pdf')), '概念说明下载文件名同步改为《戏城》');
  ok(/const KEY = 'dise-v19', OLD_KEY = null/.test(source), '继续使用 dise-v19，旧存档键不改名');
  ok(/<title>戏城 v1\.9<\/title>/.test(source) && /property="og:title" content="戏城 v1\.9"/.test(source) && /name="twitter:title" content="戏城 v1\.9"/.test(source), '浏览器、Open Graph 与分享卡标题统一为《戏城》');
  ok((source.match(/https:\/\/shichunliao\.github\.io\/game-xicheng\//g) || []).length >= 2 && !/github\.io\/game-dise/.test(source), 'canonical 与分享 URL 指向 game-xicheng');
  ok(!/<title>底色|<div class="t">底色<\/div>|底色[·]戏城|底色[·]戲城/.test(source), 'v1.9 没有把旧作品名留在标题位置');

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
  for (const file of PAGES) for (const [mode, viewport] of CASES) {
    const ctx = await browser.newContext({ viewport, isMobile: mode === 'mobile', hasTouch: mode === 'mobile' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(`http://127.0.0.1:${server.address().port}/${path.basename(__dirname)}/${file}`);
    await page.waitForSelector('[data-act="start"]', { timeout: 30000 });
    const title = await page.title();
    ok(/^戏城 v1\.9/.test(title), `${file}／${mode} 页面标题是《戏城》`);

    await page.evaluate(() => {
      startGame('回归'); S.tut.off = true; coach.lesson = null;
      S.day = 3; beginDay(S); view = 'morning'; panel = null; coach.lesson = null;
      S.known[3] = true;
      S.recipes[3] = ['等', '累', '忙', '想说'].map(look => ({ look, n: 1 }));
      S.T.need = needOf(S); S.T.box = S.deck.slice(0, 10).map(c => c.id); refresh();
      coach.lesson = null; document.querySelector('#coach').hidden = true;
    });
    await page.waitForTimeout(100);
    const marks = await page.evaluate(() => [...document.querySelectorAll('#hand .wtag')].map(el => {
      const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      // 印章正式样式不接鼠标事件；检查层叠时暂时参加命中测试，几何与绘制层不变。
      el.style.pointerEvents = 'auto';
      const visible = document.elementsFromPoint(x, y).includes(el);
      el.style.pointerEvents = '';
      return { text: el.textContent, width: r.width, height: r.height, visible };
    }));
    ok(marks.length > 0 && marks.every(m => m.text === '家' && m.width >= 24 && m.height >= 24 && m.visible), `${file}／${mode} 所有可见牌的「家」印章文字未被相邻牌盖住`);

    await page.evaluate(() => { S.day = 10; beginDay(S); view = 'morning'; panel = null; coach.lesson = null; refresh(); });
    await page.waitForTimeout(100);
    const yuan = await page.evaluate(() => {
      const rect = s => { const e = document.querySelector(s); if (!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
      return { yuan: rect('.yuan'), home: rect('.leftcol'), shop: rect('#shopBtn'), hand: rect('#hand'), vw: innerWidth, vh: innerHeight };
    });
    ok(yuan.yuan && yuan.yuan.left >= 0 && yuan.yuan.right <= yuan.vw && yuan.yuan.top >= 0 && yuan.yuan.bottom <= yuan.vh, `${file}／${mode} 元宵说明完整留在视口内`);
    ok(!overlap(yuan.yuan, yuan.home) && !overlap(yuan.yuan, yuan.shop) && !overlap(yuan.yuan, yuan.hand), `${file}／${mode} 元宵说明不压家栏、后台按钮或手牌`);

    await page.evaluate(() => { panel = 'shop'; refresh(); });
    await page.waitForTimeout(100);
    const shop = await page.evaluate(() => {
      const p = document.querySelector('.panel.shopp'), r = p.getBoundingClientRect();
      const home = document.querySelector('.leftcol');
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, vw: innerWidth, vh: innerHeight, scrollable: p.scrollHeight > p.clientHeight, homeVisible: !!home?.getClientRects().length, handVisible: !!document.querySelector('#hand .hc') };
    });
    ok(shop.left >= 0 && shop.right <= shop.vw && shop.top >= 0 && shop.bottom <= shop.vh, `${file}／${mode} 后台面板受最大高度约束并留在视口内${shop.scrollable ? '（可滚动）' : ''}`);
    ok(!shop.homeVisible && !shop.handVisible, `${file}／${mode} 后台打开时收起会遮挡的家栏与手牌`);
    ok(errors.length === 0, `${file}／${mode} 没有页面脚本错误${errors.length ? `：${errors.join(' | ')}` : ''}`);
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(fails ? `\n${fails} 项失败` : '\n全部通过');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); server.close(); process.exit(1); });
