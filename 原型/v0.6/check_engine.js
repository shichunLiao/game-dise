// 核對 v0.6 三幕版的規則引擎：規則單項、亂走一千局，以及幾種打法對照設定第九節的數值自檢。
// 用法：node 原型/v0.6/check_engine.js
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const code = html.split('/* ENGINE START */')[1].split('/* ENGINE END */')[0];
const E = new Function(`${code}; return { R, T, FAM, HOME, BASIC, LOOKS, RIVALS, ENDING_N, newGame, beginDay, choose, toggleBox, canAdd, clearBox, canDepart, depart,
  canStage, playStage, canEndStage, endStage, nextFam, nextBonus, canWipe, wipe, canClean, selfClean, enterHome, canHome, playHome, willDye, isMatch, coveredFams, endEvening, lightLamp,
  sleep, dawn, nextAct, finishWipe, boardOf, rankOf, wifeOf, endingOf, boxCapOf, starterOf, seatEmpty, lookNow, actOf, fOf, tOf, cardOf };`)();

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails += 1; console.log('✗', msg); } };
const take = (S, t) => S.T.box.find(id => S.deck.find(c => c.id === id).t === t && !S.T.used[id]);

// ── 規則單項 ──
{
  // 第九節：長腔 → 白 → 身段 → 亮相，基礎 13，加開得正 14
  const S = E.newGame('测', 11);
  ok(S.phase === 'stage' && S.T.box.length === 10, '第 1 天直接上台，妝匣已裝好 10 張');
  ok(E.nextFam(S) === 'sing', '第 1 天起手唱');
  ok(!E.canStage(S, take(S, 'bai')), '第一張必須打起手族');
  ['changqiang', 'bai', 'shenduan', 'liangxiang'].forEach(t => E.playStage(S, take(S, t)));
  ok(S.T.stageGold + S.T.comboGold === 13, `四張鏈基礎 13，得到 ${S.T.stageGold + S.T.comboGold}`);
  ok(S.T.openGold === 1, '開得正 +1');
  ok(S.T.chain === 4 && S.T.layers.length === 4, '四張鏈：連擊 4，四層');
  ok(E.nextBonus(S) === 3, '第 5 張 +3（封頂）');
  // 第 5 張滲進底色
  E.playStage(S, take(S, 'liangsang'));
  ok(S.T.layers.length === 4 && S.base === 1, '第 5 層直接滲進底色');
  ok(!E.canStage(S, take(S, 'fanshen')), '白天最多 5 張');

  // 打斷：連擊從頭算，已拿的金不扣
  const B = E.newGame('测', 12);
  E.playStage(B, take(B, 'changqiang')); E.playStage(B, take(B, 'bai'));
  const g0 = B.T.stageGold + B.T.comboGold;
  const p = E.playStage(B, take(B, 'liangxiang'));
  ok(p.broke && B.T.chain === 1 && B.T.stageGold + B.T.comboGold === g0 + 3, '接錯：連擊從頭算，金不扣');
  const p2 = E.playStage(B, take(B, 'liangsang'));
  ok(p2.hit && p2.extra === 1, '打斷後再接上，又從 +1 算起');

  // 收場：連擊 ≥3 才擲骰；≥4 完美 ×1.5
  for (let seed = 1; seed < 40; seed++) {
    const C = E.newGame('测', seed);
    ['changqiang', 'bai', 'shenduan', 'liangxiang'].forEach(t => E.playStage(C, take(C, t)));
    E.endStage(C);
    ok(C.T.die >= 1 && C.T.die <= 6, '連擊 ≥3 會擲骰');
    ok(C.T.gold === (C.T.die >= 4 ? 21 : 14), `四張鏈完美 21、沒中 14，骰 ${C.T.die} 得 ${C.T.gold}`);
  }
  const D = E.newGame('测', 3);
  E.playStage(D, take(D, 'changqiang')); E.playStage(D, take(D, 'bai')); E.endStage(D);
  ok(D.T.die === null, '連擊 2 不擲骰');

  // 門口：被擦 2 層、不耗牌，今晚只聽得下 1 張
  ok(E.canWipe(D) && E.wipe(D) === 2 && D.T.layers.length === 0 && D.T.homeCap === 1 && D.chest.length === 2, '被擦 2 層，今晚只聽 1 張');
  const X = E.newGame('测', 5);
  ['changqiang', 'bai', 'shenduan'].forEach(t => E.playStage(X, take(X, t))); E.endStage(X);
  X.scars = 3;
  ok(!E.canWipe(X), '痕 >2 她不再替你擦');
  const leftover = take(X, 'fanshen');
  E.selfClean(X, leftover);
  ok(X.T.layers.length === 2 && X.rope.length === 1 && X.T.used[leftover] === 'clean', '自卸：每層棄 1 張');

  // 第 2 天：就算擦乾淨，第一張也染；可關掉「算數」
  const go = (opt) => {
    const G = E.newGame('测', 7);
    G.opt.day2 = opt;
    E.endStage(G); E.enterHome(G); E.dawn(G);
    ok(G.day === 2 && G.phase === 'morning', '第 1 天傍晚與夜自動結算');
    E.depart(G);
    const st = E.starterOf(G), id = G.T.box.find(x => E.fOf(G, x) === st);
    E.playStage(G, id); E.endStage(G); E.wipe(G); E.enterHome(G);
    const r = E.playHome(G, G.T.box.find(x => !G.T.used[x]));
    return { G, r };
  };
  const a = go(true), b = go(false);
  ok(a.r.dyed && a.G.scars === 1 && a.r.gain === 0, '第 2 天第一張被染，痕 +1');
  ok(b.r.dyed && b.G.scars === 0, '關掉「算數」：不留痕');

  // 染色上限與燈
  const Y = E.newGame('测', 9);
  Y.day = 3; E.beginDay(Y); Y.T.box = []; Y.deck.slice(0, 10).forEach(c => E.toggleBox(Y, c.id));
  ok(Y.T.box.length === 10, '第 3 天可以自己挑');
  const dep = Y.T.box.some(id => E.fOf(Y, id) === 'act');
  ok(dep === E.canDepart(Y), '妝匣沒有起手族就不能出發');
}
{
  // 傍晚：染色前幾張、對路 +2、幕的上限
  const H = E.newGame('测', 21);
  H.day = 5; E.beginDay(H);
  H.deck.forEach(c => { if (!E.T[c.t].blank && H.T.box.length < 10) E.toggleBox(H, c.id); });
  E.depart(H);
  ['changqiang', 'bai', 'shenduan'].forEach(t => { const id = H.T.box.find(x => E.cardOf(H, x).t === t && !H.T.used[x]); E.playStage(H, id); });
  E.endStage(H); E.enterHome(H);
  ok(H.T.dye === 2, `第二幕三層未卸：染 2 張（上限 2），得到 ${H.T.dye}`);
  const rest = () => H.T.box.filter(x => !H.T.used[x]);
  const r1 = E.playHome(H, rest()[0]), r2 = E.playHome(H, rest()[0]);
  ok(r1.dyed && r2.dyed && H.scars === 2, '前兩張被染，兩道痕');
  const look = E.lookNow(H), fam = Object.keys(E.FAM).find(f => E.HOME[E.FAM[f].home].look === look);
  const m = rest().find(x => E.fOf(H, x) === fam);
  const lamp0 = H.lamp, r3 = m !== undefined ? E.playHome(H, m) : null;
  if (r3) ok(!r3.dyed && r3.gain === 2 && H.lamp === lamp0 + 2, '第三張乾淨、對上樣子：燈 +2');
  else { const r4 = E.playHome(H, rest()[0]); ok(!r4.dyed && r4.gain === 1 && H.lamp === lamp0 + 1, '第三張乾淨、不對路：燈 +1'); }
  ok(H.T.box.filter(x => E.canHome(H, x)).length === 0, '傍晚最多推 3 張');

  // 借來的牌：背面空白，燈不漲；第三幕收回
  const J = E.newGame('测', 22);
  J.day = 4; E.beginDay(J);
  ok(J.deck.filter(c => E.T[c.t].blank).length === 3, '第 4 天借來三張');
  J.T.box = J.deck.filter(c => E.T[c.t].blank || E.T[c.t].f === 'fight').map(c => c.id).slice(0, 7);
  E.depart(J); E.endStage(J); E.enterHome(J);
  const bl = E.playHome(J, J.T.box.find(x => E.tOf(J, x).blank));
  ok(bl.gain === 0 && J.lamp === 0, '空白背面：燈不漲');
  J.day = 8; E.beginDay(J);
  ok(J.deck.every(c => !E.T[c.t].blank), '第三幕收回借的牌');
  // 底色每 2 點妝匣 −1（第二幕起）
  const K = E.newGame('测', 23);
  K.base = 5; ok(E.boxCapOf(K) === 10, '第一幕底色不影響妝匣');
  K.day = 4; ok(E.boxCapOf(K) === 8, '第二幕底色 5：妝匣 8');
  // 第三幕：字蓋住、座位空
  K.day = 8; K.played = { sing: 9, speak: 5, act: 2, fight: 1 };
  K.base = 1; ok(E.coveredFams(K).length === 0, '底色 1：沒蓋字');
  K.base = 2; ok(E.coveredFams(K).join() === 'sing', '底色 2：蓋住演得最多的一族');
  K.base = 4; ok(E.coveredFams(K).join() === 'sing,speak', '底色 4：蓋住兩族');
  K.scars = 3; ok(E.seatEmpty(K) && E.lookNow(K) === null, '痕 3：座位空，沒有樣子');
  K.day = 6; ok(!E.seatEmpty(K), '第二幕痕 3 座位還在');

  // 元宵
  const yuan = key => {
    const Z = E.newGame('测', 31);
    Z.day = 10; E.beginDay(Z);
    Z.T.box = Z.deck.slice(0, 10).map(c => c.id);
    ok(!E.canDepart(Z), '元宵不選不能出發');
    E.choose(Z, key);
    return Z;
  };
  const U = yuan('stage'); U.T.box = U.deck.filter(c => ['fight', 'sing'].includes(E.T[c.t].f)).map(c => c.id); E.depart(U);
  ok(E.nextFam(U) === 'fight', '上台起手打');
  E.playStage(U, U.T.box.find(x => E.fOf(U, x) === 'fight')); E.endStage(U);
  ok(U.gold === (3 + 1) * 2 && U.phase === 'night' && U.litAlone, '上台金 ×2、不回家');
  const Q = yuan('cover'); Q.T.box = Q.deck.filter(c => E.T[c.t].f === 'sing').map(c => c.id); E.depart(Q);
  E.playStage(Q, Q.T.box[0]); E.endStage(Q);
  ok(Q.gold === 0 && Q.fengGold === 3 && Q.phase === 'door', '代演：金記在小鳳名下');
  const W = yuan('lamp'); W.T.box = []; E.depart(W);
  ok(W.phase === 'evening', '回家點燈不演');
  E.lightLamp(W); ok(W.lit && W.phase === 'night', '燈點亮');

  // 水牌與結局：第九節「3 張鏈排第 4、只顧家排第 6」
  const B = E.newGame('阿满', 1); B.day = 10;
  B.gold = 90; ok(E.rankOf(B) === 4, '90 金排第 4');
  B.gold = 0; ok(E.rankOf(B) === 6, '0 金排第 6');
  B.gold = 151; ok(E.rankOf(B) === 1, '超過魏老闆排第一');
  B.gold = 150; ok(E.rankOf(B) === 2, '同分對手在前');
  B.gold = 60; B.fengGold = 20;
  ok(E.boardOf(B).findIndex(r => r.n === '小凤') < E.boardOf(B).findIndex(r => r.n === '玉楼'), '代演後小鳳不再墊底');
  const end = (gold, scars, choice) => { const Z = E.newGame('甲', 1); Z.day = 10; Z.gold = gold; Z.scars = scars; Z.choice = choice; return E.endingOf(Z); };
  [[200, 1, 'lamp', '满堂彩'], [200, 3, 'lamp', '压台'], [200, 1, 'stage', '压台'], [200, 4, 'stage', '头牌'], [90, 2, 'lamp', '留白'], [90, 2, 'cover', '半台'], [90, 5, 'lamp', '戏散'], [0, 2, 'lamp', '卸尽'], [0, 3, 'cover', '素脸'], [0, 4, 'lamp', '更夫']]
    .forEach(([g, s, c, n]) => ok(end(g, s, c) === n, `金 ${g} 痕 ${s} ${c} 應是 ${n}，得到 ${end(g, s, c)}`));
}

