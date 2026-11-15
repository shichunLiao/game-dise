from export_assets import *
files=[];issues=[]
allowed={BLACK,RED,PAPER}
for folder in ['draft','atan','actor','mirror']:
 for p in sorted((ROOT/folder).glob('*.png')):
  im=Image.open(p).convert('RGBA');a=np.array(im);visible=a[a[:,:,3]>0];colors={tuple(c) for c in visible[:,:3]};alphas=set(np.unique(a[:,:,3]).tolist())
  rel=str(p.relative_to(ROOT));entry={'file':rel,'width':im.width,'height':im.height,'mode':im.mode,'colors':['#%02X%02X%02X'%c for c in sorted(colors)],'alpha_values':sorted(alphas),'bbox':im.getbbox(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
  if im.size!=(1024,1024):issues.append(rel+': size')
  if not colors<=allowed:issues.append(rel+': palette')
  if not alphas<={0,255}:issues.append(rel+': continuous alpha')
  if p.name.endswith('_line.png') and colors!={BLACK}:issues.append(rel+': line')
  if p.name.endswith('_accent.png') and not colors<={RED}:issues.append(rel+': accent')
  if a[0,0,3]!=0 or a[-1,-1,3]!=0:issues.append(rel+': corner transparency')
  files.append(entry)
for group,poses in [('atan',['seated','reach','lowered']),('actor',['standing','pose'])]:
 for pose in poses:
  x=np.array(Image.open(ROOT/f'{group}/{pose}_line.png'));y=np.array(Image.open(ROOT/f'{group}/{pose}_accent.png'))
  if np.any((x[:,:,3]>0)&(y[:,:,3]>0)):issues.append(group+'/'+pose+': layer overlap')
base=np.array(Image.open(ROOT/'mirror/base.png'));full=np.array(Image.open(ROOT/'mirror/painted.png'));half=np.array(Image.open(ROOT/'mirror/half.png'));clean=np.array(Image.open(ROOT/'mirror/clean.png'))
fullmask=np.all(full[:,:,:3]==RED,axis=2)&(full[:,:,3]>0);halfmask=np.all(half[:,:,:3]==RED,axis=2)&(half[:,:,3]>0)
registration={'same_alpha_all_states':bool(np.array_equal(full[:,:,3],clean[:,:,3]) and np.array_equal(half[:,:,3],clean[:,:,3])),'same_nonpaint_pixels':bool(np.array_equal(full[~fullmask],base[~fullmask]) and np.array_equal(half[~halfmask],base[~halfmask])),'half_subset_full':bool(not np.any(halfmask&~fullmask)),'clean_equals_base':bool(np.array_equal(base,clean)),'painted_red_pixels':int(fullmask.sum()),'half_red_pixels':int(halfmask.sum())}
if not all(v for k,v in registration.items() if not k.endswith('_pixels')):issues.append('mirror registration')
protected=json.loads((ROOT/'work/protected-before.json').read_text());changed=[p for p,h in protected.items() if not Path(p).exists() or hashlib.sha256(Path(p).read_bytes()).hexdigest()!=h]
report={'asset_png_count':len(files),'files':files,'issues':issues,'mirror_registration':registration,'protected_files_count':len(protected),'protected_changes':changed,'proof_count':len(list((ROOT/'對比').glob('*.png')))}
(ROOT/'manifest.json').write_text(json.dumps(files,ensure_ascii=False,indent=2));(ROOT/'work/audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k!='files'},ensure_ascii=False,indent=2))
