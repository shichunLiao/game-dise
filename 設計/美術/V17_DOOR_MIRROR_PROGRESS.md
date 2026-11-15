# v1.7 手机直屏「门口卸妆」镜子被挡 · 进度

- [x] 读 brief，看证据图 `feedback_v17/qa_mobile/06_door_390x844.png`
- [x] 复现：门口、脸上 3 层油彩、阿檀伸手（`qa_mobile_door/00_before_door_390x844_paint.png`）
- [x] 新增 `VIEWS.doorP`，在门口 + 直屏手机时启用
- [x] 窄于 390×844 的手机按比例略拉远
- [x] 顺手修夜里：新增 `VIEWS.nightP`
- [x] 直屏毛巾擦脸动画按画面宽度缩窄
- [x] 截图：四个直屏尺寸、镜子特写（擦前、擦后、卸干净）、毛巾三帧、桌面、横屏、夜里、早晨回归、packed 版
- [x] `node check_engine.js` 全部通过
- [x] `node pack.js` 已重打，并用本机服务器开 packed 版确认生效
- [x] 写 RESULT

状态：完成。未 commit、未 push。
