from export_assets import *
FONT='/System/Library/Fonts/Hiragino Sans GB.ttc'
def font(n):return ImageFont.truetype(FONT,n)
def label(canvas,xy,text,size=22,fill='#120e11'):ImageDraw.Draw(canvas).text(xy,text,font=font(size),fill=fill)
def fit(im,w,h):
 im=im.copy();im.thumbnail((w,h),Image.Resampling.LANCZOS);return im
def stamp(canvas,im,box,crop=False):
 if crop and im.getbbox():im=im.crop(im.getbbox())
 x,y,w,h=box;im=fit(im,w,h);canvas.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2),im if im.mode=='RGBA' else None)
def pair(stem,tint=None):
 a=Image.open(ROOT/f'{stem}_line.png').convert('RGBA')
 if tint:
  ar=np.array(a);ar[ar[:,:,3]>0,:3]=tint;a=Image.fromarray(ar)
 a.alpha_composite(Image.open(ROOT/f'{stem}_accent.png'));return a
items=[
 ('atan/seated','阿檀・正面坐姿','原型截圖/原型_早上装匣.png'),
 ('atan/reach','阿檀・起身伸手','設計/美術/feedback_v17/qa_mobile_door/06_door_desk_1440x900.png'),
 ('atan/lowered','阿檀・低頭','設計/美術/feedback_v17/qa_mobile/07_evening_390x844.png'),
 ('actor/standing','台上的你・站姿','原型截圖/原型_戲台.png'),
 ('actor/pose','台上的你・亮相','原型截圖/原型_戲台.png'),
 ('mirror/painted','鏡中臉・上妝','設計/美術/feedback_v17/qa_mobile_door/01_door_paint_390x844.png'),
 ('mirror/half','鏡中臉・半卸','設計/美術/feedback_v17/qa_mobile_door/04_door_after_wipe_390x844.png'),
 ('mirror/clean','鏡中臉・卸淨（底色）','設計/美術/feedback_v17/qa_mobile_door/05_door_after_clean_all_390x844.png')]
def art(stem):return Image.open(ROOT/f'{stem}.png').convert('RGBA') if stem.startswith('mirror') else pair(stem)
for stem,title,scene in items:
 s=Image.new('RGB',(1600,1000),'#ece3d4');d=ImageDraw.Draw(s)
 label(s,(35,25),f'{title}  |  靜態審圖・未接入遊戲',30)
 label(s,(35,90),'現有畫面（原圖）',22);label(s,(1010,90),'新圖・紙白底',22)
 im=Image.open(scene).convert('RGB');stamp(s,im,(25,130,950,640))
 a=art(stem);stamp(s,a,(1010,130,550,640))
 label(s,(35,800),f'來源：{scene}',16)
 label(s,(35,850),'90px 主體高：',20);small=fit(a.crop(a.getbbox()),160,90);s.paste(small,(250,850),small)
 d.rectangle((1010,800,1560,970),fill='#120e11')
 da=art(stem) if stem.startswith('mirror') else pair(stem,PAPER)
 stamp(s,da,(1020,810,150,150),True)
 label(s,(1190,840),'深底顯示參考',20,fill='#ece3d4')
 label(s,(1190,880),'人物 line 染紙白；朱紅原色',16,fill='#ece3d4')
 label(s,(35,955),'並排僅供風格／輪廓評審；不是遊戲替換截圖。圖中標題不屬於素材本體。',17)
 s.save(ROOT/'對比'/f'{stem.replace("/","_")}-scene.png')
# Nine style studies with choice and exact ninety-pixel thumbnails.
s=Image.new('RGB',(1500,1830),'#ece3d4')
choices={'atan':'a','actor':'b','mirror':'c'}
for row,c in enumerate(['atan','actor','mirror']):
 for col,v in enumerate('abc'):
  x=col*500;y=row*610;im=Image.open(ROOT/f'draft/{c}_{v}.png').convert('RGBA')
  label(s,(x+20,y+15),f'{c} {v.upper()}'+('・選用' if choices[c]==v else ''),25)
  stamp(s,im,(x+20,y+65,460,410));stamp(s,im,(x+200,y+495,100,90),True)
s.save(ROOT/'對比/draft-selection.png')
# Formal thumbnails true 90px high; generated large preview separately.
s=Image.new('RGB',(1600,510),'#ece3d4')
label(s,(30,20),'全八張・90px 主體高／原尺寸像素觀看',27)
for i,(stem,title,_) in enumerate(items):
 x=i*200;a=art(stem);stamp(s,a,(x+15,100,170,90),True);label(s,(x+8,210),title.replace('・','\n'),17)
 d=ImageDraw.Draw(s);d.rectangle((x+5,300,x+195,490),fill='#120e11')
 a=art(stem) if stem.startswith('mirror') else pair(stem,PAPER);stamp(s,a,(x+15,335,170,90),True)
s.save(ROOT/'對比/readability-90px.png')
s=Image.new('RGB',(1600,1100),'#ece3d4')
for i,(stem,title,_) in enumerate(items):
 x=(i%4)*400;y=(i//4)*550;label(s,(x+15,y+15),title,22);stamp(s,art(stem),(x+10,y+55,380,475))
s.save(ROOT/'對比/final-overview.png')
# Registered makeup states and difference visualization.
s=Image.new('RGB',(1600,850),'#ece3d4');label(s,(25,20),'同一五官基底・三階段逐像素對齊',28)
for i,st in enumerate(['painted','half','clean']):
 stamp(s,art('mirror/'+st),(i*520+20,80,500,550));label(s,(i*520+25,650),st+' | 1024 × 1024',24)
label(s,(25,745),'黑線與外輪廓完全相同；只替換朱紅遮罩。半卸色塊為上妝遮罩的子集。',24)
s.save(ROOT/'對比/mirror-registration.png')
# New vs existing sampled production and locked drafts.
refs=[('crowd',n+'.png') for n in ['a01','a05','a06','a08','a13','b02_act','b03_idle','c05']]
refs += [('cards',n+'_line.png') for n in ['art_shenduan','art_woyu','art_fanshen','art_shuixiu','art_home_labor','art_changqiang']]
refs += [('draft',n+'.png') for n in ['rival_yuexian','rival_xiaofeng','rival_jinbao','sun_shifu']]
refs += [('deco',n+'.png') for n in ['chuanghua_03','chest_lid','lianpu_04','shoujiu']]
refs += [('ui','look_tired.png'),('night','layer_2_roofs.png')]
s=Image.new('RGB',(1800,1550),'#ece3d4');label(s,(30,20),'新圖 × 現有素材抽樣・同一木刻／剪紙語彙',32)
label(s,(30,80),'上排：本次八張；下方：既有 183 PNG 中抽樣 24 張（含同門像）',23)
for i,(stem,title,_) in enumerate(items):
 x=i*225;stamp(s,art(stem),(x+10,135,205,270));label(s,(x+5,420),stem,17)
for i,(group,name) in enumerate(refs):
 x=i%8*225;y=500+(i//8)*335;im=Image.open(ROOT.parents[0]/'assets_codex_20261110'/group/name).convert('RGBA')
 stamp(s,im,(x+10,y+5,205,260));label(s,(x+5,y+275),group+'/'+Path(name).stem,14)
s.save(ROOT/'對比/style-consistency-overview.png')
