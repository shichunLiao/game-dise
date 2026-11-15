"""Stage 1 of the supplied v2 brief: proportions and garment gray-model gate."""
import bpy,bmesh,math,json
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parents[2]/'artifacts/blender/dan_v2'
OUT.mkdir(parents=True,exist_ok=True)
s=bpy.data.scenes.new('旦角 v2 · 大形確認');bpy.context.window.scene=s
char=bpy.data.collections.new('DanV2_Gray_Character');s.collection.children.link(char)
studio=bpy.data.collections.new('RenderOnly');s.collection.children.link(studio)
def move(o,c=char):
 for old in list(o.users_collection):old.objects.unlink(o)
 c.objects.link(o);return o
def material(n,c):
 m=bpy.data.materials.new(n);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.78;m.diffuse_color=(*c,1);return m
gray=material('gray_cloth',(.44,.46,.48));light=material('gray_collar',(.60,.62,.64));dark=material('gray_hair',(.22,.24,.27))
def mesh(n,v,f,m=gray):
 d=bpy.data.meshes.new(n);d.from_pydata(v,[],f);d.update();bm=bmesh.new();bm.from_mesh(d);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(d);bm.free()
 o=bpy.data.objects.new(n,d);char.objects.link(o);d.materials.append(m)
 for p in d.polygons:p.use_smooth=True
 return o
def loft(n,rings,N=64,axis='z',fold=0):
 v=[];f=[]
 for k,(center,r1,r2) in enumerate(rings):
  for j in range(N):
   a=j*math.tau/N;w=1+fold*math.cos(8*a)
   q=(r1*math.cos(a)*w,r2*math.sin(a)*w)
   v.append((center[0]+q[0],center[1]+q[1],center[2]) if axis=='z' else (center[0],center[1]+q[0],center[2]+q[1]))
 for k in range(len(rings)-1):
  for j in range(N):a=k*N+j;b=k*N+(j+1)%N;f.append((a,b,b+N,a+N))
 for idx,flip in [(0,True),(len(rings)-1,False)]:
  v.append(rings[idx][0]);c=len(v)-1
  for j in range(N):
   a=idx*N+j;b=idx*N+(j+1)%N;f.append((c,b,a) if flip else (c,a,b))
 return mesh(n,v,f)
def sphere(n,loc,scale,m=gray,seg=32,rings=20):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc);o=move(bpy.context.object);o.name=n;o.scale=scale;o.data.materials.append(m)
 for f in o.data.polygons:f.use_smooth=True
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 return o
# H = .30364, hair top=1.67m, waist at 2.2H below hair top.
H=1.67/5.5;waist=1.67-2.2*H
profile=[(.016,.361,.176),(.05,.360,.175),(.16,.346,.17),(.35,.304,.154),(.58,.24,.137),(.80,.181,.12),(waist-.02,.131,.095),(waist+.025,.130,.096),(1.11,.146,.104),(1.22,.172,.106),(1.285,.179,.103),(1.325,.145,.087),(1.355,.065,.061)]
body=loft('robe · 收腰長褶衣身',[((0,0,z),rx,ry) for z,rx,ry in profile],96,fold=.035)
# Low shoulder seam; narrow upper sleeve expanding toward soft cuff.
arms=[]
for side in [-1,1]:
 rings=[((side*.135,0,1.278),.073,.073),((side*.195,0,1.27),.064,.065),((side*.27,0,1.225),.060,.061),((side*.36,-.012,1.163),.067,.072),((side*.445,-.025,1.105),.078,.084),((side*.515,-.035,1.067),.084,.091)]
 arms.append(loft('袖身 · '+str(side),rings,48,axis='x'))
