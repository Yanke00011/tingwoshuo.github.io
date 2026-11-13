# 听我说 · Hear Me Out

一个以中文阅读体验为核心的个人博客。页面使用 Astro SSR 部署到现有 Cloudflare Pages 项目；V7 正式运行时从 D1 只读取已发布版本，媒体通过 R2 受控读取。Markdown/MDX 原创源文件继续保存在 GitHub，用于版本管理和迁移核对。

## 技术栈

- Astro 5 + TypeScript strict + Astro Content Collections（Zod Schema）
- Tailwind CSS 4（Vite 插件）与 CSS Variables Design Tokens
- Markdown / MDX、Expressive Code（Shiki）、行号插件、Lucide Astro
- V7 生产运行时：Astro SSR + Cloudflare Pages Functions、D1 发布内容查询、R2 受控媒体、RSS、Sitemap 与 D1 全文搜索
- 生产配置：`wrangler.jsonc` 中绑定 V7 production D1/R2/KV；Preview 环境使用独立 Staging 绑定。生产 Pages 自动部署暂时关闭，通过 Wrangler 受控部署
- 本地专用创作台：Tiptap + Markdown/MDX AST 检查 + Express loopback API

当前仓库使用 Astro 5.18.2。推荐使用 Node 22.23.4 或更新的 Node 22 LTS 版本，以满足当前开发工具链的运行要求。

## 安装与开发

```sh
pnpm install
pnpm dev
```

本地开发地址通常是 `http://localhost:4321`。V7 动态路由读取隔离的本地 D1；应用 schema 和迁移样例后即可查看：

```sh
pnpm build
pnpm preview
```

`pnpm build` 生成 Cloudflare Worker bundle。`wrangler.local.jsonc` 中的 D1、R2、KV 都是本地测试绑定；不要替换成生产凭据做本地验证。

## 当前生产部署与 V7 状态

现有 Pages 项目 `tingwoshuo` 保留原 `pages.dev` 地址，当前部署 Astro SSR 并读取独立 V7 production D1。`Studio` V7 Worker 由 Cloudflare Access 保护，内容写入 D1，媒体写入私有 R2。旧 Cloudflare 资源和 Studio 旧 GitHub 发布代码尚未清理；两仓变更也尚未全部推送。详见 Studio 仓库的唯一进度文件 `../tingwoshuo-Studio/PROGRESS.md`。

## 修改网站信息

`src/config/site.ts` 是网站名称、简介、站点 URL、作者署名、联系方式、科技品牌版权署名和 SEO 默认值的主要入口。当前 canonical URL 配置为 `https://tingwoshuo-github-io.pages.dev/`；若以后确认切换到正式自定义域名，须同步更新这里以保证 Canonical、Open Graph、RSS 和 robots.txt 一致。

`src/config/navigation.ts` 修改导航；`src/config/theme.ts` 修改主题存储键和默认策略；颜色、字体、字号比例、圆角、阴影、阅读宽度等令牌集中在 `src/styles/global.css` 的 `:root` 与深色主题变量。

## 添加、修改、隐藏和删除文章

原创文章源文件位于 `src/content/life/` 或 `src/content/tech/`，支持 `.md` 与 `.mdx`；新 V7 Studio 生产实例以 D1 为内容发布源，公开 Astro 路由只读取已发布版本。GitHub 中的 Markdown/MDX 源文件仍需保留，作为原创内容源和可审计的版本记录。

可以交互创建草稿：

```sh
pnpm new:post
```

随后按提示选择栏目、标题、简介、标签、日期和稳定 slug。脚本会生成 `draft: true` 的 Markdown 文件。也可以运行 `pnpm editor` 打开本机「听我说 · 创作台」：先编辑并自动保存到 `.editor-drafts/`，点击“生成文件”后写入内容集合；预览、Git 发布为独立操作。创作台仅监听 `127.0.0.1`，不会进入 Astro 构建。

Frontmatter 示例：

```yaml
---
title: 文章标题
description: 简短介绍
pubDate: 2026-11-10
updatedDate: 2026-11-11
tags: [Astro, 随笔]
cover: /images/cover.jpg
coverAlt: 封面图片的描述
draft: false
featured: false
---
```

- 修改文章：编辑对应 Markdown/MDX 文件，保持 `title`、`description`、`pubDate` 合法。
- 隐藏文章：设置 `draft: true`；草稿不会进入正式页面、列表和搜索索引。
- 删除文章：删除对应文件。已公开文章建议先准备重定向或更新外部链接。
- 设置封面：将图片放在 `public/images/` 并填写根路径，如 `/images/cover.jpg`；没有封面也完全正常。
- 精选文章：设置 `featured: true`，首页会自动展示第一篇精选。
- 标签从文章元数据自动聚合，栏目页可按标签筛选。
- slug 来自文件名，发布后请避免改名，以免 URL 变化。

## 栏目与其他页面

首页、列表、文章、归档、关于、搜索和 404 页面分别位于 `src/pages/`。内容集合 Schema 在 `src/content.config.ts`。添加新栏目时，需要创建新集合、扩展 `Section`/查询方法和文章路径，然后补列表页与文章页。请先看当前 `life`/`tech` 的实现，保持草稿过滤规则一致。

关于页的个人介绍与项目说明位于 `src/pages/about.astro`。搜索弹窗支持 `⌘/Ctrl + K`；生产搜索读取 D1 发布内容。

## 常见问题

- **为什么动态开发时搜索没有内容？** 检查隔离本地 D1 schema 和历史文章导入；不要用生产凭据替代本地绑定。
- **文章没有出现在列表？** 检查是否设成 `draft: true`，并确认文件在正确集合目录、Frontmatter 格式通过 Schema。
- **Canonical/分享链接域名不对？** 更新 `src/config/site.ts` 的 `url` 后重新构建。
- **pnpm 找不到？** 运行 `corepack enable` 后再执行 `pnpm install`。
- **构建时 Zod 日期报错？** 使用有效的 `YYYY-MM-DD` 日期，避免带引号的非标准日期字符串。

创作台支持标题、强调、列表、任务列表、引用/提示块、表格、图片、代码块、链接、语义文字色和对齐。上传图片会压缩为 WebP，并询问 Alt 描述与可选图注；图注以图片下方的斜体段落保存。颜色使用 `[[green|强调文字]]` 等受控语法，背景强调使用 `==文字==`；博客在构建时将其编译为兼容浅色/深色主题的标记。遇到 MDX JSX、原始 HTML、表格以外尚不支持的代码围栏元数据等内容时，编辑器会优先保留源码；生成时仍会检查并拒绝未确认的转换。

## 设计与内容文档

- [内容维护指南](CONTENT_GUIDE.md)
- [设计系统说明](DESIGN_SYSTEM.md)
