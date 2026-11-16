# 底色（game-dise）專案狀態（唯一主檔）

> **這是底色進度的唯一主檔。** 群組「底色 · 戲城」只貼變動或連到這裡。
> 最後核對：2026-11-16 15:35（Asia/Shanghai），由「創作」核對 GitHub main @ `a8feb05`，並在共用電腦的乾淨 clone 重跑檢查。Mac 本機未提交改動、WorkBuddy App 執行紀錄 **未核對**。
> **本檔目前只在 PR #1 分支，尚未合併進 main**；合併需助理讀回、士淳同意。
> 時間一律為 Asia/Shanghai 絕對日期。

## 打勾規則
- `[x]` 只用於**士淳已驗收**。寫完或已 push 但士淳還沒看 → `[ ]`「待驗收」。遠端 commit ≠ 試玩驗收；檔案存在 ≠ 驗收通過。

## 專案目標與里程碑
- 目標：單人策略卡牌遊戲「底色」的可玩網頁原型，逐版改良（設計稿在 `設計/`，原型在 `原型/vX.Y/`）。
- 里程碑與截止日：**未記錄，待士淳確認**（目前沒有任何已承諾期限）。

## 編號說明
本 repo 原本沒有任務編號，自 2026-11-16 起用 `DS-n`（討論用編號，不是系統任務 ID；不與 Nowduni 的 B／D／P 重複）。

## 打勾清單
- [ ] DS-1 v1.7 原型 — 待驗收
- [ ] DS-2 v1.8 Codex 臉部圖 — 待士淳美術驗收
- [ ] DS-3 WorkBuddy／Kimi 試改副本 v1.8-workbuddy — 部分完成，未達驗收（見下方查證）
- [ ] DS-4 Codex／WorkBuddy 兩線採用方式 — 待士淳決策

## 明細表
負責：士淳＝決定與試玩驗收；創作＝寫任務說明、核對證據；Codex＝美術；Claude Code／WorkBuddy＝程式修改。

