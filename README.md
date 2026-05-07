# 🌸 Personal Website (Mizuki + Admin Backend)

A personal blog and homepage built on top of the [Mizuki](https://github.com/LyraVoid/Mizuki) Astro template, extended with a full **admin backend** for content management — posts, photo albums, diary, anime list, friend links, footprints, timeline, skills, announcements, site settings, security, and more.

[![Node.js >= 22](https://img.shields.io/badge/node.js-%3E%3D22-brightgreen)](https://nodejs.org/)
[![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue)](https://pnpm.io/)
[![Astro](https://img.shields.io/badge/Astro-6.1.2-orange)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg?logo=apache)](https://opensource.org/licenses/Apache-2.0)

🖥️ **Live site:** <https://blog.lixuwei.com>

---

## English

### ✨ What's different from upstream Mizuki

The upstream Mizuki template is purely static — content lives in markdown files committed to git. This fork keeps the original frontend but adds a database-backed **admin panel** so the site can be managed entirely from the browser, then re-built and re-deployed automatically.

**Admin pages (`/admin/*`):**

- **Posts** — create / edit / delete blog posts with a rich editor, tags, cover images, attachments, and local video / markdown embeds
- **Albums** — organize photo albums and upload images directly
- **Diary** — short social-media-style moments
- **Anime** — track watching progress, ratings, and metadata
- **Friends** — manage friend-link cards
- **Footprints** — places visited, with map options
- **Timeline** — life timeline entries
- **Skills** — skills / tech-stack showcase
- **Projects** — personal projects list
- **Tools** — useful-tools collection
- **Announcements** — site-wide announcement bar with settings
- **Site settings** — update site title, subtitle, banner, theme color, profile, etc. without touching code
- **Profile** — edit the "About" / personal-info pages
- **Security** — change admin password, view access logs
- **Devices** — registered device management

**Backing API:** every admin page is served by routes under `src/pages/api/admin/*`, with login/logout, session auth, file upload (images, fonts, music), and a one-click rebuild trigger.

### 🎨 Inherited from Mizuki

- Built with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com) + Svelte
- Smooth page transitions via [Swup](https://swup.js.org/)
- Light / dark theme with system-preference detection, configurable theme color
- Banner carousel, fully responsive layout
- Pagefind-powered full-text search
- Enhanced Markdown: callouts, KaTeX math, code highlighting via [Expressive Code](https://expressive-code.com/), GitHub repo cards, PhotoSwipe gallery
- RSS feed, sitemap, SEO meta tags, reading-time estimation
- Twikoo comment integration
- Special pages: Anime, Friends, Diary, Archive, About

### 🚀 Quick start

```bash
# 1. Clone
git clone <your fork url>
cd personal-website

# 2. Install dependencies (pnpm only)
npm install -g pnpm
pnpm install

# 3. Configure
#    - edit src/config.ts for site title, theme, banner, social links
#    - copy .env.example to .env and set the admin password / secrets
cp .env.example .env

# 4. Run dev server
pnpm dev          # http://localhost:4321
#    Admin panel:  http://localhost:4321/admin/login
```

### 📦 Build & deploy

```bash
pnpm build        # output: ./dist
pnpm preview      # preview the build locally
pnpm start        # run the SSR server entry (dist/server/entry.mjs)
```

Deploy to any Node-capable host (the admin backend needs SSR — pure static hosts like GitHub Pages will only serve the frontend, not the admin API).

Before deploying, set `siteURL` in `src/config.ts` (currently `https://blog.lixuwei.com`).

### ⚡ Common commands

| Command | Action |
|:--|:--|
| `pnpm dev` | Start local dev server |
| `pnpm build` | Build production site to `./dist` |
| `pnpm preview` | Preview the build locally |
| `pnpm start` | Run the SSR server entry |
| `pnpm check` | Astro type / error checking |
| `pnpm new-post <filename>` | Create a new blog post (file-based) |
| `pnpm format` | Format with Prettier |
| `pnpm lint` | ESLint with autofix |
| `pnpm update-anime` / `update-bangumi` / `update-bilibili` | Refresh external data sources |

### 📄 License

Released under the **Apache License 2.0** — see [LICENSE](LICENSE).

The upstream Mizuki project is itself based on [Fuwari](https://github.com/saicaca/fuwari) (MIT). The original MIT notice is preserved in [LICENSE.MIT](LICENSE.MIT) per the MIT terms.

### 🙏 Acknowledgements

- **[Mizuki](https://github.com/LyraVoid/Mizuki)** by LyraVoid — the upstream template this project is forked from. The whole frontend, design system, and most special pages come from Mizuki.
- **[Fuwari](https://github.com/saicaca/fuwari)** by saicaca — the original template Mizuki was built on.
- **[Yukina](https://github.com/WhitePaper233/yukina)**, **[Firefly](https://github.com/CuteLeaf/Firefly)**, **[Twilight](https://github.com/spr-aachen/Twilight)** — design inspiration that flowed through Mizuki into this fork.
- Built with [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com), [Svelte](https://svelte.dev), and icons from [Iconify](https://iconify.design/).

---

## 中文

### ✨ 相对原版 Mizuki 的改动

原版 Mizuki 是一个纯静态模板,所有内容都靠 markdown 文件 + git 提交来管理。本仓库在保留前端的基础上,新增了一整套基于数据库的 **后台管理系统**,从此可以在浏览器里完成所有内容管理,再自动触发重新构建部署。

**后台页面(`/admin/*`):**

- **文章管理** —— 富文本编辑器,支持标签、封面、附件、本地视频与 markdown 嵌入
- **相册管理** —— 创建相册并直接上传图片
- **日记** —— 类似朋友圈的短动态
- **追番** —— 番剧观看进度、评分、元数据
- **友链** —— 友情链接卡片管理
- **足迹** —— 去过的地方,可配地图
- **时间线** —— 个人生平时间线
- **技能** —— 技能 / 技术栈展示
- **项目** —— 个人项目列表
- **工具站** —— 实用工具收藏
- **公告** —— 站点公告栏及其样式设置
- **站点设置** —— 站点标题、副标题、Banner、主题色、个人资料等,不用改代码
- **个人资料** —— 编辑「关于」/ 站点信息页
- **安全设置** —— 修改后台密码、查看访问日志
- **设备管理** —— 已登录设备管理

**后端接口:** 全部后台页面都由 `src/pages/api/admin/*` 下的接口支撑,包含登录/登出、会话鉴权、文件上传(图片、字体、音乐),以及一键触发重新构建。

### 🎨 继承自 Mizuki 的特性

- 基于 [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com) + Svelte
- 使用 [Swup](https://swup.js.org/) 实现平滑的页面过渡
- 明暗主题切换,跟随系统偏好,可自定义主题色
- Banner 轮播,全设备响应式
- 基于 Pagefind 的全文搜索
- 增强 Markdown:Callout、KaTeX 公式、[Expressive Code](https://expressive-code.com/) 代码高亮、GitHub 仓库卡片、PhotoSwipe 图库
- RSS、站点地图、SEO meta、阅读时长估算
- Twikoo 评论系统集成
- 特色页面:追番、友链、日记、归档、关于

### 🚀 快速开始

```bash
# 1. 克隆
git clone <你的仓库地址>
cd personal-website

# 2. 安装依赖(只支持 pnpm)
npm install -g pnpm
pnpm install

# 3. 配置
#    - 修改 src/config.ts 的站点标题、主题、Banner、社交链接
#    - 复制 .env.example 为 .env,设置后台密码及相关密钥
cp .env.example .env

# 4. 启动开发服务器
pnpm dev          # http://localhost:4321
#    后台地址:    http://localhost:4321/admin/login
```

### 📦 构建与部署

```bash
pnpm build        # 输出到 ./dist
pnpm preview      # 本地预览构建产物
pnpm start        # 运行 SSR 入口 dist/server/entry.mjs
```

部署到任意支持 Node 运行时的平台即可(后台需要 SSR,纯静态托管如 GitHub Pages 只能跑前端、跑不了后台 API)。

部署前请把 `src/config.ts` 中的 `siteURL` 改成你的域名(本仓库目前是 `https://blog.lixuwei.com`)。

### ⚡ 常用命令

| 命令 | 作用 |
|:--|:--|
| `pnpm dev` | 启动本地开发服务器 |
| `pnpm build` | 构建生产版本到 `./dist` |
| `pnpm preview` | 本地预览构建产物 |
| `pnpm start` | 运行 SSR 服务入口 |
| `pnpm check` | Astro 类型 / 错误检查 |
| `pnpm new-post <filename>` | 用文件方式新建文章 |
| `pnpm format` | Prettier 格式化 |
| `pnpm lint` | ESLint 自动修复 |
| `pnpm update-anime` / `update-bangumi` / `update-bilibili` | 刷新外部数据源 |

### 📄 协议

本项目采用 **Apache License 2.0**,详见 [LICENSE](LICENSE)。

上游 Mizuki 项目本身基于 [Fuwari](https://github.com/saicaca/fuwari)(MIT 协议),原始 MIT 声明保留在 [LICENSE.MIT](LICENSE.MIT) 中。

### 🙏 致谢

- **[Mizuki](https://github.com/LyraVoid/Mizuki)** by LyraVoid —— 本项目的上游模板,前端、设计系统、绝大多数特色页面都来自 Mizuki。
- **[Fuwari](https://github.com/saicaca/fuwari)** by saicaca —— Mizuki 所基于的原始模板。
- **[Yukina](https://github.com/WhitePaper233/yukina)**、**[Firefly](https://github.com/CuteLeaf/Firefly)**、**[Twilight](https://github.com/spr-aachen/Twilight)** —— 为 Mizuki 提供过设计灵感,这份灵感也延续到了本仓库。
- 由 [Astro](https://astro.build)、[Tailwind CSS](https://tailwindcss.com)、[Svelte](https://svelte.dev) 构建,图标来自 [Iconify](https://iconify.design/)。
