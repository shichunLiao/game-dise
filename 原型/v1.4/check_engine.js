// 核對 v1.4 中刪版的規則引擎：規則單項、亂走一千局，以及幾種打法的金箔、名次與結局分布（對照設定的數值自檢）。
// 用法：node 原型/v1.4/check_engine.js
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const code = html.split('/* ENGINE START */')[1].split('/* ENGINE END */')[0];
const E = new Function(`${code}; return { R, T, FAM, HOME, BASIC, SHOP, GIFT, SPELLS, RIVALS, EVENTS, LOOK_HOME, ENDING_N, RELICS, has, lack, lookOfCard, newGame, beginDay, choose, toggleBox, canAdd, clearBox,
  canBuy, buy, purseOf, canDepart, depart, canStage, playStage, fits, hearCrowd, canEndStage, endStage, nextFam, nextBonus, canWipe, wipe, canClean, selfClean, dyeOf,
  enterHome, canHome, playHome, judgeNeed, willDye, isMatch, coveredFams, endEvening, lightLamp, sleep, dawn, nextAct, finishWipe, boardOf, rankOf, rivalGold, rivalDay,
  wifeOf, endingOf, broken, cracksOf, happyOK, endDay, examOf, nextExam, boxCapOf, starterOf, seatEmpty, lookNow, needOf, spellOf, actOf, fOf, tOf, cardOf, eventOf };`)();

// 調數值用：OVR='{"R":{...},"rivals":[20,17,14,7,9],"T":{"qiba":{"g":8}}}'
if (process.env.OVR) { const o = JSON.parse(process.env.OVR); Object.assign(E.R, o.R || {}); (o.rivals || []).forEach((g, i) => { E.RIVALS[i].g = g; }); Object.entries(o.T || {}).forEach(([k, v]) => Object.assign(E.T[k], v)); Object.entries(o.RELICS || {}).forEach(([k, v]) => Object.assign(E.RELICS[k], v)); (o.pats || []).forEach((p, i) => { if (p) E.SPELLS[i].pats = p; }); }
const QUIET = !!process.env.QUIET;
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails += 1; if (!QUIET) console.log('✗', msg); } };
const take = (S, t) => S.T.box.find(id => S.deck.find(c => c.id === id).t === t && !S.T.used[id]);
const famOfLook = look => Object.keys(E.FAM).find(f => E.HOME[E.FAM[f].home].look === look);