| ID | 工作 | 核准 | 負責 | 狀態 | 開始日 | 期限（性質） | 依賴 | 交付物 | 驗收條件（可驗證） | 證據 |
|---|---|---|---|---|---|---|---|---|---|---|
| DS-1 | v1.7 原型 | 已核准 | 創作→Claude Code | 待驗收 | 未記錄 | 無承諾 | — | `原型/v1.7/index.html`、`index.packed.html` | 士淳試玩一輪；已知問題（新貨無圖、手機少數遮擋）轉 DS-3 處理 | [15785a2](https://github.com/shichunLiao/game-dise/commit/15785a2e3905b372b1d55d4074c2eed214d114c4)（2026-11-15 11:26） |
| DS-2 | v1.8 Codex 臉部圖（阿檀 3、旦角 2、鏡中臉 3）；採 B 紙片立牌 | 已核准（畫圖、B 方案） | Codex | 待士淳美術驗收；立牌接線未放行 | 2026-11-15 | 無承諾 | — | `原型/assets_codex_faces_20261115/`、`設計/美術/V18_FACES_RESULT.md` | 士淳看過並排對比圖，逐張決定採用／重畫 | [a8feb05](https://github.com/shichunLiao/game-dise/commit/a8feb05875b54b9e7440d326541a1d59d1341186)（2026-11-15 22:49） |
| DS-3 | WorkBuddy（Kimi K3.1 Pro）試改：補缺圖、修手機遮擋、美化介面 | 士淳同意試用（原始訊息未取得） | 士淳在 WorkBuddy App 操作；創作核對 | 部分完成，未達驗收 | 未記錄 | 無承諾 | WorkBuddy 執行完成 | `原型/v1.8-workbuddy/RESULT_WORKBUDDY.md`、`art_kimi/`、`index.packed.html` | ① `check_engine.js` 無新錯誤 ② `node pack.js` 成功且產物與遠端一致 ③ 375×667、390×844、橫向無遮擋 ④ 附缺圖清單與修正說明 ⑤ 玩法與數值未變 ⑥ 士淳看過新舊對比 | 見下方「DS-3 查證」 |
| DS-4 | 決定 Codex／WorkBuddy 兩線的採用方式 | **待士淳決策** | 士淳決定 | 未開始 | — | 無承諾 | DS-2、DS-3 | 決定紀錄 | 士淳明確寫下採用方式；在此之前不合併、不刪除、不預設只留一線 | — |

### DS-3 查證（2026-11-16 15:35，main @ `a8feb05`，共用電腦乾淨 clone）
| # | 條件 | 結果 | 證據 |
|---|---|---|---|
| ① | `check_engine.js` 無新錯誤 | ✅ 通過：輸出「全部通过」，與 `check-baseline.log` 逐字相同；`check_engine.js` 與 v1.7 相同，v1.7 跑出的模擬結果也逐字相同 | 本節重現指令 |
| ② | `node pack.js` 成功且產物一致 | ⚠️ 能跑成功（內嵌 172 張：162 PNG＋10 SVG），**但遠端 `index.packed.html` 過期**：`art_kimi/art_shuaifa_line.svg` 與內嵌版本不同（打包後 SVG 又改過）；其餘 171 張與頁面文字一致 | 遠端 sha256 `30daac09…`，重打包 `595ad67e…` |
| ③ | 手機三種尺寸無遮擋 | ❌ 未修：`index.html` 相對 v1.7 只改 22 行，全是新貨圖載入（`USE_KIMI_SVG`／`artLayer`／`artSrc`），版面 CSS 未動 | `diff 原型/v1.7/index.html 原型/v1.8-workbuddy/index.html` |
| ④ | 缺圖清單與修正說明 | ❌ 缺：沒有 `RESULT_WORKBUDDY.md` | 目錄列表 |
| ⑤ | 玩法與數值未變 | ✅ 引擎與模擬結果和 v1.7 相同（以 check_engine 涵蓋範圍為限） | 同① |
| ⑥ | 士淳看過新舊對比 | ⏳ 未進行；10 個 SVG 已接進遊戲（5 項新貨 × line／accent），風格是否一致待士淳看 | `art_kimi/`、`*-preview.jpg` |

- `workbuddy.log` 只有 78 bytes：「Authentication required」，是命令列登入失敗，**不能當 App 內任務成功或失敗的證據**。`art_kimi/` 由誰、何時產生仍待士淳回報。

**重現方式（任何有 node 的機器）：**
```
git clone https://github.com/shichunLiao/game-dise.git && cd game-dise && git checkout a8feb05
cd 原型/v1.8-workbuddy
node check_engine.js > /tmp/after.log; cmp check-baseline.log /tmp/after.log && echo 同基準
sha256sum index.packed.html; node pack.js; sha256sum index.packed.html   # 兩次不同＝遠端打包過期
diff ../v1.7/index.html index.html    # 只有新貨圖載入，沒有手機版面修改
```

## 待士淳決策
1. DS-2：Codex 臉部圖逐張採用／重畫；採用後是否放行立牌接線。
2. DS-3：WorkBuddy 只交了新貨圖，手機遮擋與結果說明沒做——要再讓它補，還是改交 Claude Code 只做手機遮擋。
3. DS-4：兩線採用方式（不預設只留一線）。
4. 底色是否有展示／投稿等截止日（目前無紀錄）。

## 其他文件用途
- `README.md`：玩法介紹、目錄、各版本怎麼打開（說明文件，不是進度清單）。
- `設計/vX.Y_*.md`：各版設計稿（史料）。
- `原型/v1.8-workbuddy/TASK_WORKBUDDY.md`：單次任務說明；進度以本檔為準。

## 變更紀錄
- 2026-11-16 15:35 創作：DS-3 補重跑證據（check 通過、打包過期一張、手機遮擋未修、缺 RESULT）；DS-4 移除「只留一條主線」與「回報後 2 天內」（未經士淳批准）；標明本檔尚未合併。
- 2026-11-16 14:35 創作：建立本檔，整合三群清單草案中的 DS-1～DS-4；更正 v1.7 已 commit、v1.8-workbuddy 已在遠端。
