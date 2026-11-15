"""Authored base-color atlases and matching frontal face UV textures."""
from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import math,random
OUT=Path(__file__).resolve().parents[2]/'artifacts/blender/dan_v2';OUT.mkdir(parents=True,exist_ok=True)
# Robe uses cylindrical projection; swatches at top-left for separate garment panels.
N=2048;im=Image.new('RGB',(N,N),'#f3ede3');d=ImageDraw.Draw(im)
for x in range(N):
 f=math.cos((x/N-.5)*math.tau*8);c=tuple(max(0,min(255,int(c*(.965+.035*f)))) for c in (243,237,227));d.line((x,0,x,N),fill=c)
for y in [1960,1974]:d.line((0,y,N,y),fill='#b8913f',width=5)
random.seed(7)
def flower(x,y,r):
 for i in range(5):
  a=i*math.tau/5;xx=x+math.cos(a)*r*.65;yy=y+math.sin(a)*r*.65
  d.ellipse((xx-r*.5,yy-r*.5,xx+r*.5,yy+r*.5),fill='#d99aa4')
 d.ellipse((x-r*.17,y-r*.17,x+r*.17,y+r*.17),fill='#b8913f')
# Asymmetric flowering branches concentrated low on one side and rising on one lapel.
for points,width in [([(850,1900),(880,1760),(850,1630),(940,1490),(960,1360)],5), ([(1160,1900),(1110,1800),(1150,1680)],4), ([(1070,1010),(1110,930),(1100,820)],3)]:
 d.line(points,fill='#5d7a62',width=width,joint='curve')
 for i,(x,y) in enumerate(points):
  r=(26 if y>1350 else 12)*(1-.07*i)
  flower(x,y,r)
  if i%2==0:flower(x+35,y-26,r*.65)
  d.ellipse((x+9,y+8,x+35,y+18),fill='#5d7a62')
# Cloth swatches, protected from embroidery.
for cy,color in [(0.04,'#f3ede3'),(.12,'#a8202b'),(.20,'#f7f1ea'),(.28,'#b8913f')]:
 y=int((1-cy)*N);d.rectangle((0,y-35,150,y+35),fill=color)
# Red ribbon tile with texture-painted gold selvedges. UV is confined to its bounds.
d.rectangle((0,0,250,500),fill='#a8202b');d.line((16,0,16,500),fill='#b8913f',width=5);d.line((234,0,234,500),fill='#b8913f',width=5)
im.save(OUT/'robe.png',optimize=True)
# Crown atlas color chips: explicit base colors, no metal/lighting dependency.
im=Image.new('RGB',(1024,1024),'#3c6762');d=ImageDraw.Draw(im)
for i,c in enumerate(['#3c6762','#b8913f','#a8202b','#f7f1ea']):d.rectangle((i*256,0,(i+1)*256-1,1023),fill=c)
im.save(OUT/'headdress.png',optimize=True)
# Face rasterization at 2x; landmarks use specified top-down V.
S=2048

def curve(draw,points,fill,width):
 pts=[]
 for i in range(len(points)-1):
  a=points[i];b=points[i+1]
  for j in range(20):t=j/20;pts.append(((a[0]*(1-t)+b[0]*t)*S,(a[1]*(1-t)+b[1]*t)*S))
 pts.append((points[-1][0]*S,points[-1][1]*S));draw.line(pts,fill=fill,width=max(1,int(width*S)),joint='curve')
for full in [False,True]:
 im=Image.new('RGB',(S,S),'#f2e8de')
 if full:
  blush=Image.new('RGBA',(S,S));b=ImageDraw.Draw(blush)
  for x in [.345,.655]:b.ellipse(((x-.09)*S,.375*S,(x+.09)*S,.61*S),fill=(184,46,76,105))
  blush=blush.filter(ImageFilter.GaussianBlur(35));im=Image.alpha_composite(im.convert('RGBA'),blush).convert('RGB')
 d=ImageDraw.Draw(im)
 for side in [-1,1]:
  # Inner brow stays level, tail gently lifts; no angry inward slant.
  def pts(values):return [(.5+side*x,y) for x,y in values]
  curve(d,pts([(.05,.39),(.085,.378),(.135,.365),(.18,.355),(.20,.35)]),'#292025',.007 if full else .005)
  # Almond eye with subtle lifted outer corner, pupil directed forward.
  polygon=pts([(.065,.454),(.085,.438),(.12,.429),(.151,.434),(.183,.416),(.166,.453),(.12,.468),(.085,.463)])
  d.polygon([(x*S,y*S) for x,y in polygon],fill='#fff8ef')
  x=.5+side*.12;y=.45
  d.ellipse(((x-.011)*S,(y-.016)*S,(x+.011)*S,(y+.016)*S),fill='#251c23')
  d.ellipse(((x-.004)*S,(y-.009)*S,(x+.002)*S,(y-.003)*S),fill='#fff5e9')
  curve(d,pts([(.065,.454),(.09,.438),(.12,.429),(.15,.433),(.183,.416)]),'#211b21',.005 if full else .0035)
  curve(d,pts([(.075,.46),(.12,.47),(.16,.453)]),'#6f4a48',.002)
 # Soft nose definition and a small calm mouth; no raised facial objects.
 curve(d,[(.486,.53),(.482,.556),(.491,.564)],'#c8aea2',.002)
 curve(d,[(.509,.564),(.518,.556),(.514,.53)],'#c8aea2',.002)
 lip='#a8202b' if full else '#b66e6e'
 d.polygon([(x*S,y*S) for x,y in [(.445,.65),(.472,.641),(.49,.637),(.50,.645),(.51,.637),(.528,.641),(.555,.65),(.53,.663),(.5,.67),(.47,.663)]],fill=lip)
 curve(d,[(.455,.65),(.5,.652),(.545,.65)],'#7a343d',.0015)
 im.resize((1024,1024),Image.Resampling.LANCZOS).save(OUT/('face_full.png' if full else 'face_base.png'),optimize=True)
print('Saved robe 2048, headdress 1024, face_base / face_full 1024')