// ── 規則單項 ──
{
  const S = E.newGame('测', 11);
  ok(S.phase === 'stage' && S.T.box.length === 10, '第 1 天直接上台，妝匣已裝好 10 張');
  ok(E.nextFam(S) === 'sing' && !E.canStage(S, take(S, 'bai')), '第 1 天起手唱，第一張必須打起手族');
  ['changqiang', 'bai', 'shenduan', 'liangxiang'].forEach(t => E.playStage(S, take(S, t)));
  ok(S.T.stageGold === 7 && S.T.comboGold === 3 && S.T.openGold === 0, '四張鏈：牌面 7，每接上一張 +1（共 3），沒有開得正');
  ok(!E.canStage(S, take(S, 'liangsang')), '台上最多 4 張');
  ok(S.T.layers.length === 4 && S.base === 0, '四層都掛在臉上，不滲');
  E.endStage(S);
  ok(S.T.gold === 10 && S.T.die === null, '收場不擲骰，金就是加總');

  // 接錯：只是連擊歸零，不帶東西回家
  const B = E.newGame('测', 12);
  B.day = 3; E.beginDay(B); B.T.box = B.deck.slice(0, 10).map(c => c.id); B.phase = 'stage';
  const st = E.starterOf(B), a0 = B.T.box.find(id => E.fOf(B, id) === st);
  E.playStage(B, a0);
  const wrong = B.T.box.find(id => !B.T.used[id] && !E.fits(B, id));
  const p = E.playStage(B, wrong);
  ok(p.broke && p.extra === 0 && B.T.chain === 1, '接錯：連擊歸零，這張不多給金');
  E.endStage(B);
  while (B.T.layers.length) E.selfClean(B, B.T.box.find(id => !B.T.used[id]));
  ok(E.dyeOf(B) === 0 && !E.canWipe(B), '臉卸乾淨了：一張也不染，也沒得擦');

  // 重彩、百搭、素
  const H = E.newGame('测', 13);
  H.day = 5; E.beginDay(H); H.phase = 'stage'; H.T.box = [];
  const add = (Z, t) => { const c = { id: Z.nid++, t }; Z.deck.push(c); Z.T.box.push(c.id); return c.id; };
  const st5 = E.starterOf(H), s1 = add(H, E.BASIC.find(t => E.T[t].f === st5)), w = add(H, 'jijifeng'), m = add(H, 'manban');
  E.playStage(H, s1);
  ok(E.fits(H, w), '百搭接在什麼後面都算接上');
  E.playStage(H, w);
  ok(H.T.chain === 2 && E.nextFam(H) === '*' && E.fits(H, m), '百搭接上，後面打什麼都接得上');
  const pm = E.playStage(H, m);
  ok(pm.hit && H.T.chain === 3 && H.T.layers.length === 4, '重彩留兩層');
  const K = E.newGame('测', 14);
  K.day = 6; E.beginDay(K); K.phase = 'stage'; K.T.box = [];
  const k1 = add(K, ['daoban', 'jijifeng'].find(t => E.T[t].f !== E.starterOf(K)));
  ok(E.canStage(K, k1), '百搭能起手');
  E.playStage(K, k1);
  const pk = E.playStage(K, add(K, 'qingchang'));
  ok(pk.hit && pk.layers === 0 && K.T.layers.length === 1, '素：接上了、不上妝');

  // 讓她擦：一次擦乾淨，今晚只聽得下 1 張
  const D = E.newGame('测', 3);
  ['changqiang', 'bai', 'shenduan'].forEach(t => E.playStage(D, take(D, t))); E.endStage(D);
  ok(E.canWipe(D) && E.wipe(D) === 3 && D.T.layers.length === 0 && D.T.homeCap === 1 && D.chest.length === 3, '讓她擦：三層一次擦乾淨，今晚只聽 1 張');
  ok(!E.canWipe(D), '一晚只擦一次');

  // 第 1 天傍晚自動：她只說明晚
  const G = E.newGame('测', 7);
  E.endStage(G); E.enterHome(G);
  ok(G.T.forecast && G.T.forecast.nights.length === 1 && G.T.forecast.look === G.looks[0] && G.known[2] && !G.known[3], '第 1 天晚上她只說第 2 天要什麼');
  ok(G.phase === 'night', '第 1 天吃完飯停在夜裡，等玩家自己點「睡吧」');
  E.sleep(G); E.dawn(G);
  ok(G.day === 2 && G.phase === 'morning', '第 1 天睡了以後天亮');
  ok(!E.hearCrowd(G), '台下不再遞話');
}
{
  // 需要：每晚一樣東西，一張或兩張；沒推夠裂一道（燈不掉）；整段對上送家常牌；每晚預告明晚
  const cnt = {};
  for (let s = 1; s <= 400; s++) {
    const X = E.newGame('测', s);
    for (let d = 2; d <= 9; d++) { cnt[X.pats[d]] = (cnt[X.pats[d]] || 0) + 1; ok(E.needOf(X, d).items.length === 1, '每晚只要一樣東西'); }
    ok(X.pats[2] === 'A1' && X.pats[3] === 'A1', '第一段每晚一張');
    ok(X.pats[8] === 'A2' && X.pats[9] === 'A2', '第三幕每晚兩張');
  }
  ok(Object.keys(cnt).sort().join() === 'A1,A2', `只有一張、兩張：${JSON.stringify(cnt)}`);
  const famsFor = (S, look) => Object.keys(E.FAM).filter(f => E.HOME[E.FAM[f].home].look === look);
  const M = E.newGame('测', 21);
  const meet = (d, n) => {
    M.day = d; E.beginDay(M);
    const st = E.starterOf(M), x = E.needOf(M).items[0];
    M.T.box = [];
    M.deck.filter(c => famsFor(M, x.look).includes(E.T[c.t].f) && !E.T[c.t].home && !M.T.box.includes(c.id)).slice(0, n ?? x.n).forEach(c => M.T.box.push(c.id));
    M.T.box.push(M.deck.find(c => E.T[c.t].f === st && !M.T.box.includes(c.id) && !E.T[c.t].home).id);
    E.depart(M); E.endStage(M); E.enterHome(M);
    M.T.box.filter(id => E.isMatch(M, id)).slice(0, 3).forEach(id => E.playHome(M, id));
    E.endEvening(M);
  };
  meet(4);
  ok(M.T.met && !M.T.gift && M.met[1] === 1, '第 4 天推夠，這一段記一次');
  ok(M.T.forecast && M.T.forecast.nights.length === 1 && M.T.forecast.nights[0].d === 5 && M.T.forecast.look === M.looks[1] && M.known[5], '每晚睡前她說明晚要什麼');
  meet(5);
  const g = E.GIFT[E.LOOK_HOME[M.looks[1]]];
  ok(M.T.met && M.T.gift === g && M.deck.some(c => c.t === g), `整段對上：她送一張 ${g}`);
  ok(M.T.forecast.look === M.looks[2] && M.T.forecast.nights[0].pat === M.pats[6] && !M.known[7], '預告的花樣和真的一樣，只說一晚');
  // 沒推夠：裂一道，燈不掉
  const lamp0 = M.lamp, out0 = M.outs;
  meet(6, 0);
  ok(!M.T.met && M.outs === out0 + 1 && M.lamp === lamp0 && M.T.cracked === 1, '沒推夠：燈上裂一道，燈不掉');
  // 家常牌：只能推，對上算兩張、燈 +3；灯油再 +1
  M.day = 6; E.beginDay(M);
  const gid = M.deck.find(c => c.t === g).id;
  M.T.box = [gid]; M.phase = 'stage';
  ok(!E.canStage(M, gid), '家常牌不能上台');
  M.day = 4; E.beginDay(M); M.T.box = [gid]; M.phase = 'stage'; E.endStage(M); E.enterHome(M);
  const r2 = E.playHome(M, gid);
  ok(r2.match && r2.count === 2 && r2.gain === 3, '家常牌對上：算兩張、燈 +3');
  // 推了被染的牌：裂一道
  const Y = E.newGame('测', 22);
  Y.day = 4; E.beginDay(Y); Y.T.box = Y.deck.map(c => c.id); Y.phase = 'stage';
  E.playStage(Y, Y.T.box.find(id => E.fOf(Y, id) === E.starterOf(Y))); E.endStage(Y); E.enterHome(Y);
  ok(Y.T.dye === 1, '一層沒卸：染一張');
  const rd = E.playHome(Y, Y.T.box.find(id => E.canHome(Y, id)));
  ok(rd.dyed && rd.scar === 1 && Y.scars === 1 && rd.gain === 0, '推了被染的牌：裂一道，燈不漲');
  // 裂滿 5 道：她走
  const Lf = E.newGame('测', 51);
  Lf.day = 5; E.beginDay(Lf); Lf.outs = 2; Lf.scars = 2; Lf.lamp = 6;
  Lf.T.box = [Lf.deck.find(c => E.T[c.t].f === E.starterOf(Lf)).id]; E.depart(Lf); E.endStage(Lf); E.enterHome(Lf); E.endEvening(Lf);
  ok(Lf.left === 5 && E.broken(Lf) && Lf.phase === 'night', '裂第 5 道：她當晚就走了');
  E.sleep(Lf); E.dawn(Lf);
  ok(Lf.phase === 'lastwipe' && Lf.day === 5, '她走了：天亮就是最後一次卸妝，不再往下演');
  ok(E.endDay(Lf) === 5 && ['头牌', '戏散', '更夫'].includes(E.endingOf(Lf)), `她走了：結局在破裂那一欄（${E.endingOf(Lf)}）`);
  ok(Lf.T.watch.tx.includes('门开着'), '更夫說門開著');
}
{
  // 後台：三種詞條各兩張、三樣物件；買東西花的就是賣座
  ok(E.SHOP.length === 6 && E.SHOP.every(k => E.T[k].wild || E.T[k].heavy || E.T[k].clean), '後台只有百搭、重彩、素');
  ok(Object.keys(E.RELICS).sort().join() === 'lian,qinshi,you', '物件只有琴師、妝奩、燈油');
  const P = E.newGame('测', 31);
  P.day = 3; E.beginDay(P);
  ok(P.T.offers.length === 3 && P.T.offers.filter(k => E.RELICS[k]).length === 1, '第 3 天起後台兩張牌、一樣物件');
  const k = P.T.offers.find(x => !E.RELICS[x]);
  ok(!E.canBuy(P, k), '錢不夠買不了');
  P.gold = 40;
  E.buy(P, k);
  ok(P.gold === 40 - E.T[k].price && P.spent === E.T[k].price && P.deck.some(c => c.t === k), '買牌花的就是賣座');
  ok(!E.canBuy(P, k), '同一樣一天只能買一次');
  ok(E.newGame('测', 31).T.offers.length === 0, '第 1、2 天後台不開');
  const Q = E.newGame('测', 32); Q.day = 3; E.beginDay(Q); Q.gold = 99;
  const rk = Q.T.offers.find(x => E.RELICS[x]);
  const cap0 = Q.T.cap; E.buy(Q, rk);
  ok(Q.relics.includes(rk) && !Q.deck.some(c => c.t === rk), '物件不進卡組，整季都在');
  if (rk === 'lian') ok(Q.T.cap === cap0 + 1, '妝奩：今天就多一格');
  const relic = (key, fn) => { const Z = E.newGame('测', 33); Z.relics = [key]; return fn(Z); };
  ok(relic('qinshi', Z => { ['changqiang', 'bai', 'shenduan'].forEach(t => E.playStage(Z, take(Z, t))); return Z.T.comboGold; }) === 2 + 2, '琴師：每接上一張再 +1');
  ok(relic('you', Z => { Z.day = 2; E.beginDay(Z); const look = E.needOf(Z).look; Z.phase = 'evening'; Z.T.box = [Z.deck.find(c => E.lookOfCard(Z, c.id) === look).id]; return E.playHome(Z, Z.T.box[0]).gain; }) === 3, '燈油：對路的牌燈 +3');
  ok(relic('lian', Z => { Z.day = 3; E.beginDay(Z); return Z.T.cap; }) === 11, '妝奩：妝匣 11 格');

  // 事件
  ok(!E.EVENTS.tip && !E.EVENTS.cheer, '沒有遞話、捧場');
  const V = E.newGame('测', 41);
  ok([5, 6, 9].every(d => V.events[d]) && !V.events[3] && !V.events[7], '第 5、6、9 天各一件同門的事');
  const grabDay = Object.keys(V.events).find(d => V.events[d] === 'grab');
  if (grabDay) { V.day = +grabDay; E.beginDay(V); ok(V.T.stageMax === 3, '月仙搶戲：只剩三張'); }
  ok(E.newGame('测', 1).deck.length === 16, '開局 16 張，沒有借來的牌');
  // 水牌：早上看昨天的
  const W = E.newGame('测', 42); W.day = 5; E.beginDay(W);
  ok(E.rivalGold(W, 0) === E.rivalGold(W, 0, 4), '早上的水牌記到昨天');
  ok(E.rivalGold(W, 4, 7) === E.rivalGold(W, 4, 3), '小鳳病的那幾天沒有金');

  // 結局（裂 = 痕 + 熄）
  const end = (gold, cracks, lamp, choice) => { const Z = E.newGame('甲', 1); Z.day = 10; Z.phase = 'reveal'; Z.gold = gold; Z.outs = cracks; Z.lamp = lamp; Z.choice = choice; return E.endingOf(Z); };
  const top = 999, mid = E.rivalGold(E.newGame('甲', 1), 2, 10) + 1;
  [[top, 0, 30, 'lamp', '满堂彩'], [top, 0, E.R.happyLamp - 1, 'lamp', '压台'], [top, 1, 30, 'lamp', '压台'], [top, 0, 30, 'stage', '压台'], [top, 5, 30, 'stage', '头牌'], [mid, 0, 30, 'lamp', '留白'], [mid, 0, 30, 'cover', '半台'], [mid, 5, 30, 'lamp', '戏散'], [0, 0, 30, 'lamp', '卸尽'], [0, 3, 30, 'cover', '素脸'], [0, 5, 30, 'lamp', '更夫']]
    .forEach(([g, c, l, ch, n]) => ok(end(g, c, l, ch) === n, `金 ${g} 裂 ${c} 燈 ${l} ${ch} 應是 ${n}，得到 ${end(g, c, l, ch)}`));
  { const Z = E.newGame('甲', 1); Z.day = 10; Z.phase = 'reveal'; Z.gold = 999; Z.lamp = 40; Z.scars = 1; Z.choice = 'lamp'; ok(E.endingOf(Z) === '压台', '推過一張被染的牌（裂 1）就不是美滿'); }
  // 考核：第 3 天墊底就摘牌
  const X3 = E.newGame('测', 52);
  X3.day = 3; E.beginDay(X3); X3.phase = 'board'; X3.gold = 0;
  ok(E.examOf(X3).rank === 6 && !E.examOf(X3).pass, '第 3 天墊底：考核沒過');
  E.nextAct(X3);
  ok(X3.fired === 3 && X3.phase === 'lastwipe', '沒過考核：摘牌，最後一次卸妝');
  ok(E.endingOf(X3) === '卸尽', `摘牌、一道裂也沒有：卸盡（${E.endingOf(X3)}）`);
  X3.outs = 1; ok(E.endingOf(X3) === '素脸', '摘牌、裂過一道：素臉');
  const X7 = E.newGame('测', 53); X7.day = 7; E.beginDay(X7); X7.phase = 'board'; X7.gold = 999;
  ok(E.examOf(X7).pass, '第 7 天名次夠高：考核過了'); E.nextAct(X7); ok(X7.day === 8 && !X7.fired, '過了就進第三幕');
  ok(E.nextExam(E.newGame('测', 1)).day === 3, '下一次考核：第 3 天');
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
      const extra = seq.reduce((a, id) => a + (E.tOf(S, id).heavy ? 1 : E.tOf(S, id).clean ? -1 : 0), 0);
      const v = g - extra * 4;
      if (v > bestV) { best = seq.slice(); bestV = v; }
      return;
    }
    const tried = new Set();
    for (const id of pool) {
      const tp = E.tOf(S, id), t = E.cardOf(S, id).t;
      if (used.has(id) || tried.has(t) || tp.home) continue;
      const ok1 = seq.length === 0 ? (tp.f === want || tp.wild) : (tp.wild || want === '*' || tp.f === want);
      if (!ok1) continue;
      tried.add(t);
      const k = seq.length, add = tp.g + (k === 0 ? 0 : E.R.chainGold[Math.min(k + 1, 4)] + (E.has(S, 'qinshi') ? 1 : 0));
      used.add(id); seq.push(id);
      walk(seq, used, tp.wild ? '*' : tp.next, g + add);
      seq.pop(); used.delete(id);
    }
  };
  walk([], new Set(), start, 0);
  return best;
}
// 照她的需要配匣：鏈、要推的牌（家常牌優先）、其餘拿來卸妝
function plan(o) {
  // 鏈長：auto 是看她今晚要幾張，要 3 張那晚只打三張鏈
  const L = S => (o.len === 'auto' ? 4 : o.len);
  const need = S => E.needOf(S);
  const homeFor = (S, pool) => {
    if (E.seatEmpty(S)) return [];
    if (o.push !== 'need') return pool.filter(id => E.fOf(S, id) === famOfLook(need(S).look) && !E.tOf(S, id).blank && !E.tOf(S, id).home).slice(0, o.push);
    const out = [];
    need(S).items.forEach(x => {
      const fam = famOfLook(x.look);
      const gift = pool.find(id => E.tOf(S, id).home && E.fOf(S, id) === fam && !out.includes(id));
      if (gift !== undefined && x.n >= 2) { out.push(gift); return; }
      pool.filter(id => E.fOf(S, id) === fam && !E.tOf(S, id).blank && !E.tOf(S, id).home && !out.includes(id)).slice(0, x.n).forEach(id => out.push(id));
    });
    return out;
  };
  return {
    morning(S) {
      if (S.day === 10) E.choose(S, o.yuan || 'lamp');
      // 後台（精打細算）：今天起每天能多拿多少 × 還剩幾天，大過價錢才買
      if (o.shop === 'smart' && S.T.offers.length && S.day <= o.shopUntil) {
        const left = E.R.days - S.day + (o.yuan === 'lamp' ? 0 : 1);
        const RV = { qinshi: 3, lian: 1.5, you: 0 };
        const perDay = k => {
          if (E.RELICS[k]) return RV[k];
          const ids = S.deck.map(c => c.id), L0 = E.R.days;
          const g = pool => { const ch = bestChain(S, pool, 4); return ch.reduce((a, id, i) => a + E.tOf(S, id).g + (i ? E.R.chainGold[Math.min(i + 1, 4)] : 0), 0) - ch.reduce((a, id) => a + (E.tOf(S, id).heavy ? 3 : E.tOf(S, id).clean ? -2 : 0), 0); };
          const base = g(ids), c = { id: S.nid + 999, t: k }; S.deck.push(c); const more = g([...ids, c.id]); S.deck.pop();
          // 起手族每天換：今天用得上的，平均只有大約一半的日子用得上
          return Math.max(0, more - base) * 0.55 + (E.T[k].wild ? 1.5 : 0);
        };
        for (let n = 0; n < (o.buyN || 1); n++) {
          const best = S.T.offers.filter(k => E.canBuy(S, k)).map(k => ({ k, v: perDay(k) * left - (E.RELICS[k] ? E.RELICS[k].price : E.T[k].price) })).sort((a, b) => b.v - a.v)[0];
          if (best && best.v > (o.margin ?? 0)) E.buy(S, best.k);
        }
      }
      // 後台：買一張划得來的
      if (o.shop && o.shop !== 'smart') {
        const RV = { qinshi: 3, lian: 2, you: o.shop === 'stage' ? 0 : 1.5 };
        const val = k => (E.RELICS[k] ? RV[k] * 1.2 : (E.T[k].g + (E.T[k].wild ? 3 : 0) + (E.T[k].clean ? 2.5 : 0) - (E.T[k].heavy ? 4 : 0))) / (E.RELICS[k] ? E.RELICS[k].price : E.T[k].price);
        for (let n = 0; n < (o.buyN || 1); n++) {
          const buyable = S.T.offers.filter(k => E.canBuy(S, k) && val(k) > 0).sort((a, b) => val(b) - val(a));
          if (buyable.length && S.day <= o.shopUntil) E.buy(S, buyable[0]);
        }
      }
      if (S.day < 3) return;
      E.clearBox(S);
      const all = S.deck.map(c => c.id);
      const home0 = homeFor(S, all);
      const chain = bestChain(S, all.filter(id => !home0.includes(id)), L(S));
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
      bestChain(S, S.T.box.filter(id => !keep.includes(id)), L(S)).forEach(id => E.playStage(S, id));
    },
    door(S) {
      const free = () => S.T.box.filter(id => !S.T.used[id]);
      const keep = o.push === 0 ? [] : homeFor(S, free());
      const cnt = keep.reduce((a, id) => a + (E.tOf(S, id).home ? 2 : 1), 0);
      if (o.wipe === 'always' || (o.wipe === 'smart' && keep.length === 1 && cnt >= need(S).k)) E.wipe(S);
      while (S.T.layers.length && !o.noClean) {
        const spare = free().filter(id => !keep.includes(id));
        if (!spare.length) break;
        E.selfClean(S, spare[0]);
      }
    },
    evening(S) {
      if (S.choice === 'lamp') { E.lightLamp(S); return; }
      const free = () => S.T.box.filter(id => E.canHome(S, id) && !E.tOf(S, id).blank);
      // 先推還缺的（家常牌優先），再推對路的，最後推別的
      for (let n = 0; n < 3; n++) {
        const f = free();
        if (!f.length) break;
        const want = f.filter(id => E.lack(S, E.lookOfCard(S, id)) > 0).sort((a, b) => (E.tOf(S, b).home ? 1 : 0) - (E.tOf(S, a).home ? 1 : 0));
        const id = want[0] ?? (o.extra ? f.find(id => E.isMatch(S, id)) ?? f[0] : undefined);
        if (id === undefined) break;
        if (E.willDye(S, id) && S.day !== 2 && !o.noClean) break;
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
  ok(S.scars >= s0, '裂只增不減');
  ok(S.base >= b0, '底色只增不減');
  ok(S.gold >= g0 || S.phase === 'stage' || S.phase === 'evening', '賣座只在早上買東西時減少');
  ok(S.lamp >= 0 && E.purseOf(S) >= 0, '燈和錢袋不能是負的');
  ok(t.box.length <= t.cap, '妝匣裝多了');
  ok(new Set(t.box).size === t.box.length, '一張牌進了妝匣兩次');
  ok(t.plays.length <= t.stageMax, '白天超過上限');
  ok(t.pushed.length <= t.homeCap, '傍晚推多了');
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
  let gold = 0, lamp = 0, scars = 0, base = 0, outs = 0, met = 0, bought = 0, gifts = 0, left = 0, fired = 0, endd = 0;
  for (let s = 1; s <= n; s++) {
    const S = run(1000 + s, make(rnd(s)));
    const e = E.endingOf(S), k = E.rankOf(S, E.endDay(S));
    left += S.left ? 1 : 0; fired += S.fired ? 1 : 0; endd += E.endDay(S);
    ends[e] = (ends[e] || 0) + 1; ranks[k] = (ranks[k] || 0) + 1;
    gold += S.gold; lamp += S.lamp; scars += S.scars + S.outs; base += S.base; outs += S.outs; met += S.log.filter(x => x.met).length; bought += S.bought.length; gifts += S.gifts.length;
  }
  const f = v => (v / n).toFixed(1);
  STATS[name] = { ranks, ends, n, left: left / n, fired: fired / n };
  console.log(`\n${name}\n  她走 ${(left / n * 100).toFixed(0)}%  摘牌 ${(fired / n * 100).toFixed(0)}%  平均结束于第 ${f(endd)} 天\n  卖座 ${f(gold)}  灯 ${f(lamp)}  裂 ${f(scars)}  底色 ${f(base)}  满足 ${f(met)} 晚  没满足 ${f(outs)} 次  买 ${f(bought)} 张  家常牌 ${f(gifts)}\n  名次 ${JSON.stringify(ranks)}\n  结局 ${JSON.stringify(ends)}`);
}

if (!QUIET) for (let s = 1; s <= 1000; s++) run(s, chaos(rnd(s)));
const W = (n, k) => (STATS[n].ranks[k] || 0) / STATS[n].n;
const End = (n, e) => (STATS[n].ends[e] || 0) / STATS[n].n;
stats('A 照需要配匣、四张链、精打细算地买、元宵回家', () => plan({ len: 'auto', push: 'need', extra: true, shop: 'smart', buyN: 2, shopUntil: 8, wipe: 'smart', yuan: 'lamp' }), +process.env.N || 300);
stats('A+ 照需要配匣、见什么买什么、元宵回家', () => plan({ len: 'auto', push: 'need', extra: true, shop: true, buyN: 2, shopUntil: 8, wipe: 'smart', yuan: 'lamp' }), +process.env.N || 300);
stats('A3 照需要配匣、三张链、精打细算地买、元宵回家', () => plan({ len: 3, push: 'need', extra: true, shop: 'smart', buyN: 2, shopUntil: 8, wipe: 'smart', yuan: 'lamp' }), +process.env.N || 300);
stats('G 照需要配匣、四张链、精打细算地买、不卸妆就推', () => plan({ len: 'auto', push: 'need', extra: true, shop: 'smart', buyN: 2, shopUntil: 8, wipe: 'never', noClean: true, yuan: 'lamp' }), +process.env.N || 300);
stats('B 照需要配匣、四张链、不买牌、元宵回家', () => plan({ len: 'auto', push: 'need', extra: true, wipe: 'smart', yuan: 'lamp' }), +process.env.N || 300);
stats('C 四张贪心、买牌、不管她、元宵上台', () => plan({ len: 4, push: 0, shop: 'smart', buyN: 2, shopUntil: 9, wipe: 'never', yuan: 'stage' }), +process.env.N || 300);
stats('D 四张链、买牌、只推一张、每天让她擦', () => plan({ len: 4, push: 1, shop: true, buyN: 2, shopUntil: 8, wipe: 'always', yuan: 'lamp' }), +process.env.N || 300);
stats('E 乱打够四张、推三张', r => plan({ len: 4, random: r, push: 3, extra: true, yuan: 'lamp' }), +process.env.N || 300);
stats('F 只顾家：不演，推够需要', () => plan({ len: 0, push: 'need', extra: true, yuan: 'lamp' }), +process.env.N || 300);
stats('乱走', r => chaos(r), +process.env.N || 300);

// 第十節的難度目標
ok(W('E 乱打够四张、推三张', 1) === 0, '乱打够数量不能拿第一');
ok(W('B 照需要配匣、四张链、不买牌、元宵回家', 1) < 0.15, '不买牌很难拿第一');
ok(W('A 照需要配匣、四张链、精打细算地买、元宵回家', 1) > W('B 照需要配匣、四张链、不买牌、元宵回家', 1) + 0.05, '精打细算地买，比不买好');
ok(W('A+ 照需要配匣、见什么买什么、元宵回家', 1) < 0.05, '见什么买什么：卖座花光，拿不到第一');
ok(W('A 照需要配匣、四张链、精打细算地买、元宵回家', 1) > 0.1 && W('A 照需要配匣、四张链、精打细算地买、元宵回家', 1) < 0.35, '会配匣、会买牌：拿第一要靠运气和本事');
ok(End('A 照需要配匣、四张链、精打细算地买、元宵回家', '满堂彩') > 0.05 && End('A 照需要配匣、四张链、精打细算地买、元宵回家', '满堂彩') < 0.25, '满堂彩难，但打得到');
ok(STATS['G 照需要配匣、四张链、精打细算地买、不卸妆就推'].left > 0.5, '不卸妆就推：她多半会走');
ok(STATS['C 四张贪心、买牌、不管她、元宵上台'].left > 0.6 && W('C 四张贪心、买牌、不管她、元宵上台', 1) > 0.6, '只顾台上：她提前走了，走的时候你是头牌');
ok(STATS['A 照需要配匣、四张链、精打细算地买、元宵回家'].left < 0.1 && STATS['A 照需要配匣、四张链、精打细算地买、元宵回家'].fired < 0.02, '会配匣的打法：她不会走，也几乎不会被摘牌');
ok(STATS['B 照需要配匣、四张链、不买牌、元宵回家'].fired < 0.05, '不买牌也过得了考核');
ok(STATS['F 只顾家：不演，推够需要'].fired > 0.9, '只顾家、不演：第一次考核就被摘牌');
ok(End('E 乱打够四张、推三张', '满堂彩') === 0 && W('乱走', 1) === 0, '乱打走不到满堂彩，也拿不到第一');
ok(End('D 四张链、买牌、只推一张、每天让她擦', '满堂彩') < 0.2, '天天让她擦、只推一张：到不了满堂彩');
console.log(fails ? `\n${fails} 项不对` : '\n全部通过');
process.exit(fails ? 1 : 0);
