# V18 三張臉・美術審圖包

2026-11-15。內建 imagegen 生成；僅交美術，未接入遊戲。

先看 `對比/final-overview.png`、`對比/draft-selection.png`、`對比/style-consistency-overview.png`。

- `draft/`：三個角色各 A/B/C，1024×1024 RGBA，共九張。選阿檀 A、旦角 B、鏡臉 C；鏡臉正式妝形另修為收斂頰紅。
- `atan/`：seated 坐姿、reach 起身伸手、lowered 低頭，各 line / accent。
- `actor/`：standing 站姿、pose 亮相，各 line / accent。
- `mirror/`：painted 上妝、half 半卸、clean 卸淨，完整 RGBA 三張；另附共用 base、face_line、face_paper 和三張 accent 遮罩。
- `對比/`：八張新圖各一張場景並排，以及小樣選版、正式總覽、90px、鏡臉配準、風格抽樣，共十三張。
- `manifest.json`：28 張交付素材的逐檔尺寸、色值、透明範圍及 SHA-256。
- `work/`：原始生成、完整逐次提示詞、參考拼圖、匯出／審圖／驗證腳本及 audit.json，非正式素材目錄。

人物 line = 純黑 #000000，accent = 純朱紅 #A8202B，皆透明底、同畫布同位置。淺色衣身與臉的留白採透明鏤空，和卡面一致。深底需將 line 染成既有紙白 #ECE3D4；對比圖下方已示範。鏡臉另有實心紙白皮膚，背景透明。

本包是平面紙片角色圖，並非 3D 模型、骨架或動畫；依 V18 brief 不接遊戲。所有圖內均無文字；對比圖的標題和標籤僅供審圖。

報告：`設計/美術/V18_FACES_RESULT.md`。
