// 道具檢查（v1.9 第二輪）：後台每一樣物件，說明寫的效果和程式實際的效果是否一致，
// 而且在各種時機都生效：前一天買的、當天早上才買的、和別的物件疊在一起、小鳳生病（借來的牌）那幾天、同門的事件那天。
// 用法：node 原型/v1.9/check_items.js
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const code = html.split('/* ENGINE START */')[1].split('/* ENGINE END */')[0];
const E = new Function(`${code}; return { R, T, RELICS, RELIC_KEYS, EVENTS, BORROWED, newGame, beginDay, buy, canBuy, refreshShop, stockOf, depart, playStage, fits, endStage, wipe, selfClean,
  enterHome, playHome, canHome, isMatch, lookOfCard, endEvening, judgeNeed, sleep, boxCapOf, starterOf, fOf, tOf, choose, d6 };`)();

let fails = 0, n = 0;
const ok = (cond, msg) => { n += 1; if (!cond) { fails += 1; console.log('✗', msg); } else if (process.env.VERBOSE) console.log('✓', msg); };

// ── 小工具 ──
const card = (S, t) => { const c = { id: S.nid++, t }; S.deck.push(c); return c.id; };
// 第 d 天早上（事件照種子；ev 可以指定今天的同門事件）
function morning(d, { seed = 7, relics = [], ev = 'hot' } = {}) {
  const S = E.newGame('测', seed);
  S.relics = relics.slice();
  S.day = d;
  S.events[d] = ev;
  if (d >= 4) E.BORROWED.forEach(t => { if (!S.deck.some(c => c.t === t)) card(S, t); });
  E.beginDay(S);
  return S;
}
// 早上在後台把 k 買下來（貨架硬塞這一樣，錢給夠）
function buyNow(S, k) {
  S.gold = Math.max(S.gold, 99);
  if (!S.T.offers.includes(k)) S.T.offers.push(k);
  return E.buy(S, k);
}
// 上台：妝匣換成指定的幾張牌，依序打出
function stage(S, types) {
  S.T.box = types.map(t => card(S, t));
  S.phase = 'stage';
  return S.T.box.map(id => E.playStage(S, id));
}
// 兩種拿到物件的方式：前一天就有（早上 beginDay 已經讀到）、當天早上才買
const WAYS = {
  先前就有: (d, k, o = {}) => morning(d, { ...o, relics: [...(o.relics || []), k] }),
  當天才買: (d, k, o = {}) => { const S = morning(d, o); const r = buyNow(S, k); ok(r && r.relic === k && S.relics.includes(k), `${E.RELICS[k].n}：當天早上買得到`); return S; },
};
// 用某一個種子，讓收場的骰子擲出指定的點數
function seedForDie(S, want) {
  for (let s = 1; s < 5000; s++) { const Z = { seed: s }; if (E.d6(Z) === want) { S.seed = s; return; } }
  throw new Error('找不到種子');
}
// 起手：第 5 天唱、第 7 天做（STARTER）；主要的測試都在第 7 天，同門事件固定成不影響這些物件的「金寶唱紅」
const START = d => E.starterOf({ day: d, choice: null });

// ── 每一樣物件的說明都還在、價錢合理 ──
E.RELIC_KEYS.forEach(k => { const r = E.RELICS[k]; ok(r.n && r.tx && r.price >= 5 && r.price <= 15, `${k}：有名字、說明、價錢`); });

