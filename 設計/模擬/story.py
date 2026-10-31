import sim
P = sim.P
NAME = {'W': '職員', 'F': '子女', 'P': '伴侶', None: '-'}
SCN = {'W': '工作', 'F': '家人', 'P': '伴侶'}
# 一位第一次玩的玩家：(卸, 戴, 行動) ×3 場景 + 睡前卸淨?
PLAN = [
    [(0, 'W', 5), (1, 'F', 1), (1, 'P', 1), True],
    [(0, 'W', 5), (0, None, 2), (0, 'P', 1), False],
    [(0, None, 5), (0, 'F', 1), (0, 'P', 1), False],
    [(0, None, 5), (0, 'F', 1), (0, 'P', 1), False],
    [(0, None, 5), (0, 'F', 1), (0, None, 0), False],
]
F = Pv = P['start']; ext = 0; stack = ()
for d, (*scs, clear) in enumerate(PLAN):
    t = sim.day_time(F, Pv)
    print(f'— 第{d+1}天 時間 {t}（早上棧：[{"".join(NAME[x] for x in stack) or "空"}]）')
    for scene, (k, m, n) in zip(sim.SC, scs):
        if scene != 'W' and (F if scene == 'F' else Pv) <= 0:
            print(f'   {SCN[scene]}：關係已崩盤'); continue
        c = sim.unmask_cost(scene, F, Pv)
        k = min(k, len(stack))
        n = min(n, t - k * c)
        if scene == 'W': n = max(3, n)
        r = sim.play_scene(scene, stack, t, F, Pv, k, m, n)
        s2, t, e, F, Pv, lk = r
        ext += e
        print(f'   {SCN[scene]}：卸{k}{"(免費)" if k and c == 0 else ""} 戴{NAME[m]} → 棧[{"/".join(NAME[x] for x in s2)}] 行動{n}'
              f'{"  ⚠漏出:" + NAME[s2[0]] if lk else ""}  外賬{ext:+d}  家人{F} 伴侶{Pv}  剩{t}')
        stack = s2
    s3 = sim.end_of_day(stack, t, Pv, clear)
    stack = s3 if s3 is not None else stack[:1]
print('結局', ext, F, Pv)
print('≥10 最優', sim.solve(10, 10)[0])
