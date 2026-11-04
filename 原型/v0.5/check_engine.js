// 核對 v0.5 原型的規則引擎：規則單項檢查、亂走一千局找崩壞，以及三種打法的金箔與結局分布。
// 用法：node 原型/v0.5/check_engine.js
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const code = html.split('/* ENGINE START */')[1].split('/* ENGINE END */')[0];
const E = new Function(`${code}; return { R, T, FAM, SCRIPTS, newGame, beginDay, choose, toggleBox, canAdd, pickScript, buyShop, stash, depart, canDepart,
  canStage, playStage, nextSeg, canEndStage, endStage, combosOf, sigBonus, canWipe, wipe, canRoll, selfRoll, canClean, selfClean, lineOf,
  enterHome, canHome, playHome, trayDue, canTray, tray, endEvening, sleep, dawn, nextWeek, endingOf, boxCapOf, brokenOf, specialOf,
  sumSlots, sideSlots, capFree, fOf, slotsOf, tOf, scriptNow, topLayer, weekOf, lookOf, isStage, factsOf };`)();

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails += 1; console.log('✗', msg); } };

// ── 規則單項 ──
{
  const P = (...a) => a.map(([f, seg]) => ({ f, seg }));
  const ks = cs => cs.map(c => `${c.k}@${c.at.join(',')}`).join(' ');
  const segs = ['sing', 'speak', 'act'];
  ok(ks(E.combosOf(segs, P(['sing', 0], ['speak', 1], ['act', 2]))) === 'whole@0,1,2', '三段各一張、相鄰、對上：整折');
  ok(ks(E.combosOf(segs, P(['sing', 0], ['sing', 0], ['speak', 1], ['act', 2]))) === 'whole@1,2,3', '起段多一張，取最後一張成整折');
  ok(ks(E.combosOf(segs, P(['sing', 0], ['speak', 1], ['speak', 1], ['act', 2]))) === 'duet@0,1', '承段兩張：不成整折，起承成對唱');
  ok(ks(E.combosOf(['act', 'fight', 'sing'], P(['act', 0], ['fight', 1], ['sing', 2]))) === 'whole@0,1,2', '整折優先，做→打不再算武身');
  ok(ks(E.combosOf(segs, P(['act', 0], ['fight', 0], ['sing', 1], ['speak', 1]))) === 'wushen@0,1 duet@2,3', '兩組搭檔各算一次');
  ok(ks(E.combosOf(segs, P(['sing', 0], ['act', 1], ['speak', 1]))) === '', '中間插牌就不相鄰');

  const S = E.newGame('测', 7);
  const id = t => S.deck.find(c => c.t === t).id;
  ok(E.lineOf(S, 'sing') === 5 && E.lineOf(S, 'speak') === 4, '安心 3：重層 5–6、輕層 4–6');
  S.calm = 2;
  ok(E.lineOf(S, 'fight') === 6 && E.lineOf(S, 'act') === 5, '安心 2：重層 6、輕層 5–6');
  S.calm = 3;
  ok(E.boxCapOf(S) === 15, '開局妝匣 15');
  S.seen = 4; S.hand = 2; S.base = 3;
  ok(E.boxCapOf(S) === 14, '被看見 4 +1、手傷 2 −1、底色 3 −1');
  S.rift = 3; S.pen.minus = true; S.seen = 1;
  ok(E.boxCapOf(S) === 11, '再加裂痕 3、排名 −2：11');
  S.hand = 3; S.base = 9; S.rift = 4;
  ok(E.boxCapOf(S) >= E.R.boxMin, '妝匣下限 10');

  // 招牌特技
  const G = E.newGame('测', 3);
  const gid = t => G.deck.find(c => c.t === t && !G.T.box.includes(c.id)).id;
  ['shuaixiu', 'dabai', 'manban', 'dingchang', 'jingzhun', 'liangxiang', 'shuixiu'].forEach(t => E.toggleBox(G, gid(t)));
  E.depart(G);
  const play = t => { const i = G.T.box.find(x => G.deck.find(c => c.id === x).t === t && !G.T.used[x]); E.playStage(G, i); return G.T.plays[G.T.plays.length - 1]; };
  ok(play('shuaixiu').sig === 1, '甩袖長腔當第一張 +1');
  ok(play('dingchang').sig === 0, '');
  E.nextSeg(G);
  ok(play('jingzhun').sig === 1, '精準身段緊接念 +1');
  ok(play('dabai').sig === 1, '大段念白：已打出 3 張 +1');
  E.nextSeg(G);
  ok(play('liangxiang').sig === 2, '武戲亮相：已打出唱 +2');
  play('manban');
  ok(G.T.plays.length === 6 && G.T.seg === 2 && !E.canStage(G, G.T.box.find(x => G.deck.find(c => c.id === x).t === 'shuixiu')), '轉段打 2 位＋唱 1 位，滿 3 位');

  // 妝匣兩邊上限
  const B = E.newGame('测', 5);
  B.deck.filter(c => E.isStage(E.T[c.t].f)).forEach(c => E.toggleBox(B, c.id));
  ok(E.sideSlots(B, B.T.box, 'stage') <= 9, '演戲牌裝匣不超過 9 位');
}