for (const [way, get] of Object.entries(WAYS)) {
  const tag = s => `${s}（${way}）`;

  // 琴師：每接上一張，再 +1 金
  {
    const S = get(7, 'qinshi');
    const st = START(7); // act → 身段(接打) → 亮相(接唱) → 长腔
    const ps = stage(S, ['shenduan', 'liangxiang', 'changqiang']);
    ok(st === 'act' && ps.every(p => p), tag('琴師：測試用的鏈能打'));
    ok(ps[1].extra === E.R.chainGold[2] + 1 && ps[2].extra === E.R.chainGold[3] + 1, tag('琴師：每接上一張再 +1 金'));
    ok(ps[0].extra === 0, tag('琴師：第一張（沒有接）不加'));
  }
  // 鑼鼓經：開得正 +4 金（不是 +1）
  {
    const S = get(7, 'gujing');
    const [p] = stage(S, ['shenduan']);
    ok(p.open === 4, tag('鑼鼓經：開得正 +4'));
  }
  // 護嗓茶：收場擲骰的門檻低 1（平時 3 以上，捧場那天 2 以上）
  {
    const S = get(7, 'cha', { ev: 'hot' });
    ok(S.T.perfectDie === 3, tag('護嗓茶：平時 3 以上就算完美'));
    stage(S, ['shenduan', 'liangxiang', 'changqiang']);
    seedForDie(S, 3);
    E.endStage(S);
    ok(S.T.die === 3 && S.T.perfect, tag('護嗓茶：擲出 3 就是完美'));
    const C = get(7, 'cha', { ev: 'cheer' });
    ok(C.T.perfectDie === 2, tag('護嗓茶＋魏老闆捧場：2 以上就算完美'));
  }
  // 妝奩：妝匣多一格
  {
    const base = morning(7).T.cap;
    const S = get(7, 'lian');
    ok(S.T.cap === base + 1, tag('妝奩：妝匣多一格'));
    // 第三幕底色讓妝匣少格時，照樣多一格
    const D = morning(9); D.base = 6; D.T.cap = E.boxCapOf(D);
    const D2 = morning(9, { relics: way === '先前就有' ? ['lian'] : [] }); D2.base = 6; D2.T.cap = E.boxCapOf(D2); if (way === '當天才買') buyNow(D2, 'lian');
    ok(D2.T.cap === D.T.cap + 1, tag('妝奩：底色少格時也多一格'));
  }
  // 熟手巾：她替你擦臉，一次擦 3 層
  {
    const S = get(7, 'jin');
    stage(S, ['shenduan', 'liangxiang', 'changqiang', 'bai']);
    E.endStage(S);
    ok(E.wipe(S) === 3 && S.T.layers.length === 1, tag('熟手巾：一次擦 3 層'));
    const S2 = get(7, 'jin');
    stage(S2, ['shenduan', 'liangxiang']); E.endStage(S2);
    ok(E.wipe(S2) === 2, tag('熟手巾：臉上只有 2 層就擦 2 層'));
  }
  // 燈油：沒滿足她的需要，燈只熄 1（不是 3）
  {
    const S = get(7, 'you');
    S.lamp = 10;
    stage(S, ['shenduan']); E.endStage(S); S.T.layers = []; E.enterHome(S); E.endEvening(S);
    ok(S.T.met === false && S.T.lampOut === 1 && S.lamp === 9 && S.outs === 1, tag('燈油：沒滿足，燈只熄 1、照樣記一回熄'));
  }
  // 小鑼：每天第一次接錯，不記怨氣
  {
    const S = get(7, 'luo');
    const ps = stage(S, ['shenduan', 'bai', 'bai']); // 身段接打；打白（念）接錯，再打白（白接做）又接錯
    ok(ps[1].broke && ps[1].saved && !ps[1].grudge, tag('小鑼：第一次接錯不記怨氣'));
    ok(ps[2].broke && ps[2].grudge && S.T.grudge === 1, tag('小鑼：第二次接錯照樣記'));
  }
  // 班鼓：收場時連擊到 3 以上，再 +3 金（不吃完美的倍數）
  {
    const S = get(7, 'bangu');
    stage(S, ['shenduan', 'liangxiang', 'changqiang']);
    seedForDie(S, 1); E.endStage(S);
    const sum = S.T.stageGold + S.T.comboGold + S.T.openGold + S.T.finGold;
    ok(S.T.drumGold === 3 && S.T.gold === sum + 3, tag('班鼓：連擊到 3，再 +3 金'));
    const P = get(7, 'bangu');
    stage(P, ['shenduan', 'liangxiang', 'changqiang']);
    seedForDie(P, 6); E.endStage(P);
    const sumP = P.T.stageGold + P.T.comboGold + P.T.openGold + P.T.finGold;
    ok(P.T.perfect && P.T.gold === Math.floor(sumP * E.R.perfect) + 3, tag('班鼓：完美時 +3 不乘 1.5'));
    const Q = get(7, 'bangu');
    stage(Q, ['shenduan', 'liangxiang']); E.endStage(Q);
    ok(Q.T.drumGold === 0, tag('班鼓：連擊只到 2 不加'));
  }
  // 香粉：用了保底擦臉的那晚，滲進底色的層少 1
  {
    const S = get(7, 'xiangfen');
    stage(S, ['shenduan', 'liangxiang', 'changqiang', 'bai']); E.endStage(S); E.wipe(S);
    S.phase = 'night'; const b0 = S.base; E.sleep(S);
    ok(S.T.fenSaved === 1 && S.base === b0 + 1, tag('香粉：擦過臉的那晚，剩 2 層只滲 1'));
    const N = get(7, 'xiangfen');
    stage(N, ['shenduan', 'liangxiang']); E.endStage(N); N.phase = 'night'; const n0 = N.base; E.sleep(N);
    ok(N.T.fenSaved === 0 && N.base === n0 + 2, tag('香粉：沒擦臉的那晚不少'));
  }
  // 手抄折子：孫師父每天多拿出 1 張牌給你看（今天就多一張）
  {
    const n0 = morning(7).T.offers.filter(k => E.T[k]).length;
    const S = get(7, 'zhezi');
    ok(S.T.offers.filter(k => E.T[k]).length === n0 + 1, tag('手抄折子：今天就多一張牌'));
    S.gold = 99; E.refreshShop(S);
    ok(S.T.offers.filter(k => E.T[k]).length === n0 + 1, tag('手抄折子：換一批之後也多一張'));
  }
}

