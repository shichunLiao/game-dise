# 任務：做出《底色·戲城》v1.6（接入 Codex V2 美術）

在 `/Users/tsun/Projects/game-dise` 完成。規則數值與 v1.5／v1.3 完全相同，這一版只把已生成的 V2 圖接進遊戲。

不要改 `原型/v1.5/` 裡的檔。不要 push。不要刪 `原型/assets_codex_20261110/`（那是生圖原件，可複製，不可當唯一一份搬走）。不要把 `原型/assets_compare/`、`原型/v0.7_本地未提交_20261110-2100/`、根目錄 `原型截圖/`、`tools/`、`CLAUDE.md` 加進版本。做完後寫 `設計/美術/V16_RESULT.md` 與過程進度 `設計/美術/V16_PROGRESS.md`。工作結束時不要等人確認，自行收尾。

## 現況

- 本機已快轉到 GitHub `main`：`e1c5fd6`（含 v1.1–v1.5）。目前最新可玩版本是 `原型/v1.5/index.html`。
- v1.5 的卡面、觀眾、牌背、特效仍是程式畫的 Canvas／Three.js，沒有引用任何 PNG。
- Codex V2 候選圖已全部生成（183 張 PNG，約 2.9 MB），在 `原型/assets_codex_20261110/`，`manifest.json` 標 `complete_candidate_not_integrated`。作者已決定把這批圖接入遊戲。
- 清單與對照見 `設計/美術/codex_生圖需求_v2.md`、`設計/美術/美術規劃.md`（尤其「紙片怎麼進 3D」與「接進遊戲要注意的一件事」）。

## 要做的事

1. **建立 v1.6 目錄**  
   複製 `原型/v1.5/index.html` 與 `原型/v1.5/check_engine.js` 到 `原型/v1.6/`。規則引擎不必改邏輯（核對仍應通過）。頁面標題改成能看出是 v1.6。

2. **正式美術庫**  
   按美術規劃，把要用的圖複製到 `原型/assets/` 對應子目錄（`cards/`、`crowd/`、`deco/`、`relics/`、`ui/`、`fx/`、`night/`、`draft/`）。不要改圖內容。v1.6 從 `原型/assets/` 載入，不要只依賴 `assets_codex_20261110` 這條臨時路徑。

3. **接入卡面**  
   改 `drawStageFace`／`drawHomeFace`／`drawGiftFace`／`drawBack`（或等價流程）：
   - 卡紙用 `cards/paper_01.png`–`paper_04.png` 當底（可依牌或族輪換），邊框用 `border_stage.png`／`border_home.png`。
   - 台上插圖：`cards/art_<id>_line.png` 再疊 `cards/art_<id>_accent.png`。`<id>` 與 `const T` 的鍵一致（如 `changqiang`、`jie_kutou`）。
   - 家裡面那一面：用 `art_home_listen`／`art_home_comp`／`art_home_care`／`art_home_labor`（對應 `FAM[f].home`）。家常牌（`tang`／`fan`／`xin`／`zhi`）用對應 `art_*`。借來的牌家裡面若是空白，不要硬貼插圖。
   - **牌名、金數、族、關鍵詞等文字仍由程式寫**，圖上沒有字。
   - 牌背用 `cards/back.png`。
   - 圖載入失敗時，退回 v1.5 的程式繪製，不要空白牌。

4. **接入觀眾**  
   `buildCrowd` 不要再用 `silhouetteCv` 當正式外觀。使用 `crowd/a01.png`–`a16.png`、`b01`–`b08` 的 idle／act、`c01`–`c08`。b 組平常 idle，叫好／起伏時可切 act。紙片用透明平面、基本不受場景光照吃掉（MeshBasicMaterial 或等價；亮度只在約 85%–100% 間微調），影子加在紙外，不要讓圖發黃發黑。

5. **接入其餘已有的圖**（有對應位置就接，不要為了沒畫的角色硬編）  
   - 裝飾：`deco/`（窗花、地毯、燈紙、臉譜、箱蓋、壽酒等）放到場景裡合適位置。  
   - 後台物件圖示：`relics/` 對上 `RELICS`（`qinshi` 琴師、`gujing` 鑼鼓經、`cha` 護嗓茶、`lian` 妝奩、`jin` 熟手巾、`you` 燈油、`luo` 小鑼），各有 line／accent。  
   - 界面：`ui/` 的神情、燈芯（亮／熄）、痕、印章、紙面板、筆劃，接到現有 UI（燈、痕、她的樣子、需要高亮等）能對上的地方。  
   - 特效：`fx/` 接到連擊／倒彩（金箔、紙屑、彩綢、墨點、燒紙）。  
   - 夜景：`night/` 四張分層用在夜晚／守夜場景。  
   - 同門與孫師父：`draft/rival_*.png`、`draft/sun_shifu.png` 若界面已有這些人，就換上；沒有則不必新做一整頁。  
   - 這一包**沒有**阿檀／玩家紙片人，人物 3D 與鏡中臉保持 v1.5 的程式繪製，不要用觀眾圖或其他圖冒充。

6. **能打開來玩**  
   美術規劃寫過：`file://` 下 WebGL 貼圖會被瀏覽器擋住。請同時做到：
   - 用相對路徑從 `原型/assets/` 載入，並在 README 寫明用本機伺服器打開（例如在專案根目錄 `python3 -m http.server`，再開 `/原型/v1.6/index.html`）。
   - 再做一個打包步驟，把用到的圖內嵌，產出仍可雙擊遊玩的單檔（例如 `原型/v1.6/index.packed.html`）。圖總量約 2.9 MB，單檔變大可接受。若你判斷只維護單檔更乾淨，說明原因，但至少要有一種雙擊能玩、一種方便除錯的方式。

7. **文件**  
   寫 `設計/v1.6_戲城_美術接入.md`：規則同 v1.5，本版做了哪些接入、怎麼打開、哪些圖還沒有（例如阿檀紙片）所以沿用舊畫法。更新根目錄 `README.md` 的目錄表與執行說明。

8. **核對**  
   跑 `node 原型/v1.6/check_engine.js`，應與 v1.5 一樣通過。把卡面 31 組、家裡面 4 組、牌背、觀眾 40 張、物件 7 組是否都對上寫進結果檔。列出沒接到的圖與原因。

## 不要做

- 不要改數值、規則、引導流程（除非為了顯示新圖必須動 DOM／Three 節點）。
- 不要重畫或用程式生成替代圖去「補」沒有的阿檀／角色紙片。
- 不要 push。若要本機 commit：只提交 v1.6、`原型/assets/`（正式庫）、設計文件與 README 更新；commit message 用中文，格式靠近現有「新增 v1.6 ……」。作者資訊沿用倉庫現有設定即可。
- 不要把對比圖、舊備份、過程 QA 圖提交進去。

## 進度

過程寫在 `設計/美術/V16_PROGRESS.md`（時間、狀態、百分比、正在做什麼）。完成後寫 `設計/美術/V16_RESULT.md`。