// ── 打法 ──
const rnd = seed => () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
const pickOne = (r, a) => a[Math.floor(r() * a.length)];
const cardsOf = (S, pred) => S.deck.filter(c => pred(E.T[c.t])).map(c => c.id);
// 裝進妝匣（已經在匣裡就不動；toggleBox 會把它拿出來）
const put = (S, id) => { if (!S.T.box.includes(id)) E.toggleBox(S, id); };

function morning(S, plan) {
  const k = E.specialOf(S);
  if (k) E.choose(S, k === 'bday' ? plan.bday : 'stage');
  plan.box(S);
}
function clean(S, keep) {
  for (let guard = 0; guard < 40 && E.topLayer(S); guard++) {
    if (E.canRoll(S)) { E.selfRoll(S); continue; }
    const spare = S.T.box.filter(id => E.canClean(S, id) && !keep.includes(id));
    if (!spare.length) break;
    E.selfClean(S, spare[0]);
  }
}
function run(seed, plan) {
  const S = E.newGame('测', seed);
  let steps = 0;
  while (S.phase !== 'end' && steps++ < 5000) {
    if (S.phase === 'morning') { morning(S, plan); E.depart(S); }
    else if (S.phase === 'stage') { plan.stage(S); E.endStage(S); }
    else if (S.phase === 'door') { plan.door(S); E.enterHome(S); }
    else if (S.phase === 'evening') { plan.evening(S); if (E.trayDue(S)) E.tray(S, plan.tray(S)); E.endEvening(S); }
    else if (S.phase === 'night') { plan.night(S); E.sleep(S); }
    else if (S.phase === 'watch') E.dawn(S);
    else if (S.phase === 'week') E.nextWeek(S);
    check(S);
  }
  ok(S.phase === 'end', `第 ${seed} 局沒走完（停在 ${S.phase}）`);
  return S;
}
function check(S) {
  const t = S.T, c = [['calm', 0, 5], ['seen', 0, 5], ['rift', 0, 4], ['hurt', 0, 3], ['hand', 0, 3], ['lamp', 0, 5]];
  c.forEach(([k, lo, hi]) => ok(S[k] >= lo && S[k] <= hi, `${k} 超出範圍：${S[k]}`));
  ok(S.gold >= 0, '金箔不能是負的');
  ok(S.deck.length <= E.R.deckCap, '卡組超過 30');
  ok(E.sumSlots(S, t.box) <= t.cap - t.reserved, '妝匣裝多了');
  ok(t.homeSlots <= E.R.homeMax, '家中超過 9 位');
  ok(t.plays.reduce((a, p) => a + E.slotsOf(S, p.id), 0) <= E.R.stageMax, '演戲超過 9 位');
  ok(t.cap >= E.R.boxMin, '妝匣小於 10');
}

// 亂走：每一步從合法動作裡隨便挑
const chaos = r => ({
  bday: r() < 0.5 ? 'night' : 'bday',
  box(S) {
    E.pickScript(S, r() < 0.5 ? 0 : 1);
    if (r() < 0.3) E.buyShop(S, pickOne(r, E.R && ['kutou', 'shuban', 'qiba', 'fandiao', 'guankou', 'gentou', 'gadiao', 'baikou', 'tangma', 'mantang', 'kuaiban', 'dadao']));
    if (r() < 0.1) { const c = S.deck.find(x => !E.T[x.t].lock); if (c) E.stash(S, c.id); }
    for (let i = 0; i < 40; i++) { const c = pickOne(r, S.deck); E.toggleBox(S, c.id); }
  },
  stage(S) {
    for (let i = 0; i < 20; i++) {
      if (r() < 0.25) E.nextSeg(S);
      const ids = S.T.box.filter(id => E.canStage(S, id));
      if (!ids.length || r() < 0.1) break;
      E.playStage(S, pickOne(r, ids));
    }
    if (!E.canEndStage(S)) { const ids = S.T.box.filter(id => E.canStage(S, id)); E.playStage(S, ids[0]); }
  },
  door(S) { if (r() < 0.5) E.wipe(S); for (let i = 0; i < 6; i++) { if (E.canRoll(S)) E.selfRoll(S); else { const ids = S.T.box.filter(id => E.canClean(S, id)); if (ids.length && r() < 0.6) E.selfClean(S, pickOne(r, ids)); } } },
  evening(S) { for (let i = 0; i < 10; i++) { const ids = S.T.box.filter(id => E.canHome(S, id)); if (!ids.length || r() < 0.15) break; E.playHome(S, pickOne(r, ids)); } },
  tray: () => r() < 0.5,
  night(S) { clean(S, []); },
});

