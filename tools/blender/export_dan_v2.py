import bpy,json
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parents[2]/'artifacts/blender/dan_v2'
s=bpy.context.scene;col=bpy.data.collections['DanV2_Character'];rig=bpy.data.objects['DanV2_Rig']
rig.animation_data.action=bpy.data.actions['idle'];s.frame_set(1)
# Consolidate compatible skinned pieces to keep browser draw calls low.
for matname in ['robe','headdress','hair','face']:
 objects=[o for o in col.objects if o.type=='MESH' and o.name!='Face' and o.data.materials and o.data.materials[0].name==matname]
 if not objects:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name={'face':'Skin'}.get(matname,matname)
# Shared shader face image for controlled comparison and runtime compositing.
face=bpy.data.materials['face'];tx=next(n for n in face.node_tree.nodes if n.type=='TEX_IMAGE');tx.image=bpy.data.images.load(str(OUT/'face_full.png'),check_existing=True)
s.cycles.samples=32;s.render.resolution_x=720;s.render.resolution_y=900
positions={'front':(0,-4,1),'side':(4,0,1),'back':(0,4,1),'three_quarter':(2.5,-4,1.1)}
for name,pos in positions.items():
 s.camera.data.ortho_scale=2.1;s.camera.location=pos;s.camera.rotation_euler=(Vector((0,0,.94))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(OUT/('dan_v2_'+name+'.png'));bpy.ops.render.render(write_still=True)
# A true mesh-wire render, material override only; leaves delivery material graph intact.
w=bpy.data.materials.new('ReviewWireOnly');w.use_nodes=True;n=w.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');em=n.new('ShaderNodeEmission');wire=n.new('ShaderNodeWireframe');wire.use_pixel_size=True;wire.inputs['Size'].default_value=.65;mix=n.new('ShaderNodeMixRGB');mix.inputs[1].default_value=(.5,.55,.6,1);mix.inputs[2].default_value=(.015,.02,.025,1);w.node_tree.links.new(wire.outputs[0],mix.inputs[0]);w.node_tree.links.new(mix.outputs[0],em.inputs[0]);w.node_tree.links.new(em.outputs[0],out.inputs[0]);s.view_layers[0].material_override=w;s.render.filepath=str(OUT/'dan_v2_wireframe.png');bpy.ops.render.render(write_still=True);s.view_layers[0].material_override=None
# Same studio, wider framing for gesture sweeps. Each action has start/peak/end evidence.
s.camera.data.ortho_scale=2.65
for name in ['idle','sing','speak','act','fight','bow']:
 rig.animation_data.action=bpy.data.actions[name]
 frames=[1,55,109] if name=='idle' else [1,19,37]
 for label,frame in zip(['start','peak','end'],frames):
  s.frame_set(frame);s.render.filepath=str(OUT/(name+'_'+label+'.png'));bpy.ops.render.render(write_still=True)
rig.animation_data.action=bpy.data.actions['idle'];s.frame_set(1);s.camera.data.ortho_scale=2.1
# Final GLB uses bare face; game paints layers at runtime without UV compression.
tx.image=bpy.data.images.load(str(OUT/'face_base.png'),check_existing=True)
bpy.ops.object.select_all(action='DESELECT')
for o in col.objects:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(OUT/'dan_v2.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_skins=True,export_yup=True,export_apply=False)
# Persist the review file with full makeup; export above remains runtime-ready.
tx.image=bpy.data.images.load(str(OUT/'face_full.png'),check_existing=True)
for image in [n.image for m in [bpy.data.materials[k] for k in ['robe','headdress','face']] for n in m.node_tree.nodes if n.type=='TEX_IMAGE']:
 if not image.packed_file:image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'dan_v2.blend'))
counts=[]
for o in col.objects:
 if o.type=='MESH':o.data.calc_loop_triangles();counts.append({'mesh':o.name,'triangles':len(o.data.loop_triangles)})
report={'triangles':sum(x['triangles'] for x in counts),'headdress_triangles':next(x['triangles'] for x in counts if x['mesh']=='headdress'),'bones':len(rig.data.bones),'max_weights':max(len(v.groups) for o in col.objects if o.type=='MESH' for v in o.data.vertices),'mesh_counts':counts,'glb_bytes':(OUT/'dan_v2.glb').stat().st_size}
(OUT/'model_metrics.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report))
