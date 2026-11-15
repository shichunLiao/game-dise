"""Detail, texture, budget, bind and animate the approved gray model."""
import bpy,math,json
from mathutils import Vector,Quaternion
from pathlib import Path
OUT=Path(__file__).resolve().parents[2]/'artifacts/blender/dan_v2'
old=bpy.context.scene
s=old.copy();s.name='旦角 v2 · 完成版';bpy.context.window.scene=s
for c in list(s.collection.children):s.collection.children.unlink(c)
char=bpy.data.collections.new('DanV2_Character');s.collection.children.link(char)
studio=bpy.data.collections.new('DanV2_Studio');s.collection.children.link(studio)
for o in old.objects:
 if o.name.startswith('頭面灰模預留'):continue
 new=o.copy();new.data=o.data.copy() if o.data else None
 (studio if o.type in ['LIGHT','CAMERA'] else char).objects.link(new)
 if o==old.camera:s.camera=new
# Four final materials, with color entirely in BaseColor.
def mat(n,color=(1,1,1),texture=None):
 m=bpy.data.materials.new(n);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.82;p.inputs['Metallic'].default_value=0
 if texture:
  tx=m.node_tree.nodes.new('ShaderNodeTexImage');tx.image=bpy.data.images.load(str(OUT/texture),check_existing=True);m.node_tree.links.new(tx.outputs['Color'],p.inputs['Base Color'])
 m.diffuse_color=(*color,1);return m
# Remove unused base-name materials from global namespace so GLB names are exact.
for n in ['robe','headdress','hair','face']:
 if bpy.data.materials.get(n):bpy.data.materials[n].name=n+'_old'
robe=mat('robe',texture='robe.png');crown=mat('headdress',texture='headdress.png');hair=mat('hair',(.007,.0056,.007));face=mat('face',texture='face_base.png')
def assign(o,m):o.data.materials.clear();o.data.materials.append(m)
def uvmap(o,fn):
 uv=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap')
 for poly in o.data.polygons:
  for li in poly.loop_indices:
   v=o.matrix_world@o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=fn(v)
def chip(o,index):assign(o,crown);uvmap(o,lambda v:((index+.5)/4,.5))
def move(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 char.objects.link(o);return o
parts=[]
def ball(n,loc,size,color,bone='Head'):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,location=loc);o=move(bpy.context.object);o.name=n;o.scale=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for p in o.data.polygons:p.use_smooth=True
 chip(o,color);o['rig_bone']=bone;parts.append(o);return o
# Apply gray garment modifiers before assigning UVs.
for o in list(char.objects):
 if o.type!='MESH':continue
 bpy.context.view_layer.objects.active=o
 for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
 # Reserve room for headpiece and facial meshes.
 o.data.calc_loop_triangles();count=len(o.data.loop_triangles)
 if o.name.startswith('robe ·') and count>10500:
  mod=o.modifiers.new('Final garment budget','DECIMATE');mod.ratio=10500/count;bpy.ops.object.modifier_apply(modifier=mod.name)
 if o.name.startswith('face ·'):
  assign(o,face);uvmap(o,lambda v:(.5+v.x/.368,1-(.12+(1.667-v.z)/.434)));o.name='Face';o['rig_bone']='Head'
 elif o.name.startswith('hair ·'):
  assign(o,hair);o['rig_bone']='Head'
 elif o.name.startswith(('頸','白護領')):
  assign(o,robe if o.name.startswith('白') else face)
  uvmap(o,lambda v:(.035,.04) if o.name.startswith('白') else (.04,.95));o['rig_bone']='Neck'
 elif o.name.startswith(('手掌','四指','拇指')):
  assign(o,face);uvmap(o,lambda v:(.04,.95));o['rig_bone']='Hand.'+('R' if '-1' in o.name else 'L')
 else:
  assign(o,robe)
  if o.name.startswith('robe ·'):
   uvmap(o,lambda v:((.5+math.atan2(v.x,-v.y)/math.tau)%1,max(.005,min(.995,v.z/1.4))))
  elif o.name.startswith(('右衽','腰帶尾')):
   # Ribbon width across 0..0.122 tile; painted gold borders hug the edges.
   uv=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap')
   # Original mesh pairs trace the two cloth edges; modifiers add edge loops.
   for li,loop in enumerate(o.data.loops):
    v=o.data.vertices[loop.vertex_index];uv.data[li].uv=(.008 if loop.vertex_index%2==0 else .114,.80+max(0,min(.18,v.co.z*.1)))
  elif o.name.startswith(('腰帶','裙邊')):uvmap(o,lambda v:(.035,.12))
  else:uvmap(o,lambda v:(.035,.20))
