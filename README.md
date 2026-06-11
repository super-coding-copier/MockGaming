# ⚽ 2026 世界杯 · 胜平负竞猜 App

一个用 **积分**（非真实货币）竞猜 2026 世界杯小组赛胜平负的移动端原型，现代体育潮流风格，支持多用户登录、实时奖金计算与积分排行榜。

> **仓库**：[MockGaming](https://github.com/super-coding-copier/MockGaming)

---

## ✨ 功能

- **多用户登录 / 注册** — 内置 12 个体验账号，支持注册新账号，登录态本地持久化
- **真实小组赛赛程** — 2026 世界杯首轮 24 场比赛（全 12 组 A–L），含日期、北京时间、举办城市
- **胜平负竞猜** — 单关 / 串关（自动 N 串 1），点击赔率高亮选中
- **实时奖金计算** — 滑动注额即时换算「预计可中积分」
- **积分制** — 每个账号独立积分，投注扣分、记录留存（`data.json` 文件存储）
- **积分排行榜** — 领奖台 Top 3、我的排名、好友榜
- **我的页面** — 投注记录、统计、切换 / 退出账号
- **可调主题（Tweaks）** — 主色、iOS / Android 机身、赔率格式（小数 / 分数）

---

## 🔐 数据存储

用户数据（账号、积分、投注记录）存储在项目根目录的 **`data.json`** 文件中，通过 Python 后端提供 REST API 进行读写。登录态（`wc_session_v1`）仍保留在浏览器 `localStorage` 中。

| 真实 App | 本原型的模拟方式 |
|---|---|
| 注册（手机号 + 验证码 / 三方登录） | 用户名 + 密码注册，写入 `data.json` |
| 密码哈希存数据库 | 演示用明文存储（**生产环境务必哈希，如 bcrypt**） |
| 服务器签发 token / session | 登录后写入 `localStorage` 的 `wc_session_v1` |
| 数据按 user_id 隔离 | 每个账号的积分、投注记录独立存储互不干扰 |
| 登录态持久化 | 刷新 / 重开自动登录，退出即清除 |

**体验账号**：用户名见登录页「快速体验账号」，密码统一 `123456`。

---

## 📊 关于赔率

赔率以**中国体育彩票「竞彩足球 · 模拟试玩」胜平负**的格式与量级呈现，数值为基于球队实力的**模拟校准值**（`wc-data.js` 中维护）。真实盘口实时变动，正式使用时请对接官方数据。本项目为设计原型，不涉及任何真实投注或货币。

---

## 🚀 本地运行

### 启动后端

```bash
python3 server.py
```

> 纯 Python 标准库，无需 `pip install`。服务启动后自动在项目目录创建 `data.json`（首次运行含 12 个种子账号）。

### 访问

浏览器打开 `http://localhost:8000`。

> React / Babel 走 CDN，需联网。

## 🌐 部署到 GitHub Pages

由于 Pages 是纯静态托管，不支持后端写入 `data.json`。如需在线使用，建议：

1. 将 `server.py` 部署到支持 Python 的云服务（如 Railway、Render、Fly.io）
2. 或使用原版 `localStorage` 模式（见 `wc-store.jsx` 的 git 历史）

---

## 🧱 技术栈

- **前端**：React 18 + Babel Standalone（浏览器内编译 JSX，零构建）
- **样式**：原生 CSS（`wc-styles.css`），字体 Space Grotesk + Archivo
- **后端**：Python 标准库 HTTP Server（`server.py`），REST API
- **持久化**：`data.json` 文件存储（用户 / 积分 / 投注），`localStorage` 仅存登录态
- **无需 npm / pip 依赖**

## 📁 文件结构

```
index.html         入口 + Tweaks 面板 + 设备机身装配
server.py          Python 后端（静态服务 + REST API）
data.json          用户数据库（首次运行自动生成）
wc-data.js         48 队色卡 · 24 场赛程 · 赔率 · 体验账号
wc-store.jsx       登录 / 注册 / 下注（fetch API 调用后端）
wc-ui.jsx          赔率格式化 · 徽章 · 数字滚动等工具
wc-login.jsx       登录 / 注册页
wc-bet.jsx         竞猜页（赛程 · 分组筛选 · 投注单）
wc-rank.jsx        积分榜
wc-profile.jsx     我的（投注记录 · 切换账号）
wc-app.jsx         App 壳 + 底部导航
wc-styles.css      全部样式
ios-frame.jsx / android-frame.jsx / tweaks-panel.jsx   预览脚手架
```

---

## ⚠️ 免责声明

本项目仅为 **UI / 交互设计原型**，使用虚拟积分，**不涉及真实金钱投注**。请遵守所在地区法律法规，理性对待竞猜娱乐。
