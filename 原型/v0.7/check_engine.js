// 核對 v0.7 預告版的規則引擎：規則單項、亂走一千局，以及幾種打法的金箔、名次與結局分布（對照設定第十節）。
// 用法：node 原型/v0.7/check_engine.js
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const code = html.split('/* ENGINE START */')[1].split('/* ENGINE END */')[0];
const E = new Function(`${code}; return { R, T, FAM, HOME, BASIC, SHOP, GIFT, SPELLS, RIVALS, EVENTS, LOOK_HOME, ENDING_N, newGame, beginDay, choose, toggleBox, canAdd, clearBox,
  canBuy, buy, purseOf, canDepart, depart, canStage, playStage, fits, hearCrowd, canEndStage, endStage, nextFam, nextBonus, canWipe, wipe, canClean, selfClean, dyeOf,
  enterHome, canHome, playHome, judgeNeed, willDye, isMatch, coveredFams, endEvening, lightLamp, sleep, dawn, nextAct, finishWipe, boardOf, rankOf, rivalGold, rivalDay,
  wifeOf, endingOf, boxCapOf, starterOf, seatEmpty, lookNow, needOf, spellOf, actOf, fOf, tOf, cardOf, eventOf };`)();

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails += 1; console.log('✗', msg); } };
const take = (S, t) => S.T.box.find(id => S.deck.find(c => c.id === id).t === t && !S.T.used[id]);
const famOfLook = look => Object.keys(E.FAM).find(f => E.HOME[E.FAM[f].home].look === look);

