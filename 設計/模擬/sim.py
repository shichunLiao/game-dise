"""疊面具 × 雙賬本 數值自檢：DP 窮舉一週最優解 + 幾種典型玩家策略。"""
import sys
from functools import lru_cache

P = dict(
    days=5, base_time=6, time_teeth=True, thr=5, start=5, maxv=10,
    work_min=3, work_max=5,
    deliver=2, home_pen=1, care=2, care_more=1, absent=1,
    free_unmask=True,       # 在安心的人身邊卸下免費
    # (底層面具, 場景) -> (外賬, 對象安心, 本場景陪伴折損)
    leak={('W', 'F'): (1, -2, 1), ('W', 'P'): (1, -2, 1),
          ('F', 'W'): (-1, 0, 0), ('F', 'P'): (0, -1, 0),
          ('P', 'W'): (-2, 0, 0), ('P', 'F'): (0, -1, 0)},
)
SC = ['W', 'F', 'P']


def clamp(v):
    return max(0, min(P['maxv'], v))


def day_time(F, Pv):
    return P['base_time'] + (P['time_teeth'] and (F >= P['thr']) + (Pv >= P['thr']))


def unmask_cost(scene, F, Pv):
    if P['free_unmask'] and (scene == 'F' and F >= P['thr'] or scene == 'P' and Pv >= P['thr']):
        return 0
    return 1


def play_scene(scene, stack, t, F, Pv, k, m, n):
    """回傳 (新棧, 剩餘時間, 外賬, F, P, 是否漏出)，不合法回傳 None"""
    c = unmask_cost(scene, F, Pv)
    if k > len(stack) or k * c > t:
        return None
    s1 = stack[:len(stack) - k]
    if m and m in s1:
        return None
    s2 = s1 + ((m,) if m else ())
    t1 = t - k * c
    if n > t1 or scene == 'W' and not P['work_min'] <= n <= P['work_max']:
        return None
    if m and n == 0:  # 戴上的面具本場景至少要用一次
        return None
    top = s2[-1] if s2 else None
    leaked = len(s2) >= 2 and s2[0] != scene
    ext, lc, lcare = P['leak'][(s2[0], scene)] if leaked else (0, 0, 0)
    cared = False
    if top == 'W':
        ext += P['deliver'] * n
        if scene != 'W':
            lc -= P['home_pen'] * n
    elif top == scene and n:
        cared = True
        lc += max(0, P['care'] + P['care_more'] * (n - 1) - lcare)
    if scene != 'W' and not cared:
        lc -= P['absent']
    if scene == 'F': F = clamp(F + lc)
    if scene == 'P': Pv = clamp(Pv + lc)
    return s2, t1 - n, ext, F, Pv, leaked


def end_of_day(stack, t, Pv, clear):
    """睡前可以把面具全部卸乾淨；不卸的話，睡眠只卸到剩最底層"""
    if clear:
        if len(stack) * unmask_cost('P', 0, Pv) > t:
            return None
        return ()
    return stack[:1]


def solve(minF=0, minP=0):
    @lru_cache(maxsize=None)
    def f(day, si, stack, t, F, Pv):
        if day == P['days']:
            return (0 if F >= minF and Pv >= minP else -10**6), ()
        scene = SC[si]

        def nxt(s2, t2, F2, P2):
            if si < 2:
                return [(f(day, si + 1, s2, t2, F2, P2), False)]
            out = []
            for clear in (False, True):
                s3 = end_of_day(s2, t2, P2, clear)
                if s3 is not None:
                    out.append((f(day + 1, 0, s3, day_time(F2, P2), F2, P2), clear))
            return out

        if scene != 'W' and (F if scene == 'F' else Pv) <= 0:
            (v, path), _ = max(nxt(stack, t, F, Pv), key=lambda x: x[0][0])
            return v, ((day, scene, 'gone'),) + path

        best = (-10**9, ())
        for k in range(len(stack) + 1):
            for m in (None, 'W', 'F', 'P'):
                for n in range(t + 1):
                    r = play_scene(scene, stack, t, F, Pv, k, m, n)
                    if not r:
                        continue
                    s2, t2, ext, F2, P2, lk = r
                    for (v, path), clear in nxt(s2, t2, F2, P2):
                        if v + ext > best[0]:
                            step = (day, scene, ''.join(stack), k, m, n, ''.join(s2), lk, F2, P2, clear)
                            best = (v + ext, (step,) + path)
        return best

    return f(0, 0, (), day_time(P['start'], P['start']), P['start'], P['start'])