// ── 隔天：當天買的，到了明天照樣有效（物件整季都在）──
{
  const S = morning(6); buyNow(S, 'cha'); buyNow(S, 'luo');
  S.day = 7; S.events[7] = 'hot'; E.beginDay(S);
  ok(S.T.perfectDie === 3 && S.T.freeBreak, '隔天：護嗓茶、小鑼照樣有效');
}
// ── 疊加：琴師＋托；琴師＋鑼鼓經＋班鼓；護嗓茶＋小鑼 ──
{
  const S = morning(7, { relics: ['qinshi'] });
  const ps = stage(S, ['shenduan', 'tangma']); // 趟馬（打·托）接在身段（接打）後面
  ok(ps[1].hit && ps[1].extra === (E.R.chainGold[2] + 1) * 2, '疊加：琴師的 +1 也吃托的翻倍');
  const A = morning(7, { relics: ['qinshi', 'gujing', 'bangu'] });
  stage(A, ['shenduan', 'liangxiang', 'changqiang']); seedForDie(A, 1); E.endStage(A);
  ok(A.T.openGold === 4 && A.T.comboGold === (1 + 1) + (2 + 1) && A.T.drumGold === 3, '疊加：琴師、鑼鼓經、班鼓各算各的');
  const B = morning(7); buyNow(B, 'cha'); buyNow(B, 'luo');
  ok(B.T.perfectDie === 3 && B.T.freeBreak, '疊加：同一天買護嗓茶和小鑼，兩樣都當天生效');
  const C = morning(7); buyNow(C, 'cha');
  ok(C.T.perfectDie === 3, '同一天：護嗓茶只降 1，不會重複降');
  ok(!E.buy(C, 'cha'), '同一樣物件不能買兩次');
}
// ── 小鳳生病（第 4–7 天，借來的牌在卡組裡）──
{
  const S = morning(5, { relics: ['qinshi', 'luo'] });
  ok(S.deck.some(c => E.T[c.t].blank), '小鳳生病：卡組裡有借來的牌');
  const st = START(5); // sing：长腔（接念）→ 贯口（借·念，接做）→ 身段（做，接打）→ 大刀（借·打）
  const ps = stage(S, ['changqiang', 'jie_guankou', 'shenduan', 'jie_dadao']);
  ok(st === 'sing' && ps.every(p => p && !p.broke), '小鳳生病：借來的牌接得上');
  ok(ps[1].extra === E.R.chainGold[2] + 1 && ps[3].extra === E.R.chainGold[4] + 1, '小鳳生病：琴師對借來的牌照樣 +1');
  const W = morning(5); buyNow(W, 'jin');
  stage(W, ['changqiang', 'jie_guankou', 'shenduan', 'jie_dadao']); E.endStage(W);
  ok(E.wipe(W) === 3, '小鳳生病：當天買的熟手巾照樣擦 3 層');
}
// ── 元宵上台（金 ×2）：班鼓的 +3 也一起翻倍 ──
{
  const S = morning(10, { relics: ['bangu'] }); E.choose(S, 'stage');
  stage(S, ['shenduan', 'liangxiang', 'changqiang']); seedForDie(S, 1);
  const st = E.starterOf(S);
  E.endStage(S);
  const sum = S.T.stageGold + S.T.comboGold + S.T.openGold + S.T.finGold;
  ok(st === 'fight' || S.T.gold === (sum + 3) * 2, '元宵上台：班鼓的 +3 跟著 ×2');
}

console.log(fails ? `\n${fails} / ${n} 項沒過` : `\n道具檢查全部通过（${n} 項）`);
process.exit(fails ? 1 : 0);
