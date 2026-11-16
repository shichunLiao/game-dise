import glob, os, io, subprocess, json
from PIL import Image
import numpy as np
W = os.environ.get('PROTO', '原型') + '/v1.8-workbuddy/art_kimi'
OUT = os.environ.get('OUT', 'docs/review/out')
os.makedirs(OUT, exist_ok=True)
def load_svg(p):
    png = subprocess.run(['rsvg-convert', '-w', '1024', '-h', '1024', p], capture_output=True, check=True).stdout
    return np.array(Image.open(io.BytesIO(png)).convert('RGBA'))
res = {}
for lp in sorted(glob.glob(W + '/*_line.svg')):
    L = load_svg(lp); A = load_svg(lp.replace('_line', '_accent'))
    lo = L[:, :, 3] == 255; ao = A[:, :, 3] == 255
    lc = sorted('#%02X%02X%02X' % tuple(c) for c in {tuple(c) for c in L[lo][:, :3]})
    ac = sorted('#%02X%02X%02X' % tuple(c) for c in {tuple(c) for c in A[ao][:, :3]})
    semi = ((L[:, :, 3] > 0) & (L[:, :, 3] < 255)).sum() / max(1, (L[:, :, 3] > 0).sum())
    res[os.path.basename(lp)[:-9]] = dict(line_opaque_colors=lc, accent_opaque_colors=ac,
        opaque_overlap_px=int((lo & ao).sum()), accent_opaque_px=int(ao.sum()),
        line_edge_semi_pct=round(semi * 100, 1))
print(json.dumps(res, ensure_ascii=False, indent=1))
json.dump(res, open(OUT + '/svg_detail.json', 'w'), ensure_ascii=False, indent=1)
