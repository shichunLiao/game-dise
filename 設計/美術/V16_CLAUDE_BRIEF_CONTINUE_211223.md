# 續做：《底色·戲城》v1.6 美術接入（2026-11-12 21:23 再接）

這是續做，不是重來。專案在 `/Users/tsun/Projects/game-dise`。完整任務見 `設計/美術/V16_CLAUDE_BRIEF.md`，請仍按那份清單做完未完成的部分。

先前 Claude Code（session `5e9394c0`）在 2026-11-12 13:18（Asia/Shanghai）因代理連線中斷（API Error: ECONNRESET）停掉。請從現況接著做，不要重做已完成的部分，不要 push。

## 已完成（請先核對後沿用，不要重做）

- `原型/v1.6/` 已建（自 v1.5 複製 `index.html`、`check_engine.js`）。頁面標題已是「底色·戏城 v1.6 美术接入」。
- 正式美術庫 `原型/assets/` 已就緒：162 張（cards 69、crowd 40、deco 12、relics 14、ui 12、fx 5、night 4、draft 6），SHA-256 與原件一致。風格小樣不進正式庫。
- 已加載圖模組 `artLoad()`：`ART_DIR='../assets/'`，打包單檔可走 `window.__ART`；載入失敗或 `file://` 被擋時退回 v1.5 程式繪製。
- 卡面已接入並檢查：`drawStageFace`／`drawHomeFace`／`drawGiftFace`／`drawBack`（紙紋、邊框、台上插圖、家裡面、家常牌、牌背；文字仍由程式寫）。
- 觀眾已接入：`buildCrowd` 在圖可用時走 `buildCrowdArt`（`crowd/a01`–`a16`、`b*_idle`／`b*_act`、`c01`–`c08`；紙片 MeshBasicMaterial，亮度約 85%–100%；失敗則 `crowdFallback`）。不要重做觀眾。
- `index.html` 最後寫入時間約 12:44。`deco/`、`relics/`、`fx/`、`night/` 目前多半只出現在預載清單 `ART_FILES`，尚未放到場景／界面裡。

## 接下來從這裡繼續

從場景裝飾接著做，不要回頭改已接好的卡面與觀眾（除非核對發現明顯錯誤）。

1. 裝飾：把 `deco/`（背景／地毯、窗花、臉譜、燈紙、箱蓋、壽酒等）放到場景裡合適位置。
2. 後台物件：`relics/` 對上 `RELICS`（琴師、鑼鼓經、護嗓茶、妝奩、熟手巾、燈油、小鑼），各有 line／accent。
3. 界面：`ui/` 的神情、燈芯（亮／熄）、痕、印章、紙面板、筆劃，接到現有 UI 能對上的地方。
4. 特效：`fx/` 接到連擊／倒彩（金箔、紙屑、彩綢、墨點、燒紙）。
5. 夜景：`night/` 四張分層用在夜晚／守夜場景。
6. 同門與孫師父：`draft/rival_*.png`、`draft/sun_shifu.png` 若界面已有這些人，就換上；沒有則不必新做一整頁。沒有阿檀／玩家紙片，人物 3D 與鏡中臉保持 v1.5 程式繪製。
7. 本機伺服器打開方式寫進 README；再做可雙擊的 `原型/v1.6/index.packed.html`（或說明只維護哪一種）。
8. 寫 `設計/v1.6_戲城_美術接入.md`，更新根目錄 `README.md`。
9. 跑 `node 原型/v1.6/check_engine.js`，應與 v1.5 一樣通過。
10. 更新 `設計/美術/V16_PROGRESS.md`（過程中就要更新百分比與正在做什麼）；完成後寫 `設計/美術/V16_RESULT.md`。結果檔需寫明卡面 31 組、家裡面 4 組、牌背、觀眾 40 張、物件 7 組是否都對上，並列出沒接到的圖與原因。

## 不要做

- 不要改 `原型/v1.5/`。不要改規則數值與引導流程（除非為了顯示新圖必須動 DOM／Three 節點）。
- 不要刪 `原型/assets_codex_20261110/`，不要只用那條臨時路徑載圖。
- 不要用觀眾圖或其他圖冒充阿檀／玩家紙片；沒有的角色紙片沿用 v1.5 程式繪製。
- 不要 push。若要本機 commit：只提交 v1.6、`原型/assets/`、設計文件與 README；不要提交對比圖、舊備份、過程 QA、`tools/`、`CLAUDE.md`、Claude 日誌。
- 不要動桌面上正在跑的 Claude.app 行程。
- 工作結束時不要等人確認，自行收尾。
