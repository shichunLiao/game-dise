// 引導檢查（v1.9 引導）：用真的瀏覽器跑第 1–4 天，確認新手提示有出現、只出現一次。
// 需要：本機裝了 Google Chrome，和 playwright-core（npm i playwright-core）。
// 用法：node 原型/v1.8-workbuddy/check_guide.js [desktop|mobile] [截圖資料夾]
//（playwright-core 裝在別處時，用 NODE_PATH=那裡的 node_modules 指過去）
// 會自己在 127.0.0.1 開一個臨時的靜態伺服器（根目錄是 原型/），跑完關掉。
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const MODE = process.argv[2] || 'desktop';
const OUT = process.argv[3] || '';
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };

let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? '通過' : '失敗'}  ${msg}`); if (!cond) fails += 1; };

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/${encodeURIComponent(path.basename(__dirname))}/index.html`;
  const size = MODE === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: size, isMobile: MODE === 'mobile', hasTouch: MODE === 'mobile' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[data-act="start"]'), null, { timeout: 30000 });

  if (OUT) fs.mkdirSync(OUT, { recursive: true });
  const shot = async name => { if (!OUT) return; await page.waitForTimeout(500); await page.screenshot({ path: path.join(OUT, `${MODE}-${name}.png`) }); };
  const idle = async (ms = 400) => { await page.waitForFunction(() => !busy, null, { timeout: 30000 }); await page.waitForTimeout(ms); };
  const act = async (a, arg) => { await idle(); await page.evaluate(([a, arg]) => { const b = document.querySelector(`[data-act="${a}"]${arg !== undefined ? `[data-arg="${arg}"]` : ''}`); if (!b) throw new Error(`找不到 ${a}`); b.click(); }, [a, arg]); await idle(); };
  const st = () => page.evaluate(() => ({ view, day: S.day, lesson: coach.lesson, nudge: nudge.k, plays: S.T.plays.length, layers: S.T.layers.length, base: S.base }));
  const playable = () => page.evaluate(() => { const ids = S.T.box.filter(id => !S.T.used[id] && canStage(S, id)); const f = ids.filter(id => !S.T.plays.length || fits(S, id)); return (f[0] ?? ids[0]) ?? null; });
  const coachOk = async () => { while (await page.evaluate(() => !!document.querySelector('#coach:not([hidden]) [data-act="coachnext"]'))) { await page.evaluate(() => document.querySelector('[data-act="coachnext"]').click()); await page.waitForTimeout(300); } };
  const toMorning = async () => { for (let k = 0; k < 12 && (await st()).view !== 'morning'; k++) { await page.waitForTimeout(1200); await page.evaluate(() => document.querySelector('[data-act="dawn"],[data-act="nextact"],[data-act="mirrorok"],#watch [data-act]')?.click()); await idle(); } await idle(800); };
  const nudgeSeen = async k => { for (let i = 0; i < 30; i++) { if (await page.evaluate(k => nudge.k === k || !!S.tut.seen[k], k)) return true; await page.waitForTimeout(400); } return false; };

  // ── 第 1 天：照教學打四張，停在「收場／再打一張」 ──
  await act('start');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 4; i++) { await idle(); await coachOk(); await act('card', await playable()); }
  await idle(800);
  let s = await st();
  ok(s.lesson === 'end', '第 1 天四張後出現收場的教學框');
  ok(await page.evaluate(() => !!document.querySelector('#coach [data-act="coachmore"]')), '教學框裡有「再打一张」');
  ok(await page.evaluate(() => /渗进底色/.test($('#coach').textContent)), '教學框寫出再打會滲進底色');
  await shot('01-day1-end-choice');
  await act('coachmore');
  s = await st();
  ok(s.lesson === null && s.view === 'stage', '選「再打一张」後教學框收起，還在台上');
  await act('card', await playable());
  s = await st();
  ok(s.plays === 5 && s.base === 1, '第 5 張打出，第 5 層滲進底色（底色 1）');
  await shot('02-day1-fifth-card');
  await act('endstage'); await idle(2500);
  await act('todoor'); await idle(800); await coachOk();
  while (await page.evaluate(() => S.T.layers.length > 0)) await act('card', await page.evaluate(() => S.T.box.find(x => canClean(S, x))));
  await act('enter'); await page.waitForTimeout(3000); await idle(); await coachOk();
  await act('sleep'); await toMorning(); await coachOk();

  // ── 第 2 天：臉上滿四層、留著回家 ──
  await act('depart'); await page.waitForTimeout(1500);
  for (let i = 0; i < 5 && (await st()).layers < 4; i++) { const id = await playable(); if (id === null) break; await act('card', id); }
  ok(await nudgeSeen('full'), '第 2 天臉上滿 4 層：收場旁的「脸上满了」小提示');
  await shot('03-day2-stage-full');
  await act('endstage'); await idle(2500);
  await act('todoor'); await idle(1200);
  ok(await page.evaluate(() => !!document.querySelector('#topmid .intel .ic.now')), '卸妝（門口）時上方看得到今晚她要什麼');
  await shot('04-day2-door-need');
  ok(await nudgeSeen('dye'), '門口第一次會被染：進門旁的「被染」小提示');
  await act('enter'); await idle(1500);
  for (let k = 0; k < 3; k++) {
    await coachOk();
    const id = await page.evaluate(() => S.T.box.find(x => canHome(S, x)));
    if (id === undefined) break;
    await page.evaluate(() => { coach.lesson = null; });
    await act('card', id); await idle(600);
    if ((await st()).lesson === 'scar') { await shot('05-day2-scar'); break; }
  }
  ok(await page.evaluate(() => S.scars > 0 && (coach.lesson === 'scar' || S.tut.seen.scar)), '第一次留痕：說明痕和她會走');
  await coachOk();
  await idle(); await page.evaluate(() => document.querySelector('[data-act="endeve"]').click());
  for (let k = 0; k < 20; k++) { await page.waitForTimeout(500); await page.evaluate(() => document.querySelector('#lampfb .lfok')?.click()); if (await page.evaluate(() => !busy)) break; }
  await idle(1500); await coachOk();
  ok(await nudgeSeen('seep'), '睡前臉上還有層：睡吧旁的「底色」小提示');
  await shot('06-day2-night-seep');
  await act('sleep'); await toMorning();

  // ── 第 3 天：第一次組牌，三步指到卡組、商店、出門 ──
  s = await st();
  ok(s.lesson === 'pick', '第 3 天第一次組牌出現教學');
  const steps = [];
  for (let i = 0; i < 3; i++) { steps.push(await page.evaluate(() => document.querySelector('#coachT')?.textContent || '')); await shot(`07-day3-pick-${i + 1}`); await page.evaluate(() => document.querySelector('[data-act="coachnext"]')?.click()); await page.waitForTimeout(500); }
  ok(steps[1] === '后台商店' && steps[2] === '出门', `組牌教學第 2、3 步指向商店和出門（${steps.join('／')}）`);

  // ── 第 4 天早上：底色讓妝匣少了格（直接把底色設成 2 看這一課） ──
  await page.evaluate(() => { S.base = 2; S.day = 4; beginDay(S); view = 'morning'; coach.lesson = null; refresh(); });
  await page.waitForTimeout(800);
  ok((await st()).lesson === 'cap', '底色第一次讓妝匣少格：說明底色和妝匣');
  await shot('08-day4-cap');

  // ── 看過的不再出現：新開一季，seen 從 localStorage 帶過來 ──
  await coachOk();
  const kept = await page.evaluate(() => { const m = JSON.parse(localStorage.getItem('dise-v19-seen') || '{}'); return ['end', 'full', 'dye', 'scar', 'seep', 'pick', 'cap'].filter(k => !m[k]); });
  ok(kept.length === 0, `看過的提示記住了，下一季不再出現（漏記：${kept.join('、') || '無'}）`);
  await page.evaluate(() => startGame('再来'));
  await page.waitForTimeout(1500);
  for (let i = 0; i < 4; i++) { await idle(); await coachOk(); await act('card', await playable()); }
  await idle(800);
  ok((await st()).lesson !== 'end', '新開一季：第 1 天四張後不再跳收場的教學框');

  ok(errs.length === 0, `頁面沒有程式錯誤${errs.length ? `：${errs.join(' | ')}` : ''}`);
  await browser.close();
  server.close();
  console.log(fails ? `\n${fails} 項失敗` : '\n全部通过');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); server.close(); process.exit(1); });