// ── 規則單項 ──
{
  const S = E.newGame('测', 11);
  ok(S.phase === 'stage' && S.T.box.length === 10, '第 1 天直接上台，妝匣已裝好 10 張');
  ok(E.nextFam(S) === 'sing' && !E.canStage(S, take(S, 'bai')), '第 1 天起手唱，第一張必須打起手族');
  ['changqiang', 'bai', 'shenduan', 'liangxiang'].forEach(t => E.playStage(S, take(S, t)));
  ok(S.T.stageGold + S.T.comboGold === 13 && S.T.openGold === 1, '四張鏈基礎 13，開得正 +1');
  E.playStage(S, take(S, 'liangsang'));
  ok(S.T.layers.length === 4 && S.base === 1, '第 5 層直接滲進底色');
  ok(S.T.grudge === 0, '第 1 天接錯不算怨氣');

  // 怨氣：第 2 天起接錯一次，進門多染一張
  const B = E.newGame('测', 12);
  B.day = 3; E.beginDay(B); B.T.box = B.deck.slice(0, 10).map(c => c.id); B.phase = 'stage';
  const st = E.starterOf(B), a0 = B.T.box.find(id => E.fOf(B, id) === st);
  E.playStage(B, a0);
  const wrong = B.T.box.find(id => !B.T.used[id] && !E.fits(B, id));
  const p = E.playStage(B, wrong);
  ok(p.broke && p.grudge && B.T.grudge === 1, '接錯：記一點怨氣');
  E.endStage(B);
  while (B.T.layers.length) E.selfClean(B, B.T.box.find(id => !B.T.used[id]));
  ok(E.dyeOf(B) === 1, '臉卸乾淨了，怨氣還是染一張');
  ok(!E.canWipe(B), '臉乾淨了就沒得擦');

  // 重彩、百搭、壓軸
  const H = E.newGame('测', 13);
  H.day = 5; E.beginDay(H); H.phase = 'stage';
  const add = t => { const c = { id: H.nid++, t }; H.deck.push(c); H.T.box.push(c.id); return c.id; };
  H.T.box = [];
  const s1 = add('changqiang'), w = add('jijifeng'), m = add('manban'), f2 = add('bai'), wy = add('woyu');
  E.playStage(H, s1);
  ok(E.fits(H, w), '百搭接在什麼後面都算接上');
  E.playStage(H, w);
  ok(H.T.chain === 2, '百搭接上');
  const pm = E.playStage(H, m);
  ok(pm.broke && H.T.layers.length === 4, '重彩留兩層');
  E.playStage(H, f2);
  const pw = E.playStage(H, wy);
  ok(pw.fin === 5 && pw.hit, '第 4 張起打出卧魚，壓軸 +5');
  ok(H.T.layers.length === 4 && H.base === 2, '超過 4 層滲進底色');

  // 被擦 2 層、不耗牌，今晚只聽得下 1 張
  const D = E.newGame('测', 3);
  E.playStage(D, take(D, 'changqiang')); E.playStage(D, take(D, 'bai')); E.endStage(D);
  ok(E.canWipe(D) && E.wipe(D) === 2 && D.T.homeCap === 1 && D.chest.length === 2, '被擦 2 層，今晚只聽 1 張');

  // 第 1 天傍晚自動：她說起第 2–3 天的事
  const G = E.newGame('测', 7);
  E.endStage(G); E.enterHome(G);
  ok(G.T.forecast && G.T.forecast.look === G.looks[0] && G.known[2] && G.known[3], '第 1 天晚上她預告第 2–3 天的需要');
  E.dawn(G);
  ok(G.day === 2 && G.phase === 'morning', '第 1 天傍晚與夜自動結算');
}
{
  // 需要：推夠張數才算數；沒推夠滅燈；整段對上送家常牌；最後一晚預告下一段
  const N = E.newGame('测', 21);
  N.day = 4; E.beginDay(N);
  const look = E.lookNow(N), fam = famOfLook(look);
  ok(E.needOf(N).k === 2 && E.needOf(N).look === N.looks[1], '第 4–5 天是第二段，要 2 張');
  N.T.box = N.deck.filter(c => E.T[c.t].f === fam).slice(0, 2).map(c => c.id).concat(N.deck.filter(c => c.t === E.BASIC.find(t => E.T[t].f === E.starterOf(N))).slice(0, 1).map(c => c.id));
  E.depart(N); E.endStage(N); E.enterHome(N);
  N.lamp = 5;
  const ids = N.T.box.filter(id => E.fOf(N, id) === fam);
  E.playHome(N, ids[0]);
  ok(N.T.got === 1, '對路一張記 1');
  E.endEvening(N);
  ok(N.T.met === false && N.lamp === 5 + 2 - 3 && N.outs === 1, `沒推夠：滅燈 3，得到燈 ${N.lamp}`);

  const M = E.newGame('测', 21);
  const meet = d => {
    M.day = d; E.beginDay(M);
    const fm = famOfLook(E.lookNow(M)), st = E.starterOf(M);
    M.T.box = [];
    M.deck.filter(c => E.T[c.t].f === fm && !E.T[c.t].blank).slice(0, 2).forEach(c => M.T.box.push(c.id));
    M.T.box.push(M.deck.find(c => E.T[c.t].f === st && !M.T.box.includes(c.id) && !E.T[c.t].home).id);
    E.depart(M); E.endStage(M); E.enterHome(M);
    M.T.box.filter(id => E.fOf(M, id) === fm).forEach(id => E.playHome(M, id));
    E.endEvening(M);
  };
  meet(4);
  ok(M.T.met && !M.T.gift && M.met[1] === 1, '第 4 天推夠，這一段記一次');
  meet(5);
  const g = E.GIFT[E.LOOK_HOME[M.looks[1]]];
  ok(M.T.met && M.T.gift === g && M.deck.some(c => c.t === g), `整段對上：她送一張 ${g}`);
  ok(M.T.forecast && M.T.forecast.look === M.looks[2] && M.known[6] && M.known[7], '一段最後一晚，她預告下一段');
  // 家常牌：只能推，對上算兩張、燈 +3
  M.day = 6; E.beginDay(M);
  const gid = M.deck.find(c => c.t === g).id;
  M.T.box = [gid]; M.phase = 'stage';
  ok(!E.canStage(M, gid), '家常牌不能上台');
  E.endStage(M); E.enterHome(M);
  const look6 = E.lookNow(M);
  if (E.LOOK_HOME[look6] === E.LOOK_HOME[M.looks[1]]) ok(false, '洗牌讓相鄰兩段一樣');
  const r = E.playHome(M, gid);
  ok(!r.match && r.count === 0 && r.gain === 1, '家常牌不對路：只是普通的一張');
  M.day = 4; E.beginDay(M); M.T.box = [gid]; M.phase = 'stage'; E.endStage(M); E.enterHome(M);
  const r2 = E.playHome(M, gid);
  ok(r2.match && r2.count === 2 && r2.gain === 3, '家常牌對上：算兩張、燈 +3');

  // 後台：花錢袋，不掉賣座
  const P = E.newGame('测', 31);
  P.day = 3; E.beginDay(P);
  ok(P.T.offers.length === 3, '第 3 天起後台三樣');
  const k = P.T.offers[0];
  ok(!E.canBuy(P, k), '錢不夠買不了');
  P.gold = 40;
  const before = E.rankOf(P);
  E.buy(P, k);
  ok(E.purseOf(P) === 40 - E.T[k].price && P.gold === 40 && E.rankOf(P) === before && P.deck.some(c => c.t === k), '買牌只花錢袋，賣座和名次不變');
  ok(!E.canBuy(P, k), '同一樣一天只能買一次');
  ok(E.newGame('测', 31).T.offers.length === 0, '第 1、2 天後台不開');

  // 事件
  const V = E.newGame('测', 41);
  const grabDay = Object.keys(V.events).find(d => V.events[d] === 'grab');
  if (grabDay) { V.day = +grabDay; E.beginDay(V); ok(V.T.stageMax === 4, '月仙搶戲：只剩四張'); }
  V.day = 3; E.beginDay(V); ok(V.known[3] === 'tip', '第 3 天玉樓遞話：今晚的需要早上就知道');
  // 水牌：早上看昨天的
  const W = E.newGame('测', 42); W.day = 5; E.beginDay(W);
  ok(E.rivalGold(W, 0) === E.rivalGold(W, 0, 4), '早上的水牌記到昨天');
  ok(E.rivalGold(W, 4, 7) === E.rivalGold(W, 4, 3), '小鳳病的那幾天沒有金');

  // 結局
  const end = (gold, scars, lamp, choice) => { const Z = E.newGame('甲', 1); Z.day = 10; Z.phase = 'reveal'; Z.gold = gold; Z.scars = scars; Z.lamp = lamp; Z.choice = choice; return E.endingOf(Z); };
  const top = 999, mid = E.rivalGold(E.newGame('甲', 1), 2, 10) + 1;
  [[top, 1, 20, 'lamp', '满堂彩'], [top, 1, 10, 'lamp', '压台'], [top, 3, 20, 'lamp', '压台'], [top, 4, 20, 'stage', '头牌'], [mid, 2, 20, 'lamp', '留白'], [mid, 2, 20, 'cover', '半台'], [mid, 5, 20, 'lamp', '戏散'], [0, 2, 20, 'lamp', '卸尽'], [0, 3, 20, 'cover', '素脸'], [0, 4, 20, 'lamp', '更夫']]
    .forEach(([g, s, l, c, n]) => ok(end(g, s, l, c) === n, `金 ${g} 痕 ${s} 燈 ${l} ${c} 應是 ${n}，得到 ${end(g, s, l, c)}`));
}