// 只算外賬：整匣都拿去演，家裡一張不出，夜裡用剩的牌卸
const greedy = {
  bday: 'night',
  box(S) {
    E.pickScript(S, 0);
    cardsOf(S, tp => E.isStage(tp.f)).sort((a, b) => (E.T[S.deck.find(c => c.id === b).t].g ?? 0) - (E.T[S.deck.find(c => c.id === a).t].g ?? 0)).forEach(id => put(S, id));
    S.deck.forEach(c => put(S, c.id));
  },
  stage(S) {
    const segs = E.scriptNow(S).segs;
    for (let seg = 0; seg < 3; seg++) {
      while (S.T.seg === seg) {
        const ids = S.T.box.filter(id => E.canStage(S, id));
        if (!ids.length) break;
        const want = ids.find(id => E.fOf(S, id) === segs[seg]) ?? ids[0];
        E.playStage(S, want);
      }
      E.nextSeg(S);
    }
  },
  door(S) { clean(S, []); },
  evening() {},
  tray: () => false,
  night(S) { clean(S, []); },
};

// 兩頭顧：照劇本各段一張、整折相鄰；家裡出對路的牌；門口讓她擦，剩下的層用備牌卸
function balanced(extra) {
  const want = S => {
    const look = S.T.look, fam = Object.keys(E.FAM).find(f => E.FAM[f].match === look);
    return [fam, 'comp', 'care', 'listen', 'labor'].filter((f, i, a) => f && a.indexOf(f) === i);
  };
  return {
    bday: 'bday',
    box(S) {
      E.pickScript(S, S.day % 2);
      const segs = E.scriptNow(S).segs, take = [];
      segs.forEach((f, i) => {
        const pool = S.deck.filter(c => E.T[c.t].f === f && !take.includes(c.id));
        pool.sort((a, b) => (E.T[b.t].sig ? 1 : 0) - (E.T[a.t].sig ? 1 : 0) || (E.T[b.t].g ?? 0) - (E.T[a.t].g ?? 0));
        if (pool[0]) take.push(pool[0].id);
        if (i === 0 && extra) { const s = S.deck.find(c => E.T[c.t].f === 'sing' && !take.includes(c.id)); if (s) take.unshift(s.id); }
      });
      want(S).forEach(f => { const c = S.deck.find(x => E.T[x.t].f === f && !take.includes(x.id)); if (c) take.push(c.id); });
      take.forEach(id => put(S, id));
      S.deck.filter(c => E.FAM[E.T[c.t].f].slots === 1).forEach(c => put(S, c.id));
      S.T.plan = take;
    },
    stage(S) {
      const segs = E.scriptNow(S).segs, used = new Set();
      const plan = S.T.plan.filter(id => E.isStage(E.fOf(S, id)));
      if (extra && plan.length > 3) { E.playStage(S, plan[0]); used.add(plan[0]); }
      segs.forEach((f, i) => {
        const id = plan.find(x => !used.has(x) && E.fOf(S, x) === f);
        if (id !== undefined) { E.playStage(S, id); used.add(id); }
        if (i < 2) E.nextSeg(S);
      });
      if (!S.T.plays.length) { const id = S.T.box.find(x => E.canStage(S, x)); if (id !== undefined) E.playStage(S, id); }
    },
    door(S) { E.wipe(S); clean(S, S.T.plan); },
    evening(S) {
      want(S).forEach(f => { const id = S.T.box.find(x => E.canHome(S, x) && E.fOf(S, x) === f); if (id !== undefined) E.playHome(S, id); });
    },
    tray: S => S.hand <= 1,
    night(S) { clean(S, []); },
  };
}

