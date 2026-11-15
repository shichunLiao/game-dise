"""Editable opera costume study. All geometry is authored in Blender."""
import bpy, math
from mathutils import Vector
from pathlib import Path
OUT=Path(__file__).resolve().parents[2]/'artifacts/blender'
OUT.mkdir(parents=True,exist_ok=True)
s=bpy.data.scenes.new('底色 · 戲曲角色工作室')
bpy.context.window.scene=s
col=bpy.data.collections.new('主角 · 戲服初稿');s.collection.children.link(col)
def link(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);return o
def mat(n,c,metal=0,rough=.45):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True
 p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 return m
ivory=mat('象牙白 · 絲緞',(.78,.70,.54),0,.38)
red=mat('朱砂 · 繡線',(.38,.018,.025),0,.48)
ink=mat('墨黑 · 髮絲',(.009,.012,.016),0,.3)
skin=mat('粉白 · 妝面',(.91,.76,.65),0,.55)
gold=mat('舊金 · 冠飾',(.58,.34,.10),.78,.27)
pearl=mat('月白 · 珍珠',(.88,.88,.78),.2,.22)
jade=mat('青玉 · 點翠',(.025,.22,.20),.5,.3)
pink=mat('胭脂',(.55,.10,.13),0,.65)
def uv(n,loc,scale,m,seg=32,rings=20):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc);o=link(bpy.context.object);o.name=n;o.scale=scale;o.data.materials.append(m)
 for f in o.data.polygons:f.use_smooth=True
 return o