// ── 打法 ──
const rnd = seed => () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
const pickOne = (r, a) => a[Math.floor(r() * a.length)];
const famOfLook = look => Object.keys(E.FAM).find(f => E.HOME[E.FAM[f].home].look === look);
// 從這批牌裡找一條起手正確、金最高的 n 張鏈
function bestChain(S, pool, n) {
  const start = E.starterOf(S);
  if (!start) return [];
  let best = [], bestG = -1;
  const walk = (seq, used, want) => {
    if (seq.length === n) {
      const g = seq.reduce((a, id) => a + E.tOf(S, id).g, 0);
      if (g > bestG) { best = seq.slice(); bestG = g; }
      return;
    }
    const tried = new Set();
    for (const id of pool) {
      const t = E.cardOf(S, id).t;
      if (used.has(id) || tried.has(t) || E.T[t].f !== want) continue;
      tried.add(t);
      used.add(id); seq.push(id);
      walk(seq, used, E.T[t].next);
      seq.pop(); used.delete(id);
    }
  };
  walk([], new Set(), start);
  return best;
}
function plan(o) {
  return {
    morning(S) {
      if (S.day === 10) E.choose(S, o.yuan || 'lamp');
      if (S.day < 3) return;
      E.clearBox(S);
      const look = S.day === 10 ? '等' : E.LOOKS[S.day - 1], fam = famOfLook(look);
      const chain = bestChain(S, S.deck.map(c => c.id), o.len);
      const put = id => { if (!S.T.box.includes(id)) E.toggleBox(S, id); };
      chain.forEach(put);
      // 起手族一定要帶，不然出不了門
      const st = E.starterOf(S), sc = st && S.deck.find(c => E.T[c.t].f === st);
      if (sc) put(sc.id);
      S.deck.filter(c => E.T[c.t].f === fam && !E.T[c.t].blank).forEach(c => put(c.id));
      S.deck.filter(c => !E.T[c.t].blank).forEach(c => put(c.id));
      S.deck.forEach(c => put(c.id));
    },
    stage(S) {
      const chain = bestChain(S, S.T.box, o.len);
      chain.forEach(id => E.playStage(S, id));
    },
    door(S) {
      if (o.wipe) E.wipe(S);
      const look = E.lookNow(S), fam = famOfLook(look);
      const free = () => S.T.box.filter(id => !S.T.used[id]);
      // 留 keep 張對路的牌回家，其餘拿去卸妆
      const keep = free().filter(id => E.fOf(S, id) === fam && !E.tOf(S, id).blank).slice(0, o.push);
      while (S.T.layers.length) {
        const spare = free().filter(id => !keep.includes(id));
        if (!spare.length) break;
        E.selfClean(S, spare[0]);
      }
    },
    evening(S) {
      if (S.choice === 'lamp') { E.lightLamp(S); return; }
      const fam = famOfLook(E.lookNow(S));
      let free = S.T.box.filter(id => E.canHome(S, id));
      const ranked = free.filter(id => E.fOf(S, id) === fam && !E.tOf(S, id).blank).concat(free.filter(id => E.fOf(S, id) !== fam && !E.tOf(S, id).blank));
      let n = o.push;
      for (const id of ranked) {
        if (n <= 0 || !E.canHome(S, id)) break;
        if (o.safe && E.willDye(S, id) && S.day !== 2) break;
        E.playHome(S, id); n -= 1;
      }
      E.endEvening(S);
    },
    night(S) {
      while (S.T.layers.length) { const id = S.T.box.find(x => !S.T.used[x]); if (id === undefined) break; E.selfClean(S, id); }
    },
  };
}
function run(seed, P) {
  const S = E.newGame('测', seed);
  let steps = 0;
  while (S.phase !== 'reveal' && steps++ < 2000) {
    const s0 = S.scars, l0 = S.lamp, b0 = S.base;
    if (S.phase === 'morning') { P.morning(S); E.depart(S); if (S.phase === 'morning') { ok(false, `第 ${S.day} 天出不了门`); break; } }
    else if (S.phase === 'stage') { P.stage(S); E.endStage(S); }
    else if (S.phase === 'door') { P.door(S); E.enterHome(S); }
    else if (S.phase === 'evening') P.evening(S);
    else if (S.phase === 'night') { P.night(S); E.sleep(S); }
    else if (S.phase === 'watch') E.dawn(S);
    else if (S.phase === 'board') E.nextAct(S);
    else if (S.phase === 'lastwipe') E.finishWipe(S);
    check(S, s0, l0, b0);
  }
  ok(S.phase === 'reveal', `第 ${seed} 局沒走完（停在 ${S.phase}）`);
  return S;
}
function check(S, s0, l0, b0) {
  const t = S.T;
  ok(S.scars >= s0, '痕只增不減');
  ok(S.lamp >= l0, '燈只增不減');
  ok(S.base >= b0, '底色只增不減');
  ok(S.gold >= 0, '金箔不能是負的');
  ok(t.box.length <= t.cap, '妝匣裝多了');
  ok(new Set(t.box).size === t.box.length, '一張牌進了妝匣兩次');
  ok(t.plays.length <= E.R.stageMax, '白天超過 5 張');
  ok(t.pushed.length <= t.homeCap, '傍晚推多了');
  ok(t.layers.length <= E.R.layerMax, '臉上超過 4 層');
  t.plays.forEach(p => ok(!t.pushed.includes(p.id), '一張牌用了兩面'));
  ok(t.box.filter(id => t.used[id]).length === Object.keys(t.used).length, '用掉的牌不在妝匣裡');
}
const chaos = r => ({
  morning(S) {
    if (S.day === 10) E.choose(S, pickOne(r, ['stage', 'lamp', 'cover']));
    for (let i = 0; i < 30; i++) E.toggleBox(S, pickOne(r, S.deck).id);
    if (!E.canDepart(S)) { const st = E.starterOf(S), c = S.deck.find(x => E.T[x.t].f === st); E.clearBox(S); E.toggleBox(S, c.id); }
  },
  stage(S) { for (let i = 0; i < 6; i++) { const ids = S.T.box.filter(id => E.canStage(S, id)); if (!ids.length || r() < 0.15) break; E.playStage(S, pickOne(r, ids)); } },
  door(S) { if (r() < 0.5) E.wipe(S); for (let i = 0; i < 4; i++) { const ids = S.T.box.filter(id => E.canClean(S, id)); if (ids.length && r() < 0.5) E.selfClean(S, pickOne(r, ids)); } },
  evening(S) { if (S.choice === 'lamp') { E.lightLamp(S); return; } for (let i = 0; i < 4; i++) { const ids = S.T.box.filter(id => E.canHome(S, id)); if (ids.length && r() < 0.7) E.playHome(S, pickOne(r, ids)); } E.endEvening(S); },
  night(S) { for (let i = 0; i < 4; i++) { const ids = S.T.box.filter(id => E.canClean(S, id)); if (ids.length && r() < 0.6) E.selfClean(S, pickOne(r, ids)); } },
});
function stats(name, make, n) {
  const ends = {}, ranks = {};
  let gold = 0, lamp = 0, scars = 0, base = 0, perDay = 0, wasted = 0, days = 0;
  for (let s = 1; s <= n; s++) {
    const S = run(1000 + s, make(rnd(s)));
    const e = E.endingOf(S), k = E.rankOf(S);
    ends[e] = (ends[e] || 0) + 1; ranks[k] = (ranks[k] || 0) + 1;
    gold += S.gold; lamp += S.lamp; scars += S.scars; base += S.base;
    S.log.forEach(x => { wasted += x.wasted; if (x.stage) { perDay += x.gold; days += 1; } });
  }
  const f = v => (v / n).toFixed(1);
  console.log(`\n${name}\n  总金 ${f(gold)}（上台那天平均 ${(perDay / Math.max(days, 1)).toFixed(1)} 金）  灯 ${f(lamp)}  痕 ${f(scars)}  底色 ${f(base)}  每局作废 ${f(wasted)} 张\n  名次 ${JSON.stringify(ranks)}\n  结局 ${JSON.stringify(ends)}`);
}

for (let s = 1; s <= 1000; s++) run(s, chaos(rnd(s)));
stats('四张链，自卸，推 2 张对路，元宵回家', () => plan({ len: 4, push: 2, yuan: 'lamp' }), 300);
stats('四张链，自卸，推 2 张对路，元宵上台', () => plan({ len: 4, push: 2, yuan: 'stage' }), 300);
stats('四张链，被擦，推 1 张，元宵回家', () => plan({ len: 4, push: 1, wipe: true, yuan: 'lamp' }), 300);
stats('三张链，自卸，推 3 张，元宵回家', () => plan({ len: 3, push: 3, yuan: 'lamp' }), 300);
stats('五张贪心，自卸，推 1 张，元宵上台', () => plan({ len: 5, push: 1, yuan: 'stage' }), 300);
stats('只顾家：不演，推 3 张，元宵回家', () => plan({ len: 0, push: 3, yuan: 'lamp' }), 300);
stats('乱走', r => chaos(r), 300);
console.log(fails ? `\n${fails} 项不对` : '\n全部通过');
process.exit(fails ? 1 : 0);