// 會算的玩家：每個劇本先排出「期望金箔 − 層數 × lam − 手傷 × mu」最高的出牌順序，之後每天照著出
const FAMS = ['sing', 'speak', 'act', 'fight'];
const SEQS = (() => {
  const out = [[]];
  const grow = (seq, slots) => FAMS.forEach(f => { const s = slots + E.FAM[f].slots; if (s <= 3) { const n = seq.concat(f); out.push(n); grow(n, s); } });
  grow([], 0);
  return out;
})();
const sigOf = (f, P, i) => (f === 'sing' ? (i === 0 ? 1 : 0) : f === 'speak' ? (i >= 3 ? 1 : 0) : f === 'act' ? (i > 0 && P[i - 1].f === 'speak' ? 1 : 0) : (P.slice(0, i).some(p => p.f === 'sing') ? 2 : 0));
function expectGold(segs, P) {
  let g = P.reduce((a, p) => a + E.FAM[p.f].g, 0);
  FAMS.forEach(f => { const i = P.findIndex((p, j) => p.f === f && sigOf(f, P, j)); if (i >= 0) g += sigOf(f, P, i); });
  const cs = E.combosOf(segs, P), aligned = [0, 1, 2].every(i => P.some(p => p.seg === i && p.f === segs[i]));
  let ev = 0;
  const N = 6 ** cs.length;
  for (let m = 0; m < N; m++) {
    let x = m, cg = 0, any = false;
    cs.forEach(c => { const v = (x % 6) + 1; x = Math.floor(x / 6); cg += (c.k === 'whole' ? E.R.whole : E.R.pair)[v]; if (v >= 4) any = true; });
    ev += aligned && any ? Math.floor((g + cg) * E.R.perfect) : g + cg;
  }
  return ev / N;
}
function bestPlan(segs, lam, mu, maxCards) {
  const cap = { sing: 3, speak: 3, act: 3, fight: 2 };
  let best = null;
  for (const a of SEQS) for (const b of SEQS) for (const c of SEQS) {
    const fams = [...a, ...b, ...c];
    if (!fams.length || fams.length > maxCards || FAMS.some(f => fams.filter(x => x === f).length > cap[f])) continue;
    const P = [...a.map(f => ({ f, seg: 0 })), ...b.map(f => ({ f, seg: 1 })), ...c.map(f => ({ f, seg: 2 }))];
    const heavy = fams.filter(f => f === 'sing').length + fams.filter(f => f === 'fight').length * 2;
    const score = expectGold(segs, P) - fams.length * lam - (heavy >= E.R.handLine ? mu : 0);
    if (!best || score > best.score) best = { score, P, ev: expectGold(segs, P) };
  }
  return best;
}
function strong(lam, mu, maxCards) {
  const plans = E.SCRIPTS.map(w => w.map(sc => bestPlan(sc.segs, lam, mu, maxCards)));
  const want = S => {
    const fam = Object.keys(E.FAM).find(f => E.FAM[f].match === S.T.look);
    return [fam, 'comp', 'care', 'listen'].filter((f, i, a) => f && a.indexOf(f) === i);
  };
  const planOf = S => plans[E.weekOf(S.day) - 1][S.T.script];
  return {
    bday: 'bday',
    box(S) {
      const w = E.weekOf(S.day) - 1;
      E.pickScript(S, plans[w][0].score >= plans[w][1].score ? 0 : 1);
      const P = planOf(S).P, take = [];
      FAMS.forEach(f => {
        const n = P.filter(p => p.f === f).length;
        S.deck.filter(c => E.T[c.t].f === f).sort((a, b) => (E.T[b.t].sig ? 1 : 0) - (E.T[a.t].sig ? 1 : 0) || (E.T[b.t].g ?? 0) - (E.T[a.t].g ?? 0)).slice(0, n).forEach(c => take.push(c.id));
      });
      want(S).forEach(f => { const c = S.deck.find(x => E.T[x.t].f === f && !take.includes(x.id)); if (c) take.push(c.id); });
      take.forEach(id => put(S, id));
      S.deck.filter(c => E.FAM[E.T[c.t].f].slots === 1).forEach(c => put(S, c.id));
      S.T.keep = take.filter(id => !E.isStage(E.fOf(S, id)));
    },
    stage(S) {
      planOf(S).P.forEach(p => {
        while (S.T.seg < p.seg) E.nextSeg(S);
        const ids = S.T.box.filter(id => E.canStage(S, id) && E.fOf(S, id) === p.f);
        const sigNow = ids.find(id => E.tOf(S, id).sig && E.sigBonus(S, id));
        const plain = ids.filter(id => !E.tOf(S, id).sig).sort((a, b) => (E.tOf(S, b).g ?? 0) - (E.tOf(S, a).g ?? 0));
        const id = sigNow ?? plain[0] ?? ids[0];
        if (id !== undefined) E.playStage(S, id);
      });
      if (!S.T.plays.length) { const id = S.T.box.find(x => E.canStage(S, x)); if (id !== undefined) E.playStage(S, id); }
    },
    door(S) { E.wipe(S); clean(S, S.T.keep); },
    evening(S) {
      want(S).forEach(f => { const id = S.T.box.find(x => E.canHome(S, x) && E.fOf(S, x) === f); if (id !== undefined) E.playHome(S, id); });
    },
    tray: S => S.hand === 0,
    night(S) { clean(S, []); },
    plans,
  };
}

