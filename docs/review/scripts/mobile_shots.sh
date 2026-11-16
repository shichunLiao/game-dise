#!/bin/bash
# 在 repo 根目錄執行。只在暫存副本 _shot_start.html 加自動開局腳本，截完即刪，不改任何原檔。
# 需要 google-chrome。輸出：docs/review/out/mobile/
OUT=${OUT:-docs/review/out}/mobile
mkdir -p "$OUT"
ROOT=$(pwd)
INJ='<script>setTimeout(function(){try{if(window.setTutPref)setTutPref(false);startGame("小满")}catch(e){}},400)</script>'
for v in v1.7 v1.8-workbuddy; do
  cd "$ROOT/原型/$v"
  cp index.html _shot_start.html
  echo "$INJ" >> _shot_start.html
  for sz in 375x667 390x844 844x390; do
    w=${sz%x*}; h=${sz#*x}
    timeout 200 google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
      --allow-file-access-from-files --virtual-time-budget=3000 --force-device-scale-factor=2 \
      --window-size=$w,$h --screenshot="$ROOT/$OUT/${v}_${sz}_game.png" \
      "file://$PWD/_shot_start.html" >/dev/null 2>&1 || echo "fail $v $sz"
  done
  rm -f _shot_start.html
done
ls "$ROOT/$OUT"
