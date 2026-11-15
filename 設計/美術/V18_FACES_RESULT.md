# V18 三張臉交付結果

2026-11-15。已完成全部靜態美術交付，未接進遊戲、未 commit、未 push。

## 先看

- [八張正式圖總覽](../../原型/assets_codex_faces_20261115/對比/final-overview.png)
- [九張小樣與自選](../../原型/assets_codex_faces_20261115/對比/draft-selection.png)
- [新圖與既有素材風格並排](../../原型/assets_codex_faces_20261115/對比/style-consistency-overview.png)
- [90px 深／淺底檢查](../../原型/assets_codex_faces_20261115/對比/readability-90px.png)
- [鏡中臉三階段配準](../../原型/assets_codex_faces_20261115/對比/mirror-registration.png)

交付根目錄：`原型/assets_codex_faces_20261115/`。九張小樣、五個姿勢的十張分層圖、三張鏡臉及六張輔助層，共 **28 張素材 PNG**；另 **13 張對比 PNG**。所有正式／小樣素材均 1024×1024。

## 參考、前綴與選版

已閱讀 V18 brief、v2 生圖需求、CODEX_ART_RESULT、旦角第二版說明及 v0.3／v0.6／v1.x 角色設定，通看指定類別與原型截圖、第一版標註。現有目錄實際有 **183 PNG**（含小樣、分層），brief 的 162 為概數；風格總覽從中抽樣 24 張。

所有生成均使用 **P-v2**：原封沿用 `codex_生圖需求_v2.md` 的中英文風格前綴與反向詞。並以既有 crowd、同門木刻像拼圖作風格參照。色值實際取自既有檔案：黑 `#000000`（卡面 line 規格）、朱紅 `#A8202B`、紙白 `#ECE3D4`；沒有新增綠／粉／膚色。旦角造型沿用右衽、5.5 頭身方向、溜肩、長水袖、收腰長裙、珠串與單側梅花；3D 規格中的石綠在此依 V18 限色要求轉成黑／鏤空。

- **阿檀選 A**：黑衣大塊面、寬衣褶留白，接近 crowd/a05、a06 與同門像；紅只落髮簪和兩個扣結。B／C 紅裙或紅腰帶偏重。
- **旦角選 B**：雙袖舒展、長褶清楚，接近 art_shenduan／art_shuixiu；珠串與花飾密度接近 rival_xiaofeng。亮相延用同一衣飾。
- **鏡臉選 C 的臉型和髮線**：弧線刻法接近 rival_yuexian。小樣尖翼妝形過強，正式另生成卸淨基底與簡單頰紅，未採用尖翼妝形。

使用內建 imagegen，共 15 次生成／編輯；原始圖保存在 `work/*_raw.png`。完整逐次前綴、反向詞、主體敘述、參照與原始來源見 [prompts.json](../../原型/assets_codex_faces_20261115/work/prompts.json)。Python 僅負責尺寸統一、限定色匯出、分層遮罩、配準與對比拼版；不以程式繪製人物代替生成。

## 正式逐圖自查

下表每列的 line／accent 都是同畫布同位置透明 PNG。line 僅純黑，accent 僅朱紅；留白為透明鏤空，和卡面規格相同。深底審圖把 line 染為既有紙白，對比圖已示範。

| 主體／檔案 | 前綴 | 放大／色板 | 90px／並排觀察 |
|---|---|---|---|
| `atan/seated_line.png`、`atan/seated_accent.png` | P-v2 | 通過；純色、透明鏤空，無漸變／投影／寫實紋理 | 坐姿、雙手收於膝上；平靜等待；與觀眾髮髻黑塊一致。 |
| `atan/reach_line.png`、`atan/reach_accent.png` | P-v2 | 通過；純色、透明鏤空，無漸變／投影／寫實紋理 | 起身、右手往觀者左側伸出；無透視縮短；紅扣／髮簪與坐姿一致。 |
| `atan/lowered_line.png`、`atan/lowered_accent.png` | P-v2 | 通過；純色、透明鏤空，無漸變／投影／寫實紋理 | 垂眼低頭、雙手收中；安靜疲倦；衣褶和坐姿同一套刻法。 |
| `actor/standing_line.png`、`actor/standing_accent.png` | P-v2 | 通過；純色、透明鏤空，無漸變／投影／寫實紋理 | 溜肩、收腰、右衽、長褶、水袖與三列珠串；神情平靜。 |
| `actor/pose_line.png`、`actor/pose_accent.png` | P-v2 | 通過；純色、透明鏤空，無漸變／投影／寫實紋理 | 一手高一手低，袖形兩道弧；延續站姿服飾／梅花位置。 |
| `mirror/painted.png` | P-v2 | 通過；黑／紙白／朱紅限定色，外底透明 | 雙側眼上弧塊、頰紅與唇妝；平塗，非尖翼臉譜。 |
| `mirror/half.png` | P-v2 | 通過；黑／紙白／朱紅限定色，外底透明 | 觀者左側已卸，右側留弧塊與缺口頰紅；與上妝同一臉。 |
| `mirror/clean.png` | P-v2 | 通過；黑／紙白／朱紅限定色，外底透明 | 移除表面朱紅，露出共用紙白底色／五官；未另加數值化永久染色。 |

90px 主體高時，坐／伸手／低頭、站姿／亮相、上妝／半卸／卸淨可分辨；人物神情保持平靜或垂眼。旦角細小珠粒與眉眼細節仍以放大圖審看。視覺判斷為本輪自查，作者可直接由並排圖複核風格。