def curve(n,pts,m,r=.006):
 d=bpy.data.curves.new(n,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=3
 sp=d.splines.new('BEZIER');sp.bezier_points.add(len(pts)-1)
 for p,v in zip(sp.bezier_points,pts):p.co=v;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(n,d);col.objects.link(o);o.data.materials.append(m);return o
# Tailored robe: elliptical rings, taper at waist, fabric folds increasing toward hem.
rings=[(.10,.49,.24),(.18,.48,.24),(.45,.43,.23),(.8,.34,.20),(1.0,.25,.17),(1.12,.23,.16),(1.30,.28,.18),(1.43,.29,.17),(1.50,.14,.12)]
v=[];faces=[];N=96
for z,rx,ry in rings:
 for j in range(N):
  a=j*math.tau/N;fold=.012*math.cos(12*a)*(1.5-z)
  v.append(((rx+fold)*math.sin(a),(ry+fold)*math.cos(a),z))
for k in range(len(rings)-1):
 for j in range(N):a=k*N+j;b=k*N+(j+1)%N;faces.append((a,b,b+N,a+N))
d=bpy.data.meshes.new('衣褶拓撲');d.from_pydata(v,[],faces);d.update();o=bpy.data.objects.new('戲服 · 衣身',d);col.objects.link(o);d.materials.append(ivory)
for p in d.polygons:p.use_smooth=True
mod=o.modifiers.new('絲緞平滑','SUBSURF');mod.levels=2
# Cross collar and layered front panel.
curve('交領 · 朱緣',[(-.12,-.115,1.49),(-.10,-.19,1.36),(.14,-.19,1.12),(.18,-.19,.97)],red,.018)
curve('右領 · 金緣',[(.12,-.115,1.49),(.08,-.19,1.36),(-.11,-.19,1.16)],gold,.009)
for z in [.15,.18,.95,.99]:
 rx=.48 if z<.3 else .26;ry=.25 if z<.3 else .18
 curve('繡邊',[(rx*math.sin(j*math.tau/64),ry*math.cos(j*math.tau/64),z) for j in range(65)],gold,.005)
# Water sleeves with asymmetric elbow poses, articulated as separate meshes.
for side in [-1,1]:
 pts=[(side*.23,0,1.41),(side*.40,-.015,1.30),(side*.54,-.08,1.20),(side*.65,-.13,1.20)]
 curve('袖身',pts,ivory,.12)
 uv('手', (side*.69,-.14,1.20),(.07,.045,.035),skin)
 verts=[];quads=[]
 for i in range(21):
  t=i/20
  for j in range(13):
   u=j/12-.5;verts.append((side*(.60+.13*t)+u*.23,-.12+.04*math.sin(u*22+t*3),1.19-.62*t+.04*math.sin(t*5+u*5)))
 for i in range(20):
  for j in range(12):a=i*13+j;quads.append((a,a+1,a+14,a+13))
 me=bpy.data.meshes.new('水袖褶面');me.from_pydata(verts,[],quads);ob=bpy.data.objects.new('水袖 · '+str(side),me);col.objects.link(ob);me.materials.append(ivory)
 sol=ob.modifiers.new('雙面絲料','SOLIDIFY');sol.thickness=.003
 for f in me.polygons:f.use_smooth=True
# Neck and shaped facial volume, front faces -Y.
uv('頸', (0,0,1.53),(.075,.075,.13),skin)
head=uv('臉 · 初雕',(0,-.005,1.73),(.145,.12,.205),skin,48,32)
# Reshape jaw; retain editable topology.
for p in head.data.vertices:
 if p.co.z<-.05:p.co.x*=.78+.22*(p.co.z+1)
uv('髮髻',(0,.04,1.89),(.16,.12,.13),ink)
for side in [-1,1]:
 # Tiny eye whites, irises, upper lid and lifted liner.
 uv('眼白',(side*.060,-.117,1.752),(.036,.012,.014),pearl)
 uv('瞳',(side*.057,-.128,1.752),(.010,.004,.011),ink,24,16)
 curve('丹鳳眼',[(side*.023,-.129,1.754),(side*.060,-.132,1.77),(side*.105,-.104,1.795)],ink,.005)
 curve('眉',[(side*.025,-.112,1.807),(side*.058,-.116,1.831),(side*.105,-.085,1.83)],ink,.006)
 curve('胭脂眼影',[(side*.03,-.114,1.78),(side*.065,-.113,1.796),(side*.101,-.09,1.808)],pink,.008)
 curve('鬢角',[(side*.123,-.04,1.89),(side*.143,-.072,1.80),(side*.12,-.07,1.64)],ink,.018)
uv('鼻樑',(0,-.117,1.735),(.016,.022,.052),skin)
uv('鼻尖',(0,-.141,1.702),(.023,.018,.016),skin)
curve('朱唇 · 上',[(-.028,-.113,1.662),(-.009,-.126,1.666),(0,-.129,1.661),(.012,-.126,1.665),(.028,-.113,1.662)],red,.005)
curve('朱唇 · 下',[(-.024,-.116,1.659),(0,-.13,1.65),(.024,-.116,1.659)],pink,.005)
# Crown: engraved fan ornaments, inset jade, pearls and hanging strands.
for i in range(11):
 a=(i-5)*.22;x=.22*math.sin(a);z=1.91+.23*math.cos(a)
 curve('鳳冠 · 金枝',[(x*.6,.015,1.91),(x,.0,z-.04),(x,-.01,z)],gold,.009)
 uv('鳳冠 · 點翠',(x,-.01,z-.035),(.035,.014,.058),jade,24,16)
 uv('鳳冠 · 朱石',(x,-.027,z-.025),(.014,.009,.024),red,20,12)
 uv('鳳冠 · 冠珠',(x,-.012,z+.025),(.022,.022,.022),pearl,20,12)
for i in range(13):
 x=(i-6)*.024;z=1.905+.04*math.cos(x*8)
 uv('額珠',(x,-.10,z),(.013,.013,.013),pearl,16,12)
for side in [-1,1]:
 for strand in range(4):
  x=side*(.155+strand*.026);top=1.95+strand*.02;bottom=1.55+strand*.015
  curve('珠穗 · 金鏈',[(x,0,top),(x+side*.015,-.015,(top+bottom)/2),(x,-.035,bottom)],gold,.002)
  for k in range(11):
   t=k/10;uv('珠穗',(x+side*.01*math.sin(t*math.pi),-.02*t,top+(bottom-top)*t),(.008,.008,.01),pearl,12,8)
  uv('珠穗 · 翠墜',(x,-.03,bottom-.025),(.013,.010,.025),jade,16,12)
# Embroidered vines and plum blossoms, placed on front surface of robe.
for side in [-1,1]:
 pts=[]
 for i in range(30):
  t=i/29;z=.24+t*.68;x=side*(.15+.045*math.sin(t*8));ry=.245-.07*t
  pts.append((x,-ry,z))
 curve('纏枝繡紋',pts,gold,.003)
 for k in range(7):
  t=k/6;z=.27+t*.59;x=side*(.15+.045*math.sin(t*8));y=-.25+.07*t
  for pet in range(5):
   a=pet*math.tau/5;uv('梅花繡片',(x+.018*math.cos(a),y-.003,z+.018*math.sin(a)),(.014,.004,.012),pink,12,8)
  uv('花蕊',(x,y-.008,z),(.006,.004,.006),gold,12,8)
# Studio is separate from exportable character collection.
studio=bpy.data.collections.new('工作室 · 燈光');s.collection.children.link(studio)
def studio_link(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 studio.objects.link(o)
uv('展台',(0,0,.025),(.7,.48,.025),ink,64,16);studio_link(bpy.context.object)
bpy.ops.object.camera_add(location=(3,-6,2.7));cam=bpy.context.object;studio_link(cam);cam.rotation_euler=(Vector((0,0,1.1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.65;s.camera=cam
for n,loc,energy,size,color in [('柔光',(-3,-4,5),450,4,(1,.86,.70)),('輪廓',(2,2,3),650,3,(.6,.8,1)),('補光',(3,-2,2),180,3,(1,.7,.55))]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;studio_link(l);l.name=n;l.data.energy=energy;l.data.shape='DISK';l.data.size=size;l.data.color=color;l.rotation_euler=(Vector((0,0,1.1))-l.location).to_track_quat('-Z','Y').to_euler()
s.world=bpy.data.worlds.new('墨色工作室');s.world.use_nodes=True;bg=next(n for n in s.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.025,.033,.04,1);bg.inputs[1].default_value=.35
s.render.resolution_x=900;s.render.resolution_y=1100;s.render.resolution_percentage=100
s.render.filepath=str(OUT/'opera-study.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'opera-study.blend'))
print('SAVED',len(col.objects),'editable costume objects',str(OUT/'opera-study.blend'))