function stats(name, plan, n) {
  const ends = {}, flows = [[], [], [], []], f = { perfect: 0, eyes: 0, empty: 0 };
  let gold = 0, needs = 0, hurt = 0, base = 0, broken = 0, pass = 0;
  const why = { 安心0: 0, 裂痕3: 0, 伤3: 0 }, src = { 端盘失手: 0, 冷落: 0, 不接盘: 0 };
  for (let s = 1; s <= n; s++) {
    const S = run(1000 + s, typeof plan === 'function' ? plan(rnd(s)) : plan);
    const e = E.endingOf(S);
    ends[e] = (ends[e] || 0) + 1;
    S.weeks.forEach((w, i) => { flows[i].push(w.flow); pass += w.perf ? 1 : 0; });
    gold += S.total; needs += S.needDone.filter(Boolean).length; hurt += S.hurt; base += S.base; broken += E.brokenOf(S) ? 1 : 0;
    if (S.calm <= 0) why.安心0 += 1; if (S.rift >= 3) why.裂痕3 += 1; if (S.hurt >= 3) why.伤3 += 1;
    S.log.forEach(x => { if (x.tray && x.tray.fail) src.端盘失手 += 1; if (x.tray && !x.tray.accept) src.不接盘 += 1; if (x.cold) src.冷落 += 1; });
    const F = E.factsOf(S); f.perfect += F.perfect; f.eyes += F.eyes; f.empty += F.empty;
  }
  const per = o => Object.entries(o).map(([k, v]) => `${k} ${(v / n).toFixed(2)}`).join(' ');
  const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(0);
  const pct = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor((b.length - 1) * p)]; };
  console.log(`\n${name}\n  每周流水 平均 ${flows.map(avg).join('/')}（下四分位 ${flows.map(a => pct(a, 0.25)).join('/')}，过线 ${(pass / n / 4 * 100).toFixed(0)}%）  总金 ${(gold / n).toFixed(0)}  完美 ${(f.perfect / n).toFixed(1)} 天`
    + `\n  抬眼 ${(f.eyes / n).toFixed(1)}  空宅 ${(f.empty / n).toFixed(1)}  需求 ${(needs / n).toFixed(1)}/4  伤 ${(hurt / n).toFixed(1)}  底色 ${(base / n).toFixed(1)}  破裂 ${broken}/${n}（${per(why)}）  每局 ${per(src)}`
    + `\n  结局 ${JSON.stringify(ends)}`);
}

for (let s = 1; s <= 1000; s++) run(s, chaos(rnd(s)));
console.log(`周考核业绩线：${E.R.lines.join('/')}`);
stats('乱走', s => chaos(s), 300);
stats('贪心', greedy, 300);
stats('两头顾', balanced(false), 300);
stats('两头顾+', balanced(true), 300);
const sharp = strong(1.5, 4, 6);
console.log('\n会算的玩家每个剧本排的出牌：');
E.SCRIPTS.forEach((w, i) => w.forEach((sc, j) => { const p = sharp.plans[i][j]; console.log(`  ${sc.n.padEnd(5)} ${[0, 1, 2].map(k => p.P.filter(x => x.seg === k).map(x => E.FAM[x.f].n).join('') || '—').join(' | ')}  期望 ${p.ev.toFixed(1)}`); }));
stats('会算（每层扣 1.5）', sharp, 300);
stats('会算（每层扣 3）', strong(3, 6, 6), 300);
console.log(fails ? `\n${fails} 项不对` : '\n全部通过');
process.exit(fails ? 1 : 0);
