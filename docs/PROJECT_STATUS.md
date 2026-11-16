# 底色（game-dise）專案狀態（唯一主檔）

> **這是底色進度的唯一主檔。** 群組「底色 · 戲城」只貼變動或連到這裡。
> 最後核對：2026-11-16 14:35（Asia/Shanghai），由「創作」只讀 GitHub 核對（main @ `a8feb05`）。Mac 本機未提交改動、WorkBuddy App 執行紀錄 **未核對**。
> 時間一律為 Asia/Shanghai 絕對日期。

## 打勾規則
- `[x]` 只用於**士淳已驗收**。寫完或已 push 但士淳還沒看 → `[ ]`「待驗收」。遠端 commit ≠ 試玩驗收。

## 專案目標與里程碑
- 目標：單人策略卡牌遊戲「底色」的可玩網頁原型，逐版改良（設計稿在 `設計/`，原型在 `原型/vX.Y/`）。
- 里程碑與截止日：**未記錄，待士淳確認**（目前沒有任何已承諾期限）。

## 編號說明
本 repo 原本沒有任務編號，自 2026-11-16 起用 `DS-n`（不與 Nowduni 的 B／D／P 重複）。

## 打勾清單
- [ ] DS-1 v1.7 原型 — 待驗收
- [ ] DS-2 v1.8 Codex 臉部圖 — 待驗收
- [ ] DS-3 WorkBuddy／Kimi 試改副本 v1.8-workbuddy — 進行中（待查證）
- [ ] DS-4 決定 v1.8 主線（Codex 美術 vs WorkBuddy 副本）— 待士淳決策

## 明細表
負責：士淳＝決定與試玩驗收；創作＝寫任務說明、核對證據；Codex＝美術；Claude Code／WorkBuddy＝程式修改。

| ID | 工作 | 核准 | 負責 | 狀態 | 開始日 | 期限（性質） | 依賴 | 交付物 | 驗收條件（可驗證） | 證據 |
|---|---|---|---|---|---|---|---|---|---|---|
| DS-1 | v1.7 原型 | 已核准 | 創作→Claude Code | 待驗收 | 未記錄 | 無承諾 | — | `原型/v1.7/index.html`、`index.packed.html` | 士淳試玩一輪；已知問題（新貨無圖、手機少數遮擋）轉 DS-3 處理 | [15785a2](https://github.com/shichunLiao/game-dise/commit/15785a2e3905b372b1d55d4074c2eed214d114c4)（2026-11-15 11:26） |
| DS-2 | v1.8 Codex 臉部圖與美術任務記錄 | 已核准 | Codex | 待驗收 | 未記錄 | 無承諾 | — | `原型/assets_codex_faces_20261115/` | 士淳看過美術並決定是否採用 | [a8feb05](https://github.com/shichunLiao/game-dise/commit/a8feb05875b54b9e7440d326541a1d59d1341186)（2026-11-15 22:49） |
| DS-3 | WorkBuddy（Kimi K3.1 Pro）試改：補缺圖、修手機遮擋、美化介面 | 士淳同意試用 | 士淳在 WorkBuddy App 操作；創作核對 | 進行中（待查證） | 未記錄 | 無承諾 | WorkBuddy 執行完成 | `原型/v1.8-workbuddy/RESULT_WORKBUDDY.md`、`art_kimi/`、`index.packed.html` | ① `check_engine.js` 無新錯誤 ② `node pack.js` 成功 ③ 375×667、390×844、橫向無遮擋 ④ 附缺圖清單 ⑤ 士淳看過新舊對比 | 遠端已有副本（見下方「DS-3 查證」） |
| DS-4 | 決定 v1.8 主線與合併方式 | **待提案** | 士淳決定 | 未開始 | — | DS-3 回報後 2 天內（建議） | DS-2、DS-3 | 決定紀錄 | 只留一條 v1.8 主線，版本號與存檔鍵不衝突 | — |

### DS-3 查證（2026-11-16 14:35，GitHub main @ `a8feb05`）
- 副本 `原型/v1.8-workbuddy/` **已在遠端**（隨 a8feb05 推上；更正：先前說「不在遠端」有誤）。
- 已有：`TASK_WORKBUDDY.md`、`art_kimi/` 10 個 SVG（shuaifa、shuaya、bangu、xiangfen、zhezi 各 line／accent 兩張）、`index.html`、`index.packed.html`、`check-baseline.log`（基準「全部通过」）。
- **沒有** `RESULT_WORKBUDDY.md`；`workbuddy.log` 只記錄命令列登入失敗。
- 因此：`art_kimi/` 由誰、何時產生，以及 App 內執行是否完成，**待查證**（需 Mac 本機或士淳回報）。不能打勾。

## 待士淳決策
1. DS-4：v1.8 主線採哪條。
2. 底色是否有展示／投稿等截止日（目前無紀錄）。

## 其他文件用途
- `README.md`：玩法介紹、目錄、各版本怎麼打開（說明文件，不是進度清單）。
- `設計/vX.Y_*.md`：各版設計稿（史料）。
- `原型/v1.8-workbuddy/TASK_WORKBUDDY.md`：單次任務說明；進度以本檔為準。

## 變更紀錄
- 2026-11-16 14:35 創作：建立本檔，整合三群清單草案中的 DS-1～DS-4；更正 v1.7 已 commit、v1.8-workbuddy 已在遠端。