# Thin symmetric cheek-framing patches and seven front curls.
def patch(n,pts,width):
 v=[];f=[]
 for i,(x,y,z) in enumerate(pts):
  v.extend([(x-width/2,y,z),(x+width/2,y,z)])
  if i: a=2*(i-1);f.append((a,a+1,a+3,a+2))
 me=bpy.data.meshes.new(n);me.from_pydata(v,[],f);me.update();o=bpy.data.objects.new(n,me);char.objects.link(o);assign(o,hair);o['rig_bone']='Head'
 sol=o.modifiers.new('Thin hair piece','SOLIDIFY');sol.thickness=.002
 bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sol.name)
 for f in o.data.polygons:f.use_smooth=True
 return o
for side in [-1,1]:
 patch('貼片子 · 長紡 '+str(side),[(side*(.091+.004*math.sin(t*math.pi)), -.063-.012*math.sin(t*math.pi),1.595-.205*t) for t in [i/24 for i in range(25)]],.020)
for k in range(7):
 x=(k-3)*.027;z=1.60+.017*(abs(k-3)/3)
 o=ball('額前七彎',(x,-.083,z),(.017,.008,.022),0);assign(o,hair)
# Crown, <=6000 triangles: 11 fans, pearls, three strings per side.
for i in range(11):
 a=(i-5)*.20;x=.165*math.sin(a);z=1.665+.13*math.cos(a)
 ball('金托',(x,-.006,z-.025),(.025,.011,.043),1)
 ball('石綠冠葉',(x,-.014,z-.022),(.021,.009,.036),0)
 ball('朱石',(x,-.024,z-.020),(.010,.006,.018),2)
 ball('冠珠',(x,-.01,z+.026),(.014,.014,.014),3)
for i in range(11):
 x=(i-5)*.019;ball('額珠',(x,-.079,1.632+.014*math.cos(x*9)),(.009,.009,.009),3)
for side in [-1,1]:
 label='L' if side==1 else 'R'
 for strand in range(3):
  x=side*(.121+strand*.020);top=1.696+strand*.012;bottom=1.383+strand*.012
  for k in range(7):
   t=k/6;xx=x+side*.010*math.sin(t*math.pi);yy=-.012-.018*t
   ball('珠串 '+label+str(strand),(xx,yy,top+(bottom-top)*t),(.0065,.0065,.0085),3,'Pearl'+str(strand+1)+'.'+label+('.01' if t<.5 else '.02'))
  ball('翠墜 '+label+str(strand),(x,-.03,bottom-.018),(.010,.008,.020),0,'Pearl'+str(strand+1)+'.'+label+'.02')
# Armature: 38 bones, limited to four weights per vertex.
bpy.ops.object.armature_add(location=(0,0,0));rig=move(bpy.context.object);rig.name='DanV2_Rig';bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
def bone(n,h,t,parent=None):
 b=rig.data.edit_bones.new(n);b.head=h;b.tail=t
 if parent:b.parent=rig.data.edit_bones[parent]
 return b
