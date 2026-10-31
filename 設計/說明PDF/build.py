"""產生《底色》說明 PDF：把插圖（SVG）填進 template.html，再用 Chrome 無頭模式列印成 PDF。

用法：python3 設計/說明PDF/build.py
"""
import math
import random
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT_HTML = HERE / '底色說明.html'
OUT_PDF = HERE.parent / '底色_遊戲概念說明.pdf'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
FONT_WB = ('file:///System/Library/AssetsV2/com_apple_MobileAsset_Font8/'
           'c4f5f063cf47a2009786f645b423c09ea75666b8.asset/AssetData/WeibeiTC-Bold.otf')

C = dict(paper='#f7f2f1', card='#fbf8f7', ink='#211c1f', ink2='#564d52', ink3='#8b7f84',
         rouge='#a8243a', rouge2='#ecd0d3', gold='#a8843a', gold2='#efe2c2',
         indigo='#2e4256', indigo2='#d9e0e7', line='#ddd1d1')
FONT = "font-family:'Source Han Serif TC',serif"
DISPLAY = "font-family:'WB','Weibei TC',serif"


# ── 撕紙形狀 ──────────────────────────────────────────────

def pts(points):
    return ' '.join(f'{x:.1f},{y:.1f}' for x, y in points)


def torn_ellipse(cx, cy, rx, ry, rot, seed, n=140, j=0.016):
    rnd = random.Random(seed)
    a = math.radians(rot)
    out = []
    for i in range(n):
        t = 2 * math.pi * i / n
        r = 1 + rnd.gauss(0, j)
        x, y = rx * math.cos(t) * r, ry * math.sin(t) * r
        out.append((cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
    return pts(out)


def torn_rect(x, y, w, h, seed, step=7, j=1.4):
    rnd = random.Random(seed)
    out = []
    for i in range(int(w / step) + 1):
        out.append((x + min(i * step, w), y + rnd.gauss(0, j)))
    for i in range(1, int(h / step) + 1):
        out.append((x + w + rnd.gauss(0, j), y + min(i * step, h)))
    for i in range(int(w / step), -1, -1):
        out.append((x + min(i * step, w), y + h + rnd.gauss(0, j)))
    for i in range(int(h / step), 0, -1):
        out.append((x + rnd.gauss(0, j), y + min(i * step, h)))
    return pts(out)


def blob(cx, cy, r, seed, n=16, j=0.28):
    rnd = random.Random(seed)
    return pts((cx + r * (1 + rnd.uniform(-j, j)) * math.cos(2 * math.pi * i / n),
                cy + r * (1 + rnd.uniform(-j, j)) * math.sin(2 * math.pi * i / n)) for i in range(n))


def fleck(cx, cy, s, seed):
    rnd = random.Random(seed)
    a = rnd.uniform(0, math.pi)
    corners = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
    return pts((cx + s * (u + rnd.uniform(-.35, .35)) * math.cos(a) - s * (v + rnd.uniform(-.35, .35)) * math.sin(a),
                cy + s * (u + rnd.uniform(-.35, .35)) * math.sin(a) + s * (v + rnd.uniform(-.35, .35)) * math.cos(a))
               for u, v in corners)


# ── 封面：三層油彩拼貼的臉 ─────────────────────────────────

def cover():
    top = torn_ellipse(232, 300, 138, 188, 6, seed=3)
    rnd = random.Random(11)
    flecks = []
    for i in range(14):
        x, y = rnd.uniform(70, 400), rnd.uniform(18, 120)
        color = C['gold'] if i % 3 else C['gold2']
        flecks.append(f'<polygon points="{fleck(x, y, rnd.uniform(4, 9), 100 + i)}" fill="{color}"/>')
    return f'''<svg viewBox="0 0 420 540" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="三層油彩疊成的臉，最底下的戲台紅從邊緣透出">
  <defs><clipPath id="topface"><polygon points="{top}"/></clipPath></defs>
  {''.join(flecks)}
  <polygon points="{torn_ellipse(200, 268, 146, 196, -9, seed=1)}" fill="{C['rouge']}"/>
  <polygon points="{torn_ellipse(216, 284, 142, 192, -1, seed=2)}" fill="{C['rouge2']}"/>
  <polygon points="{top}" fill="{C['card']}" stroke="{C['line']}" stroke-width="1"/>
  <g clip-path="url(#topface)">
    <polygon points="{blob(130, 160, 52, seed=7)}" fill="{C['rouge']}" opacity=".55"/>
    <polygon points="{blob(118, 196, 22, seed=8)}" fill="{C['rouge']}" opacity=".35"/>
    <polygon points="{blob(150, 132, 16, seed=9)}" fill="{C['gold']}" opacity=".5"/>
  </g>
  <g transform="rotate(6 232 300)" fill="none" stroke-linecap="round">
    <path d="M168 252 Q192 236 218 246" stroke="{C['indigo']}" stroke-width="7"/>
    <path d="M250 246 Q276 236 300 252" stroke="{C['indigo']}" stroke-width="7"/>
    <path d="M176 282 Q193 272 210 283" stroke="{C['ink']}" stroke-width="3"/>
    <path d="M256 283 Q273 272 290 282" stroke="{C['ink']}" stroke-width="3"/>
    <path d="M233 300 L228 350 Q233 356 240 352" stroke="{C['ink3']}" stroke-width="2"/>
    <ellipse cx="234" cy="398" rx="17" ry="7" fill="{C['rouge']}" stroke="none"/>
  </g>
</svg>'''


# ── 第六頁：棧的側面圖 ─────────────────────────────────────

def stack():
    t = f'style="{FONT}"'
    return f'''<svg viewBox="0 0 680 236" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="三層妝疊在一起：最上層決定得到什麼，最底層決定傷害誰">
  <text x="20" y="20" font-size="12" fill="{C['ink2']}" {t}>眼前這一場：阿檀的燈坊</text>
  <polygon points="{torn_rect(20, 150, 470, 58, seed=21)}" fill="{C['rouge']}"/>
  <polygon points="{torn_rect(62, 96, 448, 58, seed=22)}" fill="{C['rouge2']}"/>
  <polygon points="{torn_rect(104, 42, 426, 58, seed=23)}" fill="{C['card']}" stroke="{C['ink3']}" stroke-width=".8"/>
  <text x="124" y="77" font-size="15" font-weight="700" fill="{C['ink']}" {t}>最上層　阿檀的臉</text>
  <text x="82" y="131" font-size="15" fill="{C['ink']}" {t}>中間　乖臉</text>
  <text x="40" y="185" font-size="15" font-weight="700" fill="{C['card']}" {t}>最底層　戲台臉</text>
  <line x1="534" y1="71" x2="552" y2="71" stroke="{C['ink']}" stroke-width="1"/>
  <text x="558" y="66" font-size="12.5" font-weight="700" fill="{C['ink']}" {t}>決定你在這一場</text>
  <text x="558" y="84" font-size="12.5" fill="{C['ink']}" {t}>能做什麼、得到什麼</text>
  <line x1="494" y1="179" x2="552" y2="179" stroke="{C['rouge']}" stroke-width="1"/>
  <text x="558" y="166" font-size="12.5" font-weight="700" fill="{C['rouge']}" {t}>不屬於燈坊，透出來</text>
  <text x="558" y="184" font-size="12.5" fill="{C['ink']}" {t}>金箔 +1，阿檀 −2</text>
  <text x="558" y="202" font-size="12.5" fill="{C['ink']}" {t}>決定你傷害誰</text>
  <polygon points="{blob(34, 216, 9, seed=31)}" fill="{C['rouge']}"/>
  <polygon points="{blob(54, 224, 5, seed=32)}" fill="{C['rouge']}" opacity=".7"/>
</svg>'''


# ── 第十二頁：卸妝布（示意） ───────────────────────────────

def cloth(rows, seed):
    t = f'style="{FONT}"'
    size, gap, x0, y0 = 42, 8, 56, 24
    parts = []
    for c, d in enumerate('一二三四五'):
        parts.append(f'<text x="{x0 + c * (size + gap) + size / 2}" y="14" font-size="11" text-anchor="middle" fill="{C["ink3"]}" {t}>週{d}</text>')
    rnd = random.Random(seed)
    for r, row in enumerate(rows):
        y = y0 + r * (size + gap)
        parts.append(f'<text x="0" y="{y + size / 2 + 4}" font-size="11.5" fill="{C["ink2"]}" {t}>第{"一二三四"[r]}齣</text>')
        for c, kind in enumerate(row):
            x = x0 + c * (size + gap)
            s = seed * 100 + r * 10 + c
            if kind == 'E':
                parts.append(f'<rect x="{x + 1}" y="{y + 1}" width="{size - 2}" height="{size - 2}" fill="none" stroke="{C["ink3"]}" stroke-width="1" stroke-dasharray="3 3"/>')
                continue
            parts.append(f'<polygon points="{torn_rect(x, y, size, size, s, step=5, j=.9)}" fill="{C["card"]}" stroke="{C["line"]}" stroke-width="1"/>')
            if kind == 'S':
                bx, by = x + rnd.uniform(14, 28), y + rnd.uniform(14, 28)
                parts.append(f'<polygon points="{blob(bx, by, rnd.uniform(10, 14), s + 7)}" fill="{C["rouge"]}" opacity=".82"/>')
                parts.append(f'<polygon points="{fleck(bx + rnd.uniform(-8, 8), by + rnd.uniform(-8, 8), 3.6, s + 9)}" fill="{C["gold"]}"/>')
    return f'<svg viewBox="0 0 300 222" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="四週二十天的卸妝布示意">{"".join(parts)}</svg>'


MOTHER = ['CCCCC', 'CSCSE', 'SSESS', 'SESSE']
TAN = ['CCSCC', 'SSSES', 'SEESE', 'EESEE']


# ── 第十三頁：模擬結果長條圖 ───────────────────────────────

ROWS = [
    ('只算金箔', '只戴戲台臉，時間全拿去唱戲', 60, 0, 0),
    ('陪但不卸', '每晚都回家，從不卸妝', 52, 0, 0),
    ('陪且卸妝', '每晚都回家，每次都卸乾淨', 50, 10, 10),
    ('最會算・不顧關係', '完美資訊下的最高分', 68, 0, 0),
    ('最會算・兩段都 ≥7', '季末兩段關係至少 7', 63, 7, 7),
    ('最會算・兩段都 ≥9', '季末兩段關係至少 9', 60, 9, 9),
]


def rel_mark(x, y, who, v):
    t = f'style="{FONT}"'
    if v == 0:
        circ = f'<circle cx="{x}" cy="{y}" r="6" fill="none" stroke="{C["rouge"]}" stroke-width="1.2" stroke-dasharray="2.2 2"/>'
        col = C['rouge']
    elif v >= 7:
        circ = f'<circle cx="{x}" cy="{y}" r="6" fill="{C["indigo"]}"/>'
        col = C['indigo']
    else:
        circ = f'<circle cx="{x}" cy="{y}" r="6" fill="{C["indigo2"]}" stroke="{C["indigo"]}" stroke-width="1"/>'
        col = C['indigo']
    return circ + f'<text x="{x + 10}" y="{y + 4.5}" font-size="12" fill="{col}" {t}>{who} {v}</text>'


def chart():
    t = f'style="{FONT}"'
    x0, scale, top, rh = 222, 4.6, 34, 44
    parts = []
    for v in range(0, 71, 10):
        x = x0 + v * scale
        parts.append(f'<line x1="{x}" y1="{top - 8}" x2="{x}" y2="{top + rh * len(ROWS) - 6}" stroke="{C["line"]}" stroke-width="1"/>')
        parts.append(f'<text x="{x}" y="{top - 14}" font-size="10.5" text-anchor="middle" fill="{C["ink3"]}" {t}>{v}</text>')
    parts.append(f'<text x="{x0 + 70 * scale}" y="{top - 26}" font-size="10.5" text-anchor="end" fill="{C["ink2"]}" {t}>一週的金箔</text>')
    parts.append(f'<text x="566" y="{top - 14}" font-size="10.5" fill="{C["ink2"]}" {t}>季末的關係</text>')
    for i, (name, desc, gold, m, tan) in enumerate(ROWS):
        y = top + i * rh
        if i == 3:
            parts.append(f'<line x1="0" y1="{y - 7}" x2="680" y2="{y - 7}" stroke="{C["ink3"]}" stroke-width="1" stroke-dasharray="4 4"/>')
        name_col = C['rouge'] if name == '陪但不卸' else C['ink']
        parts.append(f'<text x="0" y="{y + 12}" font-size="13" font-weight="700" fill="{name_col}" {t}>{name}</text>')
        parts.append(f'<text x="0" y="{y + 28}" font-size="10.5" fill="{C["ink2"]}" {t}>{desc}</text>')
        w = gold * scale
        parts.append(f'<rect x="{x0}" y="{y + 4}" width="{w}" height="22" fill="{C["gold"]}"/>')
        parts.append(f'<text x="{x0 + w + 6}" y="{y + 20}" font-size="13" font-weight="700" fill="{C["ink"]}" {t}>{gold}</text>')
        parts.append(rel_mark(574, y + 15, '母', m))
        parts.append(rel_mark(630, y + 15, '檀', tan))
    h = top + rh * len(ROWS)
    return f'<svg viewBox="0 0 690 {h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="六種打法的金箔與季末關係">{"".join(parts)}</svg>'


# ── 第十五頁：色票 ─────────────────────────────────────────

CHIPS = [
    ('胭脂', C['rouge'], '戲台紅，', '也是漏出的顏色'),
    ('金箔', C['gold'], '名次與叫好，', '全遊戲最亮的東西'),
    ('油彩白', C['paper'], '底妝，', '也是乾淨的卸妝布'),
    ('墨', C['ink'], '水牌、門、', '還有夜'),
    ('黛青', C['indigo'], '夜晚與家，', '眉間那一筆'),
]


def chips():
    t = f'style="{FONT}"'
    parts = []
    for i, (name, hexv, l1, l2) in enumerate(CHIPS):
        x = i * 139
        stroke = f' stroke="{C["ink3"]}" stroke-width=".8"' if name == '油彩白' else ''
        parts.append(f'<polygon points="{torn_rect(x + 2, 4, 114, 70, 50 + i, step=6, j=1.3)}" fill="{hexv}"{stroke}/>')
        parts.append(f'<text x="{x + 2}" y="98" font-size="15" font-weight="700" fill="{C["ink"]}" {t}>{name}</text>')
        parts.append(f'<text x="{x + 2}" y="114" font-size="10" fill="{C["ink3"]}" {t}>{hexv}</text>')
        parts.append(f'<text x="{x + 2}" y="132" font-size="11" fill="{C["ink2"]}" {t}>{l1}</text>')
        parts.append(f'<text x="{x + 2}" y="148" font-size="11" fill="{C["ink2"]}" {t}>{l2}</text>')
    return f'<svg viewBox="0 0 680 154" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="五種顏色">{"".join(parts)}</svg>'


def main():
    html = (HERE / 'template.html').read_text(encoding='utf-8')
    for key, val in {
        'FONT_WB': FONT_WB, 'COVER': cover(), 'STACK': stack(),
        'CLOTH_MOTHER': cloth(MOTHER, 1), 'CLOTH_TAN': cloth(TAN, 2),
        'CHART': chart(), 'CHIPS': chips(),
    }.items():
        html = html.replace('{{' + key + '}}', val)
    assert '{{' not in html, '還有沒填的插圖'
    OUT_HTML.write_text(html, encoding='utf-8')
    subprocess.run([CHROME, '--headless', '--disable-gpu', '--allow-file-access-from-files',
                    '--no-pdf-header-footer', '--virtual-time-budget=8000',
                    f'--print-to-pdf={OUT_PDF}', OUT_HTML.as_uri()],
                   check=True, stderr=subprocess.DEVNULL)
    print(OUT_PDF, OUT_PDF.stat().st_size, 'bytes')


if __name__ == '__main__':
    main()
