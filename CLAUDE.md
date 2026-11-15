# 底色（game-dise）

## 專案放哪裡

- 工作副本放在 `~/Projects/game-dise`，GitHub 上的 repo 是正本。
- 不要把這個 repo 放進 iCloud Drive。iCloud 會把 `.git` 裡的檔案移到雲端，git 會逾時或損壞。
- Blender 原始檔、QA 截圖這類製作過程的素材放 iCloud，不進 repo。會進遊戲的成品才放進 repo。
- 單檔不要超過 100 MB（GitHub 上限）。

## 同步規則

git 操作由 Claude 處理，不需要使用者自己下指令。

- 開工前先執行 `git pull --ff-only`。
- 改完並確認能跑之後，commit 並 push 到 GitHub。
- pull 失敗或遠端有分歧時，先停下來用白話說明，不要 force push，也不要覆蓋遠端。
