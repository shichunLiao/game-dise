"""Normalize Blender's frame-1 timestamps to zero, then validate delivery limits."""
import struct,json,hashlib
from pathlib import Path
p=Path(__file__).resolve().parents[2]/'artifacts/blender/dan_v2/dan_v2.glb'
b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);off=20+n;binary=bytearray(b[off+8:]);done=set()
for animation in g['animations']:
 for sampler in animation['samplers']:
  idx=sampler['input']
  if idx in done:continue
  done.add(idx);a=g['accessors'][idx];v=g['bufferViews'][a['bufferView']];pos=v.get('byteOffset',0)+a.get('byteOffset',0);values=list(struct.unpack_from('<'+'f'*a['count'],binary,pos));start=values[0];values=[max(0,x-start) for x in values];struct.pack_into('<'+'f'*len(values),binary,pos,*values);a['min']=[values[0]];a['max']=[values[-1]]
j=json.dumps(g,separators=(',',':')).encode();j+=b' '*((-len(j))%4);binary+=b'\0'*((-len(binary))%4);result=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary;p.write_bytes(result)
def data(idx):
 a=g['accessors'][idx];v=g['bufferViews'][a['bufferView']];return struct.unpack_from('<'+'f'*(a['count']*{'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']]),binary,v.get('byteOffset',0)+a.get('byteOffset',0))
r={'glb_bytes':len(result),'sha256':hashlib.sha256(result).hexdigest(),'triangles':sum(g['accessors'][p['indices']]['count']//3 for m in g['meshes'] for p in m['primitives']),'bones':max(len(s['joints']) for s in g['skins']),'materials':[m['name'] for m in g['materials']],'cameras':len(g.get('cameras',[])),'mesh_names':[m['name'] for m in g['meshes']],'animations':[]}
for a in g['animations']:
 duration=max(data(s['input'])[-1] for s in a['samplers']);diff=max(max(abs(x-y) for x,y in zip(data(s['output'])[:4],data(s['output'])[-4:])) for s in a['samplers'] if g['accessors'][s['output']]['type']=='VEC4');r['animations'].append({'name':a['name'],'duration':duration,'endpoint_rotation_delta':diff})
assert r['triangles']<=25000 and r['bones']<=40 and len(result)<5*1024*1024
assert sorted(r['materials'])==['face','hair','headdress','robe']
assert {a['name'] for a in r['animations']}=={'idle','sing','speak','act','fight','bow'}
assert all(a['duration']<=1.201 if a['name']!='idle' else 3<=a['duration']<=4 for a in r['animations'])
assert all(a['endpoint_rotation_delta']<.0001 for a in r['animations'])
(p.parent/'glb-validation.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
