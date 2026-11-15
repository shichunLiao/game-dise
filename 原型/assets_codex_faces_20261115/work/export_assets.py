"""Deterministic delivery export: exact palette, masks, canvas and reference proofs.
Appearance is generated with imagegen; this script only separates/resamples delivery layers.
"""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import numpy as np,json,hashlib
ROOT=Path(__file__).resolve().parents[1]
BLACK=(0,0,0); RED=(168,32,43); PAPER=(236,227,212)
def separate(path,allow_paper=False):
 im=Image.open(path).convert('RGBA').resize((1024,1024),Image.Resampling.LANCZOS)
 a=np.array(im); rgb=a[:,:,:3].astype(int); active=a[:,:,3]>=128
 red=active & (rgb[:,:,0]>rgb[:,:,1]*1.4+20) & (rgb[:,:,0]>rgb[:,:,2]*1.25+10)
 paper=active & (rgb.mean(axis=2)>150) & ~red
 black=active & ~red & ~paper
 masks={'line':black,'accent':red}
 if allow_paper:masks['paper']=paper
 return masks

def mask_image(mask,color):
 a=np.zeros((1024,1024,4),dtype=np.uint8); a[mask,:3]=color;a[mask,3]=255;return Image.fromarray(a)
def export_pair(raw,stem):
 masks=separate(raw)
 for k,c in [('line',BLACK),('accent',RED)]:mask_image(masks[k],c).save(ROOT/f'{stem}_{k}.png')
 return masks
if __name__=='__main__':
 for char in ['atan','actor','mirror']:
  for v in 'abc':
   p=ROOT/'work'/f'{char}_{v}_raw.png'
   if p.exists():
    masks=separate(p,True);c=Image.new('RGBA',(1024,1024))
    for k,col in [('paper',PAPER),('line',BLACK),('accent',RED)]:c.alpha_composite(mask_image(masks[k],col))
    c.save(ROOT/'draft'/f'{char}_{v}.png')
 export_pair(ROOT/'work/atan_a_raw.png','atan/seated')
 export_pair(ROOT/'work/actor_b_raw.png','actor/standing')
 for char,pose in [('atan','reach'),('atan','lowered'),('actor','pose')]:
  export_pair(ROOT/'work'/f'{char}_{pose}_raw.png',f'{char}/{pose}')
 # All states share the very same clean base; generation supplies only red paint masks.
 clean=separate(ROOT/'work/mirror_clean_raw.png',True)
 base=Image.new('RGBA',(1024,1024))
 base.alpha_composite(mask_image(clean['paper'],PAPER));base.alpha_composite(mask_image(clean['line'],BLACK))
 skin=clean['paper'];base.save(ROOT/'mirror/base.png')
 full=separate(ROOT/'work/mirror_painted_raw.png')['accent'] & skin
 half=separate(ROOT/'work/mirror_half_raw.png')['accent'] & full
 # Protect base black strokes. Half-mask is a strict subset of the full paint mask.
 for state,m in [('painted',full),('half',half),('clean',np.zeros_like(full))]:
  paint=mask_image(m,RED);paint.save(ROOT/f'mirror/{state}_accent.png')
  c=base.copy();c.alpha_composite(paint);c.save(ROOT/f'mirror/{state}.png')
 mask_image(clean['line'],BLACK).save(ROOT/'mirror/face_line.png')
 mask_image(clean['paper'],PAPER).save(ROOT/'mirror/face_paper.png')