bone('Root',(0,0,0),(0,0,.15));bone('Hips',(0,0,.90),(0,0,1.04),'Root');bone('Spine',(0,0,1.04),(0,0,1.18),'Hips');bone('Chest',(0,0,1.18),(0,0,1.32),'Spine');bone('Neck',(0,0,1.32),(0,0,1.40),'Chest');bone('Head',(0,0,1.40),(0,0,1.67),'Neck')
for side in [-1,1]:
 l='L' if side==1 else 'R'
 bone('UpperArm.'+l,(side*.155,0,1.28),(side*.35,-.01,1.17),'Chest')
 bone('ForeArm.'+l,(side*.35,-.01,1.17),(side*.515,-.035,1.067),'UpperArm.'+l)
 bone('Hand.'+l,(side*.515,-.035,1.067),(side*.59,-.05,1.057),'ForeArm.'+l)
 for i in range(5):
  t=i/5;t2=(i+1)/5
  bone('Sleeve'+str(i+1)+'.'+l,(side*(.515+.045*t),-.035,1.067-.607*t),(side*(.515+.045*t2),-.035,1.067-.607*t2),'Hand.'+l if i==0 else 'Sleeve'+str(i)+'.'+l)
 bone('Belt.'+l+'.01',(side*.055,-.11,1.002),(side*.06,-.13,.83),'Hips');bone('Belt.'+l+'.02',(side*.06,-.13,.83),(side*.078,-.15,.66),'Belt.'+l+'.01')
 for strand in range(3):
  x=side*(.121+strand*.020);top=1.696+strand*.012;bottom=1.383+strand*.012;mid=(top+bottom)/2
  bone('Pearl'+str(strand+1)+'.'+l+'.01',(x,-.012,top),(x,-.021,mid),'Head');bone('Pearl'+str(strand+1)+'.'+l+'.02',(x,-.021,mid),(x,-.03,bottom-.028),'Pearl'+str(strand+1)+'.'+l+'.01')
bpy.ops.object.mode_set(mode='OBJECT')
for o in list(char.objects):
 if o.type!='MESH':continue
 bpy.context.view_layer.objects.active=o;o.select_set(True);rig.select_set(False)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 groups={b.name:o.vertex_groups.new(name=b.name) for b in rig.data.bones}
 def weight(i,entries):
  total=sum(w for _,w in entries)
  for b,w in entries:
   if w>1e-5:groups[b].add([i],w/total,'REPLACE')
 fixed=o.get('rig_bone')
 for v in o.data.vertices:
  p=o.matrix_world@v.co;side='L' if p.x>=0 else 'R';x=abs(p.x);z=p.z
  if fixed:entries=[(fixed,1)]
  elif o.name.startswith('水袖'):
   t=max(0,min(.999,(1.067-z)/.607));a=t*5;idx=min(4,int(a));f=a-idx
   entries=[('Sleeve'+str(idx+1)+'.'+side,1-f),('Sleeve'+str(min(5,idx+2))+'.'+side,f)] if idx<4 else [('Sleeve5.'+side,1)]
  elif o.name.startswith('腰帶尾'):
   t=max(0,min(1,(1.002-z)/.34));entries=[('Belt.'+side+'.01',1-t),('Belt.'+side+'.02',t)]
  elif o.name.startswith('robe ·') and x>.16 and z>1.03:
   if x<.22:
    f=max(0,min(1,(x-.16)/.06));entries=[('Chest',1-f),('UpperArm.'+side,f)]
   elif x<.40:
    f=max(0,min(1,(x-.30)/.10));entries=[('UpperArm.'+side,1-f),('ForeArm.'+side,f)]
   else:entries=[('ForeArm.'+side,1)]
  elif z>1.15:entries=[('Chest',1)]
  elif z>1.0:
   t=(z-1.0)/.15;entries=[('Spine',t),('Hips',1-t)]
  else:entries=[('Hips',1)]
  weight(v.index,entries)
 o.parent=rig;mod=o.modifiers.new('DanV2 skin','ARMATURE');mod.object=rig
 for vg in list(o.vertex_groups):
  if not any(any(g.group==vg.index for g in v.groups) for v in o.data.vertices):o.vertex_groups.remove(vg)