# Fuse upper sleeves with garment: continuous shoulder surface, no open triangles.
bpy.ops.object.select_all(action='DESELECT')
for o in [body]+arms:o.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.object.join()
rem=body.modifiers.new('肩袖連續拓撲','REMESH');rem.mode='VOXEL';rem.voxel_size=.0055;rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
sm=body.modifiers.new('柔化肩線','SMOOTH');sm.factor=1.1;sm.iterations=5;bpy.ops.object.modifier_apply(modifier=sm.name)
body.data.calc_loop_triangles();dec=body.modifiers.new('灰模網格預算','DECIMATE');dec.ratio=min(1,13000/max(1,len(body.data.loop_triangles)));bpy.ops.object.modifier_apply(modifier=dec.name)
# Surface height helper for flat cloth lapels; wearer-left is viewer-right (+X).
def front(x,z,offset=.005):
 for i in range(len(profile)-1):
  za,xa,ya=profile[i];zb,xb,yb=profile[i+1]
  if za<=z<=zb:
   t=(z-za)/(zb-za);rx=xa+(xb-xa)*t;ry=ya+(yb-ya)*t
   return -ry*math.sqrt(max(.02,1-(x/rx)**2))-offset
 return -.07-offset
def ribbon(n,coords,width,m=light):
 v=[]
 for i,(x,z) in enumerate(coords):
  before=coords[max(0,i-1)];after=coords[min(len(coords)-1,i+1)];dx=after[0]-before[0];dz=after[1]-before[1];l=math.hypot(dx,dz);nx=-dz/l*width/2;nz=dx/l*width/2
  for sign in [-1,1]:
   xx=x+sign*nx;zz=z+sign*nz;v.append((xx,front(xx,zz,.009),zz))
 o=mesh(n,v,[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(coords)-1)],m)
 so=o.modifiers.new('平布厚度','SOLIDIFY');so.thickness=.002
 be=o.modifiers.new('布邊微圓','BEVEL');be.width=.001;be.segments=2
 return o
ribbon('右衽 · 下襟',[(-.07,1.34),(-.052,1.29),(-.02,1.24),(.018,1.19)],.045)
ribbon('右衽 · 左襟在上',[(.075,1.34),(.063,1.30),(.033,1.25),(-.006,1.19),(-.045,1.13),(-.085,1.06),(-.112,waist)],.061)
# Belt and two separate fabric tails, not tubes.
loft('腰帶 · 寬0.2H',[((0,0,waist-.03),.136,.102),((0,0,waist+.03),.136,.102)],64)
for side in [-1,1]:
 ribbon('腰帶尾 · '+str(side),[(side*.055,waist),(side*.065,waist-.10),(side*.052,waist-.22),(side*.078,waist-.34)],.036)
# Continuous broad skirt border (gray contrast only).
loft('裙邊 · 朱紅預留區',[((0,0,.018),.365,.179),((0,0,.061),.365,.178)],96,fold=.035)
# Slender neck and close-fitting white guard collar seal neckline.
loft('頸',[((0,.005,1.322),.041,.043),((0,.005,1.40),.040,.043)],40)
loft('白護領',[((0,.004,1.323),.060,.060),((0,.004,1.355),.049,.050),((0,.004,1.384),.045,.047)],48)
head=sphere('face · 鵝蛋臉',(0,-.002,1.515),(.103,.087,.1518),light,48,32)
# Narrow jaw, pointed chin and a quiet profile; face will get frontal UV in next stage.
for p in head.data.vertices:
 z=p.co.z/.1518
 if z<0:p.co.x*=.68+.32*(z+1)
 if p.co.y<0:
  # Gentle integrated brow/nose volume, no raised eye or lip geometry.
  x=p.co.x
  p.co.y-=.009*math.exp(-(x/.025)**2)*math.exp(-((z+.05)/.33)**2)
# Back of head, bun and scalp, kept separate from face.
sphere('hair · 後腦',(0,.043,1.535),(.106,.070,.137),dark)
sphere('hair · 髮髻',(0,.082,1.635),(.075,.062,.065),dark)
# Hair cap custom shell with continuous curved forehead boundary.
v=[];f=[];N=64;K=12
for k in range(K):
 t=k/(K-1)
 for j in range(N):
  a=j*math.tau/N;theta=.04+(1.16+.18*max(0,math.cos(a)))*t
  v.append((.108*math.sin(theta)*math.sin(a),.004-.094*math.sin(theta)*math.cos(a),1.515+.155*math.cos(theta)))
