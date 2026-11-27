# 《戏城》更名与界面修复截图

本目录记录 2026-11-27 的回归场景。`before-home-marker-owner.jpg` 与 `before-yuan-owner.jpg` 是主人反馈的原始截图；其余 before／after 图由 Playwright + Google Chrome 在同一分支改动前后截取。

| 场景 | 修改前 | 修改后（桌面） | 修改后（手机 390×844） |
|---|---|---|---|
| 作品名 | `before-title-desktop.png`／`before-title-mobile.png` | `after-title-desktop.png` | `after-title-mobile.png` |
| 手牌「家」印章 | `before-home-marker-owner.jpg` | `after-home-markers-desktop.png` | `after-home-markers-mobile.png` |
| 元宵说明层 | `before-yuan-owner.jpg` | `after-yuan-desktop.png` | `after-yuan-mobile.png` |
| 后台面板 | — | `after-shop-desktop.png` | `after-shop-mobile.png` |

自动验证由 `node 原型/v1.9/check_ui.js` 执行，覆盖 1366×768、1024×640、390×844 三档视口，并同时检查 `index.html` 与 `index.packed.html`。它逐枚验证「家」印章的文字与命中层级，量测元宵层和后台面板是否留在视口内、是否与家栏／后台按钮／手牌相交，并确认旧存档键仍为 `dise-v19`。