// ── 打法 ──
const rnd = seed => () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
const pickOne = (r, a) => a[Math.floor(r() * a.length)];
// 從這批牌裡找一條起手正確、接得上的 n 張鏈；分數 = 金 − 多出來的層 × 1.5
function bestChain(S, pool, n) {
  const start = E.starterOf(S), max = Math.min(n, S.T.stageMax);
  if (!start || !max) return [];
  let best = [], bestV = -1;
  const walk = (seq, used, want, g) => {
    if (seq.length === max) {
      const extra = seq.reduce((a, id) => a + (E.tOf(S, id).heavy ? 1 : 0), 0);
      const v = g - extra * 1.5;
      if (v > bestV) { best = seq.slice(); bestV = v; }
      return;
    }
    const tried = new Set();
    for (const id of pool) {
      const tp = E.tOf(S, id), t = E.cardOf(S, id).t;
      if (used.has(id) || tried.has(t) || tp.home) continue;
      const ok1 = seq.length === 0 ? tp.f === want : (tp.wild || tp.f === want);
      if (!ok1) continue;
      tried.add(t);
      const k = seq.length, add = tp.g + (k === 0 ? 1 : E.R.chainGold[Math.min(k + 1, 5)]) + (tp.fin && k >= 3 ? tp.fin : 0);
      used.add(id); seq.push(id);
      walk(seq, used, tp.next, g + add);
      seq.pop(); used.delete(id);
    }
  };
  walk([], new Set(), start, 0);
  return best;
}
// 照她的需要配匣：鏈、要推的牌（家常牌優先）、其餘拿來卸妝
function plan(o) {
  const need = S => E.needOf(S);
  const homeFor = (S, pool) => {
    const fam = famOfLook(E.lookNow(S) || '等'), k = need(S).k;
    const gifts = pool.filter(id => E.tOf(S, id).home && E.fOf(S, id) === fam);
    if (gifts.length && k <= 2) return gifts.slice(0, 1);
    return pool.filter(id => E.fOf(S, id) === fam && !E.tOf(S, id).blank && !E.tOf(S, id).home).slice(0, o.push === 'need' ? k : o.push);
  };
  return {
    morning(S) {
      if (S.day === 10) E.choose(S, o.yuan || 'lamp');
      // 後台：買一張划得來的
      if (o.shop) {
        const val = k => (E.T[k].g + (E.T[k].fin || 0) * 0.7 + (E.T[k].wild ? 2.5 : 0) - (E.T[k].heavy ? 1.2 : 0)) / E.T[k].price;
        const buyable = S.T.offers.filter(k => E.canBuy(S, k)).sort((a, b) => val(b) - val(a));
        if (buyable.length && S.day <= o.shopUntil) E.buy(S, buyable[0]);
      }
      if (S.day < 3) return;
      E.clearBox(S);
      const all = S.deck.map(c => c.id);
      const chain = bestChain(S, all, o.len);
      const put = id => { if (!S.T.box.includes(id)) E.toggleBox(S, id); };
      chain.forEach(put);
      const st = E.starterOf(S), sc = st && S.deck.find(c => E.T[c.t].f === st && !E.T[c.t].home);
      if (sc) put(sc.id);
      homeFor(S, all.filter(id => !S.T.box.includes(id))).forEach(put);
      S.deck.filter(c => !E.T[c.t].blank && !E.T[c.t].home).forEach(c => put(c.id));
      S.deck.forEach(c => put(c.id));
    },
    stage(S) {
      if (o.random) {
        for (let i = 0; i < o.len; i++) { const ids = S.T.box.filter(id => E.canStage(S, id)); if (!ids.length) break; E.playStage(S, pickOne(o.random, ids)); }
        return;
      }
      const keep = homeFor(S, S.T.box);
      bestChain(S, S.T.box.filter(id => !keep.includes(id)), o.len).forEach(id => E.playStage(S, id));
    },
    door(S) {
      const free = () => S.T.box.filter(id => !S.T.used[id]);
      const keep = o.push === 0 ? [] : homeFor(S, free());
      const cnt = keep.reduce((a, id) => a + (E.tOf(S, id).home ? 2 : 1), 0);
      if (o.wipe === 'always' || (o.wipe === 'smart' && keep.length === 1 && cnt >= need(S).k)) E.wipe(S);
      while (S.T.layers.length) {
        const spare = free().filter(id => !keep.includes(id));
        if (!spare.length) break;
        E.selfClean(S, spare[0]);
      }
    },
    evening(S) {
      if (S.choice === 'lamp') { E.lightLamp(S); return; }
      const fam = famOfLook(E.lookNow(S));
      const free = S.T.box.filter(id => E.canHome(S, id));
      const ranked = free.filter(id => E.fOf(S, id) === fam && !E.tOf(S, id).blank).sort((a, b) => (E.tOf(S, b).home ? 1 : 0) - (E.tOf(S, a).home ? 1 : 0))
        .concat(o.extra ? free.filter(id => E.fOf(S, id) !== fam && !E.tOf(S, id).blank) : []);
      for (const id of ranked) {
        if (!E.canHome(S, id)) break;
        if (E.willDye(S, id) && S.day !== 2) break;
        E.playHome(S, id);
      }
      E.endEvening(S);
    },
    night(S) { while (S.T.layers.length) { const id = S.T.box.find(x => !S.T.used[x]); if (id === undefined) break; E.selfClean(S, id); } },
  };
}
function run(seed, P) {
  const S = E.newGame('测', seed);
  let steps = 0;
  while (S.phase !== 'reveal' && steps++ < 2000) {
    const s0 = S.scars, b0 = S.base, g0 = S.gold;
    if (S.phase === 'morning') { P.morning(S); E.depart(S); if (S.phase === 'morning') { ok(false, `第 ${S.day} 天出不了门`); break; } }
    else if (S.phase === 'stage') { P.stage(S); E.hearCrowd(S); E.endStage(S); }
    else if (S.phase === 'door') { P.door(S); E.enterHome(S); }
    else if (S.phase === 'evening') P.evening(S);
    else if (S.phase === 'night') { P.night(S); E.sleep(S); }
    else if (S.phase === 'watch') E.dawn(S);
    else if (S.phase === 'board') E.nextAct(S);
    else if (S.phase === 'lastwipe') E.finishWipe(S);
    check(S, s0, b0, g0);
  }
  ok(S.phase === 'reveal', `第 ${seed} 局沒走完（停在 ${S.phase}）`);
  return S;
}
function check(S, s0, b0, g0) {
  const t = S.T;
  ok(S.scars >= s0, '痕只增不減');
  ok(S.base >= b0, '底色只增不減');
  ok(S.gold >= g0, '賣座只增不減');
  ok(S.lamp >= 0 && E.purseOf(S) >= 0, '燈和錢袋不能是負的');
  ok(t.box.length <= t.cap, '妝匣裝多了');
  ok(new Set(t.box).size === t.box.length, '一張牌進了妝匣兩次');
  ok(t.plays.length <= t.stageMax, '白天超過上限');
  ok(t.pushed.length <= t.homeCap, '傍晚推多了');
  ok(t.layers.length <= E.R.layerMax, '臉上超過 4 層');
  t.plays.forEach(p => ok(!t.pushed.includes(p.id) && !E.tOf(S, p.id).home, '一張牌用了兩面，或家常牌上了台'));
  ok(t.box.filter(id => t.used[id]).length === Object.keys(t.used).length, '用掉的牌不在妝匣裡');
}
const chaos = r => ({
  morning(S) {
    if (S.day === 10) E.choose(S, pickOne(r, ['stage', 'lamp', 'cover']));
    if (r() < 0.5 && S.T.offers.length) E.buy(S, pickOne(r, S.T.offers));
    for (let i = 0; i < 30; i++) E.toggleBox(S, pickOne(r, S.deck).id);
    if (!E.canDepart(S)) { const st = E.starterOf(S), c = S.deck.find(x => E.T[x.t].f === st && !E.T[x.t].home); E.clearBox(S); E.toggleBox(S, c.id); }
  },
  stage(S) { for (let i = 0; i < 6; i++) { const ids = S.T.box.filter(id => E.canStage(S, id)); if (!ids.length || r() < 0.15) break; E.playStage(S, pickOne(r, ids)); } },
  door(S) { if (r() < 0.5) E.wipe(S); for (let i = 0; i < 4; i++) { const ids = S.T.box.filter(id => E.canClean(S, id)); if (ids.length && r() < 0.5) E.selfClean(S, pickOne(r, ids)); } },
  evening(S) { if (S.choice === 'lamp') { E.lightLamp(S); return; } for (let i = 0; i < 4; i++) { const ids = S.T.box.filter(id => E.canHome(S, id)); if (ids.length && r() < 0.7) E.playHome(S, pickOne(r, ids)); } E.endEvening(S); },
  night(S) { for (let i = 0; i < 4; i++) { const ids = S.T.box.filter(id => E.canClean(S, id)); if (ids.length && r() < 0.6) E.selfClean(S, pickOne(r, ids)); } },
});
const STATS = {};
function stats(name, make, n) {
  const ends = {}, ranks = {};
  let gold = 0, lamp = 0, scars = 0, base = 0, outs = 0, met = 0, bought = 0, gifts = 0;
  for (let s = 1; s <= n; s++) {
    const S = run(1000 + s, make(rnd(s)));
    const e = E.endingOf(S), k = E.rankOf(S, 10);
    ends[e] = (ends[e] || 0) + 1; ranks[k] = (ranks[k] || 0) + 1;
    gold += S.gold; lamp += S.lamp; scars += S.scars; base += S.base; outs += S.outs; met += S.log.filter(x => x.met).length; bought += S.bought.length; gifts += S.gifts.length;
  }
  const f = v => (v / n).toFixed(1);
  STATS[name] = { ranks, ends, n };
  console.log(`\n${name}\n  卖座 ${f(gold)}  灯 ${f(lamp)}  痕 ${f(scars)}  底色 ${f(base)}  满足 ${f(met)} 晚  灭灯 ${f(outs)} 次  买 ${f(bought)} 张  家常牌 ${f(gifts)}\n  名次 ${JSON.stringify(ranks)}\n  结局 ${JSON.stringify(ends)}`);
}