for k in range(K-1):
 for j in range(N):a=k*N+j;b=k*N+(j+1)%N;f.append((a,b,b+N,a+N))
mesh('hair · 灰模髮頂',v,f,dark)
# Water sleeve silhouette: continuous perimeter at cuff, a single unthickened fabric surface.
for side in [-1,1]:
 v=[];f=[];N=48;K=25
 for i in range(K):
  t=i/(K-1)
  for j in range(N):
   a=j*math.tau/N
   # Start exactly on cuff; flatten to a folded silk sheet as it falls.
   x=side*(.515+.045*t)+.085*t*math.cos(a)
   y=-.035+.084*(1-t)*math.cos(a)+.018*t*math.sin(3*a)
   z=1.067-.607*t+.091*(1-.82*t)*math.sin(a)+.018*t*math.sin(a*3+.5)
   v.append((x,y,z))
 for i in range(K-1):
  for j in range(N):a=i*N+j;b=i*N+(j+1)%N;f.append((a,b,b+N,a+N))
 mesh('水袖 · 單層連袖 '+str(side),v,f,light)
 # Flattened hand with grouped fingers and a distinct curved thumb.
 palm=sphere('手掌 · '+str(side),(side*.535,-.055,1.065),(.037,.022,.021),light,24,16)
 fingers=sphere('四指併攏 · '+str(side),(side*.568,-.060,1.058),(.028,.017,.014),light,24,16)
 thumb=sphere('拇指 · '+str(side),(side*.540,-.079,1.049),(.020,.011,.011),light,20,12)
# Reuse first-version crown as silhouette proxy, uniformly scaled around original head.
old=bpy.data.collections.get('主角 · 戲服初稿')
if old:
 for obj in old.objects:
  if obj.name.startswith(('鳳冠','額珠','珠穗')):
   new=obj.copy();new.data=obj.data.copy();char.objects.link(new);new.name='頭面灰模預留 · '+obj.name
   new.location*=.70;new.location.z+=.30
   new.scale*=.70
   new.data.materials.clear();new.data.materials.append(gray)
# Studio: same light arrangement for every angle. No platform in export collection.
world=bpy.data.worlds.new('GrayStudio');world.use_nodes=True;bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.035,.041,.05,1);bg.inputs[1].default_value=.4;s.world=world
for name,loc,power,size in [('Key',(-3,-4,4),300,4),('Fill',(3,-2,2),180,3),('Rim',(1,3,3),350,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=move(bpy.context.object,studio);o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.9))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-4,1.0));cam=move(bpy.context.object,studio);cam.data.type='ORTHO';cam.data.ortho_scale=2.10;s.camera=cam
s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True;s.render.resolution_x=720;s.render.resolution_y=900;s.render.resolution_percentage=100
s['stage']='gray_model_awaiting_shape_review';s['brief']='設計/旦角模型_第二版细修说明.md';s['hair_top_m']=1.67;s['head_height_m']=H;s['waist_z_m']=waist
# Standard four views, identical framing and light setup.
views={'front':(0,-4,1.0),'side':(4,0,1.0),'back':(0,4,1.0),'three_quarter':(2.5,-4,1.1)}
for name,position in views.items():
 cam.location=position;cam.rotation_euler=(Vector((0,0,.94))-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(OUT/('gray_'+name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=views['three_quarter'];cam.rotation_euler=(Vector((0,0,.94))-cam.location).to_track_quat('-Z','Y').to_euler()
# Save after placing review camera. Fine details/UV/rig/export intentionally follow review.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'dan_v2_gray.blend'))
print('GRAY MODEL SAVED',str(OUT))