鏡臉採 **同一份 base.png** 組合三個妝色遮罩。半卸遮罩取生成半卸圖的紅區，並裁限為滿妝遮罩子集；黑線、皮膚、髮髻與外輪廓不動。不是三張獨立生成臉直接疊換。

## 每張素材清單

以下均相對交付根目錄；所有前綴為 P-v2（衍生層沿用其生成來源）。機器檢查均通過，RGBA、1024×1024、僅允許色與 0／255 alpha。輔助空遮罩 `clean_accent.png` 為刻意全透明。

| 檔案 | 前綴 | 匯出色值 | 自查 |
|---|---|---|---|
| `draft/actor_a.png` | P-v2 | #000000, #A8202B | 通過 |
| `draft/actor_b.png` | P-v2 | #000000, #A8202B | 通過 |
| `draft/actor_c.png` | P-v2 | #000000, #A8202B | 通過 |
| `draft/atan_a.png` | P-v2 | #000000, #A8202B | 通過 |
| `draft/atan_b.png` | P-v2 | #000000, #A8202B | 通過 |
| `draft/atan_c.png` | P-v2 | #000000, #A8202B | 通過 |
| `draft/mirror_a.png` | P-v2 | #000000, #A8202B | 通過 |
| `draft/mirror_b.png` | P-v2 | #000000, #A8202B, #ECE3D4 | 通過 |
| `draft/mirror_c.png` | P-v2 | #000000, #A8202B, #ECE3D4 | 通過 |
| `atan/lowered_accent.png` | P-v2 | #A8202B | 通過 |
| `atan/lowered_line.png` | P-v2 | #000000 | 通過 |
| `atan/reach_accent.png` | P-v2 | #A8202B | 通過 |
| `atan/reach_line.png` | P-v2 | #000000 | 通過 |
| `atan/seated_accent.png` | P-v2 | #A8202B | 通過 |
| `atan/seated_line.png` | P-v2 | #000000 | 通過 |
| `actor/pose_accent.png` | P-v2 | #A8202B | 通過 |
| `actor/pose_line.png` | P-v2 | #000000 | 通過 |
| `actor/standing_accent.png` | P-v2 | #A8202B | 通過 |
| `actor/standing_line.png` | P-v2 | #000000 | 通過 |
| `mirror/base.png` | P-v2 | #000000, #ECE3D4 | 通過 |
| `mirror/clean.png` | P-v2 | #000000, #ECE3D4 | 通過 |
| `mirror/clean_accent.png` | P-v2 | 全透明 | 通過 |
| `mirror/face_line.png` | P-v2 | #000000 | 通過 |
| `mirror/face_paper.png` | P-v2 | #ECE3D4 | 通過 |
| `mirror/half.png` | P-v2 | #000000, #A8202B, #ECE3D4 | 通過 |
| `mirror/half_accent.png` | P-v2 | #A8202B | 通過 |
| `mirror/painted.png` | P-v2 | #000000, #A8202B, #ECE3D4 | 通過 |
| `mirror/painted_accent.png` | P-v2 | #A8202B | 通過 |

小樣三版均保留以供回看；鏡臉尖翼妝只存在 draft，不在正式 mirror 目錄。`mirror/base.png` 與 `clean.png` 一致；face_line／face_paper 為共用黑線／紙白層；painted／half／clean_accent 為可檢視的妝色層。

## 對比檔案

每張正式圖都在對應既有截圖旁並排，保留原截圖，右側為新圖，附 90px 和深底參考。這是靜態風格審圖，並非已接入的遊戲截圖。早期 `原型_傍晚灯坊.png` 幾乎全黑，低頭圖改用現有 v17 傍晚 QA 截圖。

- `對比/actor_pose-scene.png`
- `對比/actor_standing-scene.png`
- `對比/atan_lowered-scene.png`
- `對比/atan_reach-scene.png`
- `對比/atan_seated-scene.png`
- `對比/draft-selection.png`
- `對比/final-overview.png`
- `對比/mirror-registration.png`
- `對比/mirror_clean-scene.png`
- `對比/mirror_half-scene.png`
- `對比/mirror_painted-scene.png`
- `對比/readability-90px.png`
- `對比/style-consistency-overview.png`

## 驗證與保護

- [manifest.json](../../原型/assets_codex_faces_20261115/manifest.json) 列每檔尺寸、色值、alpha、有效範圍與 SHA-256。
- [audit.json](../../原型/assets_codex_faces_20261115/work/audit.json)：28 張素材，0 項尺寸／色板／透明／分層問題；alpha 僅 0／255，沒有連續明暗。
- 三張鏡臉 alpha 完全一致；非妝區像素與基底完全一致；卸淨等於 base；半卸朱紅 5,024 px，滿妝 16,333 px，半卸是滿妝子集。
- 已目視九張小樣、八張正式總覽、90px 深淺底、八張場景並排及風格抽樣總覽。未見背景場景、投影、透視體積、文字、字母、數字或水印混入素材。
- 開工前保存的 **258 個原素材／截圖／原型 v*/ 檔案雜湊，交付時變化 0**。未覆蓋既有 assets_codex_20261110；assets_compare/before 此工作副本不存在，未建立或寫入。
- 未操作其他專案、其他本機會話、版本控制同步或遊戲程式。原先未追蹤的 v1.8-workbuddy 與日誌保留原狀。

此次交付的是平面角色美術與審圖資料，不含 3D 模型、骨架、動畫或遊戲接線；範圍依 V18 brief。
