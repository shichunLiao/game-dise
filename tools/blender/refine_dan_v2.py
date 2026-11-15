import bpy,math,json
from mathutils import Vector
from pathlib import Path
OUT=Path(__file__).resolve().parents[2]/'artifacts/blender/dan_v2'
s=bpy.context.scene;col=bpy.data.collections['DanV2_Character'];rig=bpy.data.objects['DanV2_Rig']
# Correct cloth ribbon UV using distance across centerline, independent of triangulation.
paths={'右衽 · 下襟':([(-.07,1.34),(-.052,1.29),(-.02,1.24),(.018,1.19)],.045),'右衽 · 左襟在上':([(.075,1.34),(.063,1.30),(.033,1.25),(-.006,1.19),(-.045,1.13),(-.085,1.06),(-.112,1.002)],.061)}
for o in col.objects:
 if o.type!='MESH':continue
 if o.name.startswith('hair · 灰模髮頂'):
  for k in range(12):
   for j in range(64):
    a=j*math.tau/64;t=k/11;theta=.04+(1.30-.38*math.cos(a))*t
    o.data.vertices[k*64+j].co=(.110*math.sin(theta)*math.sin(a),-.003-.100*math.sin(theta)*math.cos(a),1.515+.155*math.cos(theta))
 if o.name.startswith(('右衽','腰帶尾')):
  if o.name.startswith('腰帶尾'):
   side=-1 if '-1' in o.name else 1;coords=[(side*.055,1.002),(side*.065,.902),(side*.052,.782),(side*.078,.662)];width=.036
  else:coords,width=next(v for k,v in paths.items() if o.name.startswith(k))
  uv=o.data.uv_layers.active
  for poly in o.data.polygons:
   for li in poly.loop_indices:
    p=o.data.vertices[o.data.loops[li].vertex_index].co;best=(999,0,0)
    for a,b in zip(coords,coords[1:]):
     dx=b[0]-a[0];dz=b[1]-a[1];l2=dx*dx+dz*dz;t=max(0,min(1,((p.x-a[0])*dx+(p.z-a[1])*dz)/l2));qx=a[0]+t*dx;qz=a[1]+t*dz
     dist=(p.x-qx)**2+(p.z-qz)**2;signed=((p.x-qx)*(-dz)+(p.z-qz)*dx)/math.sqrt(l2)
     if dist<best[0]:best=(dist,signed,t)
    uv.data[li].uv=(max(.001,min(.121,.122*(.5+best[1]/width))),.82+.12*best[2])
 # Budget reductions preserve skin weights and silhouette.
 target=None
 if o.name.startswith('robe ·'):target=8500
 elif o.name=='Face':target=1500
 elif o.name.startswith('水袖'):target=1300
 elif o.name.startswith('hair ·'):target=500
 elif o.name.startswith(('手掌','四指')):target=160
 elif o.name.startswith('拇指'):target=100
 if target:
  o.data.calc_loop_triangles();count=len(o.data.loop_triangles)
  if count>target:
   bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('Game budget','DECIMATE');mod.ratio=target/count
   # Apply before armature to preserve rest geometry.
   bpy.ops.object.modifier_move_up(modifier=mod.name)
   bpy.ops.object.modifier_apply(modifier=mod.name)
# Display full makeup; switch to base texture for the deliverable GLB after review.
face=bpy.data.materials['face'];node=next(n for n in face.node_tree.nodes if n.type=='TEX_IMAGE');node.image=bpy.data.images.load(str(OUT/'face_full.png'),check_existing=True)
rig.animation_data.action=bpy.data.actions['idle'];s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'dan_v2.blend'))
print('Refined collar atlas, forehead clearance, game mesh budget and full-makeup review')
