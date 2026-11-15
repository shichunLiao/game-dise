#!/bin/zsh
export https_proxy=http://127.0.0.1:2081 http_proxy=http://127.0.0.1:2081
NODE=/Users/tsun/.workbuddy/binaries/node/versions/22.22.2-6/bin/node
CLI=/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/dist/codebuddy-lite-wb.mjs
cd "/Users/tsun/Projects/game-dise/原型/v1.8-workbuddy"
$NODE $CLI "請閱讀並完成 TASK_WORKBUDDY.md 中的任務，全部用繁體中文回報。" -p --model kimi-k3.1-pro --effort high -y --max-turns 120 --add-dir ../assets ../assets_codex_20261110
