import glob, os, json, subprocess, re, io, random
from PIL import Image, ImageDraw, ImageFont
import numpy as np
R = os.environ.get('PROTO', '原型')
OUT = os.environ.get('OUT', 'docs/review/out')
os.makedirs(OUT, exist_ok=True)
BLACK = (0, 0, 0); RED = (0xA8, 0x20, 0x2B); PAPER = (0xEC, 0xE3, 0xD4)

def load_png(p):
    return np.array(Image.open(p).convert('RGBA'))

def load_svg(p):
    png = subprocess.run(['rsvg-convert', '-w', '1024', '-h', '1024', p], capture_output=True, check=True).stdout
    return np.array(Image.open(io.BytesIO(png)).convert('RGBA'))

def layer_stats(a, want):
    vis = a[:, :, 3] > 0
    cols = {tuple(c) for c in a[vis][:, :3]}
    alphas = np.unique(a[:, :, 3])
    return dict(ink_pct=round(100 * vis.sum() / vis.size, 2),
                colors_ok=cols <= {want}, n_colors=len(cols),
                alpha_binary=bool(set(alphas.tolist()) <= {0, 255}),
                n_alpha=int(len(alphas)), vis=vis)

def pair(name, line, acc, src):
    l = layer_stats(line, BLACK); a = layer_stats(acc, RED)
    ov = int((l['vis'] & a['vis']).sum())
    for d in (l, a): d.pop('vis')
    return dict(name=name, src=src, line=l, accent=a, overlap_px=ov,
                corner_transparent=bool(line[0, 0, 3] == 0 and line[-1, -1, 3] == 0))

rows = {'baseline': [], 'codex': [], 'workbuddy': []}
imgs = {'baseline': [], 'codex': [], 'workbuddy': []}
for lp in sorted(glob.glob(R + '/assets/*/*_line.png')):
    ap = lp.replace('_line.png', '_accent.png')
    if not os.path.exists(ap): continue
    L, A = load_png(lp), load_png(ap)
    rows['baseline'].append(pair(os.path.relpath(lp, R).replace('_line.png', ''), L, A, 'png'))
    imgs['baseline'].append((os.path.basename(lp)[:-9], L, A))
C = R + '/assets_codex_faces_20261115'
for g, poses in [('atan', ['seated', 'reach', 'lowered']), ('actor', ['standing', 'pose'])]:
    for p in poses:
        L, A = load_png(f'{C}/{g}/{p}_line.png'), load_png(f'{C}/{g}/{p}_accent.png')
        rows['codex'].append(pair(f'{g}/{p}', L, A, 'png')); imgs['codex'].append((f'{g}/{p}', L, A))
for st in ['painted', 'half', 'clean']:
    imgs['codex'].append((f'mirror/{st}', load_png(f'{C}/mirror/{st}.png'), None))
W = R + '/v1.8-workbuddy/art_kimi'
svgflags = {}
for lp in sorted(glob.glob(W + '/*_line.svg')):
    ap = lp.replace('_line.svg', '_accent.svg'); n = os.path.basename(lp)[:-9]
    L, A = load_svg(lp), load_svg(ap)
    rows['workbuddy'].append(pair(n, L, A, 'svg->rsvg 1024')); imgs['workbuddy'].append((n, L, A))
    txt = open(lp).read() + open(ap).read()
    svgflags[n] = dict(gradient=bool(re.search(r'Gradient', txt)), filter=bool(re.search(r'<filter', txt)),
                       opacity=bool(re.search(r'opacity="(0?\.\d+)"', txt)))

def summ(rs):
    li = [r['line']['ink_pct'] for r in rs]; ai = [r['accent']['ink_pct'] for r in rs]
    return dict(count=len(rs), line_ink_min=min(li), line_ink_max=max(li), accent_ink_min=min(ai), accent_ink_max=max(ai),
                palette_ok=sum(r['line']['colors_ok'] and r['accent']['colors_ok'] for r in rs),
                alpha_binary=sum(r['line']['alpha_binary'] and r['accent']['alpha_binary'] for r in rs),
                overlap_zero=sum(r['overlap_px'] == 0 for r in rs))
report = {k: summ(v) for k, v in rows.items()}
report['rows'] = rows; report['svgflags'] = svgflags
json.dump(report, open(OUT + '/style_audit.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: report[k] for k in ['baseline', 'codex', 'workbuddy']}, ensure_ascii=False, indent=1))

# ---- 並排圖 ----
def comp(L, A, size):
    bg = Image.new('RGBA', (1024, 1024), PAPER + (255,))
    bg.alpha_composite(Image.fromarray(L))
    if A is not None: bg.alpha_composite(Image.fromarray(A))
    return bg.convert('RGB').resize((size, size), Image.LANCZOS)
font = small = None
for f in ['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', '/System/Library/Fonts/PingFang.ttc']:
    if os.path.exists(f): font = ImageFont.truetype(f, 20); small = ImageFont.truetype(f, 14); break
if font is None:
    font = small = ImageFont.load_default()
random.seed(7)
base_pick = random.sample(imgs['baseline'], 10)
sections = [('現有美術（基準，隨機 10 張）', base_pick), ('Codex v1.8 臉部立牌（定稿 8 張）', imgs['codex']), ('WorkBuddy v1.8 新貨（5 組，10 個 SVG）', imgs['workbuddy'])]
S, S2, pad, cols = 180, 90, 12, 10
H = 40 + sum(40 + S + 24 + S2 + 30 for _ in sections)
sheet = Image.new('RGB', (pad + cols * (S + pad), H), (250, 247, 240))
d = ImageDraw.Draw(sheet)
d.text((pad, 10), '底色 v1.8 兩線並排（同一底色、同一尺寸；下排為 90px 縮圖）  資料：a8feb05', fill=(0, 0, 0), font=font)
y = 40
for title, items in sections:
    d.text((pad, y + 8), title, fill=(168, 32, 43), font=font); y += 40
    for i, (n, L, A) in enumerate(items[:cols]):
        x = pad + i * (S + pad)
        sheet.paste(comp(L, A, S), (x, y))
        sheet.paste(comp(L, A, S2), (x + (S - S2) // 2, y + S + 24))
        d.text((x, y + S + 4), n[:22], fill=(60, 60, 60), font=small)
    y += S + 24 + S2 + 30
sheet.save(OUT + '/side_by_side_style.png', optimize=True)
print('sheet', sheet.size)