def run(plan):
    """手寫策略：plan(day, scene, stack, F, P) -> (k, m, n, 睡前卸乾淨?)"""
    F = Pv = P['start']
    ext = leaks = 0
    stack = ()
    for day in range(P['days']):
        t = day_time(F, Pv)
        clear = False
        for scene in SC:
            if scene != 'W' and (F if scene == 'F' else Pv) <= 0:
                continue
            k, m, n, clear = plan(day, scene, stack, F, Pv)
            k = min(k, len(stack))
            c = unmask_cost(scene, F, Pv)
            if k * c > t:
                k = 0
            n = max(0, min(n, t - k * c))
            if scene == 'W':
                n = max(P['work_min'], min(n, P['work_max']))
            stack, t, e, F, Pv, lk = play_scene(scene, stack, t, F, Pv, k, m, n)
            ext += e
            leaks += lk
        s3 = end_of_day(stack, t, Pv, clear)
        stack = s3 if s3 is not None else stack[:1]
    return ext, F, Pv, leaks


def greedy(day, scene, stack, F, Pv):
    # 只戴職員、時間全拿去交付，回家也在回郵件
    if scene == 'W':
        return 0, None if 'W' in stack else 'W', 5, False
    return 0, None, 1 if scene == 'F' else 9, False


def lazy_carer(day, scene, stack, F, Pv):
    # 每天各陪一下，但從不卸面具（職員一直壓在最底層）
    if scene == 'W':
        return 0, None if 'W' in stack else 'W', day_time(F, Pv) - 2, False
    return 0, scene, 1, False


def clean_carer(day, scene, stack, F, Pv):
    # 每天各陪一下，每次換場景都先卸乾淨，睡前也卸乾淨
    if scene == 'W':
        return len(stack), 'W', day_time(F, Pv) - 2 - 2 * (1 - P['free_unmask']), True
    return len(stack), scene, 1, True


STRATS = [('只算外賬', greedy), ('陪但不卸', lazy_carer), ('陪且卸妝', clean_carer)]

if __name__ == '__main__':
    verbose = '-v' in sys.argv
    print('典型策略：')
    for name, fn in STRATS:
        ext, F, Pv, lk = run(fn)
        print(f'  {name:<6} 外賬 {ext:>3}  家人 {F:>2}  伴侶 {Pv:>2}  漏出 {lk}')
    print('完美資訊下的最優解（限制結局關係下限）：')
    for mn in [0, 3, 5, 7, 9]:
        v, path = solve(mn, mn)
        steps = [s for s in path if s[2] != 'gone']
        lk = sum(1 for s in steps if s[7])
        unm = sum(s[3] for s in steps)
        print(f'  兩段都≥{mn}: 外賬 {v:>3}  家人 {steps[-1][8]:>2}  伴侶 {steps[-1][9]:>2}  漏出 {lk}  卸下 {unm}')
        if verbose:
            for s in path:
                if s[2] == 'gone':
                    print(f'      D{s[0]+1} {s[1]} 崩盤')
                    continue
                d, sc, s0, k, m, n, s2, l, F2, P2, cl = s
                print(f'      D{d+1} {sc}: [{s0}] 卸{k} 戴{m or "-"} → [{s2}] 行動{n}'
                      f'{" 漏出" + s2[0] if l else ""}  家{F2} 伴{P2}{" 睡前卸淨" if cl else ""}')