for (let s = 1; s <= 1000; s++) run(s, chaos(rnd(s)));
const W = (n, k) => (STATS[n].ranks[k] || 0) / STATS[n].n;
const End = (n, e) => (STATS[n].ends[e] || 0) / STATS[n].n;
stats('A 照需要配匣、四张链、买牌、元宵回家', () => plan({ len: 4, push: 'need', extra: true, shop: true, shopUntil: 8, wipe: 'smart', yuan: 'lamp' }), 300);
stats('B 照需要配匣、四张链、不买牌、元宵回家', () => plan({ len: 4, push: 'need', extra: true, wipe: 'smart', yuan: 'lamp' }), 300);
stats('C 五张贪心、买牌、不管她、元宵上台', () => plan({ len: 5, push: 0, shop: true, shopUntil: 9, wipe: 'never', yuan: 'stage' }), 300);
stats('D 四张链、买牌、只推一张、每天让她擦', () => plan({ len: 4, push: 1, shop: true, shopUntil: 8, wipe: 'always', yuan: 'lamp' }), 300);
stats('E 乱打够五张、推三张', r => plan({ len: 5, random: r, push: 3, extra: true, yuan: 'lamp' }), 300);
stats('F 只顾家：不演，推够需要', () => plan({ len: 0, push: 'need', extra: true, yuan: 'lamp' }), 300);
stats('乱走', r => chaos(r), 300);

// 第十節的難度目標
ok(W('E 乱打够五张、推三张', 1) === 0, '乱打够数量不能拿第一');
ok(W('B 照需要配匣、四张链、不买牌、元宵回家', 1) < 0.35, '不买牌很难拿第一');
ok(W('A 照需要配匣、四张链、买牌、元宵回家', 1) > 0.5, '会配匣、会买牌，多半能拿第一');
ok(End('A 照需要配匣、四张链、买牌、元宵回家', '满堂彩') > 0.3 && End('A 照需要配匣、四张链、买牌、元宵回家', '满堂彩') < 0.9, '满堂彩打得到，但不是必然');
ok(End('C 五张贪心、买牌、不管她、元宵上台', '头牌') > 0.8, '只顾台上：头牌');
ok(End('E 乱打够五张、推三张', '满堂彩') === 0 && W('乱走', 1) === 0, '乱打走不到满堂彩，也拿不到第一');
ok(End('D 四张链、买牌、只推一张、每天让她擦', '满堂彩') < 0.2, '天天让她擦、只推一张：到不了满堂彩');
console.log(fails ? `\n${fails} 项不对` : '\n全部通过');
process.exit(fails ? 1 : 0);