# Animations use world-axis intents converted to local bone axes.
rig.animation_data_create();fps=30;s.render.fps=fps
for pb in rig.pose.bones:pb.rotation_mode='QUATERNION'
def rotate(name,axis,angle):
 pb=rig.pose.bones[name];local=pb.bone.matrix_local.to_quaternion().inverted()@Vector(axis);pb.rotation_quaternion=Quaternion(local,angle)
for name,duration in [('idle',3.6),('sing',1.2),('speak',1.2),('act',1.2),('fight',1.2),('bow',1.2)]:
 action=bpy.data.actions.new(name);rig.animation_data.action=action;end=round(duration*fps)+1
 for frame in range(1,end+1):
  t=(frame-1)/(end-1);amp=math.sin(math.pi*t)**2
  for pb in rig.pose.bones:pb.rotation_quaternion=(1,0,0,0);pb.location=(0,0,0)
  breathe=.006*math.sin(t*math.tau) if name=='idle' else 0
  rotate('Chest',(1,0,0),breathe)
  if name=='sing':
   rotate('Head',(1,0,0),-.12*amp)
   for side in [-1,1]:rotate('UpperArm.'+('L' if side==1 else 'R'),(0,1,0),-side*.48*amp)
  elif name=='speak':rotate('Chest',(1,0,0),.12*amp);rotate('UpperArm.R',(0,0,1),-.55*amp);rotate('ForeArm.R',(0,1,0),.22*amp)
  elif name=='act':rotate('UpperArm.L',(0,0,1),.45*amp);rotate('UpperArm.R',(0,1,0),.8*amp);rotate('ForeArm.R',(0,0,1),-.25*amp)
  elif name=='fight':
   rotate('Chest',(1,0,0),.17*amp)
   for l,sg in [('L',1),('R',-1)]:rotate('UpperArm.'+l,(0,0,1),sg*.55*amp);rotate('ForeArm.'+l,(0,1,0),-sg*.22*amp)
  elif name=='bow':
   rotate('Spine',(1,0,0),.28*amp);rotate('Head',(1,0,0),.15*amp)
   for l,sg in [('L',1),('R',-1)]:rotate('UpperArm.'+l,(0,0,1),sg*.28*amp)
  for l,sg in [('L',1),('R',-1)]:
   for i in range(5):
    # Gentle distributed bend; keep sleeves outside the body silhouette.
    wave=math.sin(t*math.tau-i*.4)*(.014 if name=='idle' else .06)*math.sin(math.pi*t)
    rotate('Sleeve'+str(i+1)+'.'+l,(1,0,0),wave)
   for i in range(3):
    for j in [1,2]:rotate('Pearl'+str(i+1)+'.'+l+'.0'+str(j),(1,0,0),.03*math.sin(t*math.tau+i*.4)*math.sin(math.pi*t))
   for j in [1,2]:rotate('Belt.'+l+'.0'+str(j),(1,0,0),.04*math.sin(t*math.tau)*math.sin(math.pi*t))
  for pb in rig.pose.bones:pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)
  rig.pose.bones['Chest'].keyframe_insert('location',frame=frame)
 track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);track.mute=True
rig.animation_data.action=bpy.data.actions.get('idle');s.frame_set(1)
s.frame_start=1;s.frame_end=109
# Metrics and strict delivery budget.
counts=[];crown_tris=0
for o in char.objects:
 if o.type=='MESH':
  o.data.calc_loop_triangles();n=len(o.data.loop_triangles);counts.append({'mesh':o.name,'triangles':n})
  if o.data.materials and o.data.materials[0]==crown:crown_tris+=n
report={'triangles':sum(x['triangles'] for x in counts),'headdress_triangles':crown_tris,'bones':len(rig.data.bones),'max_weights':max(len(v.groups) for o in char.objects if o.type=='MESH' for v in o.data.vertices),'meshes':counts,'animations':['idle','sing','speak','act','fight','bow']}
(OUT/'model_metrics.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='meshes'}))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'dan_v2.blend'))
