// 核對原型的規則引擎和 設計/模擬/sim.py 的結果是否一致。
// 用法：node 原型/check_engine.js
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const code = html.split('/* ENGINE START */')[1].split('/* ENGINE END */')[0];
const api = new Function(`${code}; return { newGame, unmask, push, act, leave, sleep, dawn, canAct, setEvents: e => { EVENTS = e; }, endingOf };`)();

function play(strat, events) {
  api.setEvents(events);
  const S = api.newGame('测试', '旦');
  while (S.phase !== 'reveal') {
    if (S.phase === 'scene') { strat(S); api.leave(S); }
    else if (S.phase === 'sleep') api.sleep(S, !!strat.clear);
    else api.dawn(S);
  }
  return { gold: S.gold, F: S.F, P: S.P, ending: api.endingOf(S) };
}
const times = (n, f) => { for (let i = 0; i < n; i++) f(); };
const unmaskAll = S => { while (S.stack.length) { const before = S.stack.length; api.unmask(S); if (S.stack.length === before) break; } };

// 只算外賬：只戴職員，回家也練戲
const greedy = S => {
  const sc = S.sc.scene;
  if (sc === 'W') { if (!S.stack.includes('W')) api.push(S, 'W'); times(5, () => api.act(S)); }
  else if (sc === 'F') api.act(S);
  else while (api.canAct(S)) api.act(S);
};
// 陪但不卸
const lazy = S => {
  const sc = S.sc.scene;
  if (sc === 'W') { if (!S.stack.includes('W')) api.push(S, 'W'); times(Math.min(S.dayLen - 2, 5), () => api.act(S)); }
  else { api.push(S, sc); api.act(S); }
};
// 陪且卸妝
const clean = S => {
  const sc = S.sc.scene;
  unmaskAll(S);
  api.push(S, sc);
  if (sc === 'W') times(Math.min(S.dayLen - 2, 5), () => api.act(S));
  else api.act(S);
};
clean.clear = true;
// 設計文件裡小林的一週
const STORY = [
  { W: [0, 'W', 5], F: [1, 'F', 1], P: [1, 'P', 1], clear: true },
  { W: [0, 'W', 5], F: [0, null, 2], P: [0, 'P', 1] },
  { W: [0, null, 5], F: [0, 'F', 1], P: [0, 'P', 1] },
  { W: [0, null, 5], F: [0, 'F', 1], P: [0, 'P', 1] },
  { W: [0, null, 5], F: [0, 'F', 1], P: [0, null, 0] },
];
const story = S => {
  const [k, m, n] = STORY[S.day][S.sc.scene];
  times(k, () => api.unmask(S));
  if (m) api.push(S, m);
  times(n, () => api.act(S));
  story.clear = !!STORY[S.day].clear;
};

const expected = { 只算外賬: [60, 0, 0], 陪但不卸: [52, 0, 0], 陪且卸妝: [50, 10, 10], 小林: [61, 1, 1] };
const strats = { 只算外賬: greedy, 陪但不卸: lazy, 陪且卸妝: clean, 小林: story };
let ok = true;
console.log('不含事件（應與 sim.py 相同）：');
for (const [name, f] of Object.entries(strats)) {
  const r = play(f, {});
  const [g, F, P] = expected[name];
  const pass = r.gold === g && r.F === F && r.P === P;
  ok = ok && pass;
  console.log(`  ${pass ? '✓' : '✗'} ${name}  金箔 ${r.gold}  素娘 ${r.F}  阿檀 ${r.P}  結局 ${r.ending}${pass ? '' : `（應為 ${g}/${F}/${P}）`}`);
}
console.log('含週四素娘生日：');
for (const [name, f] of Object.entries(strats)) {
  const r = play(f, { 3: { F: { careFirst: 3, absent: 3 } } });
  console.log(`  ${name}  金箔 ${r.gold}  素娘 ${r.F}  阿檀 ${r.P}  結局 ${r.ending}`);
}
process.exit(ok ? 0 : 1);
