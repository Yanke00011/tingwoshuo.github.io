# 内容维护指南

## 栏目位置

- 闲聊文章：`src/content/life/`
- 技术文章：`src/content/tech/`
- 模板：`templates/post.md`
- 交互式草稿创建：`pnpm new:post`

每篇文章一个 `.md` 或 `.mdx` 文件。文件名是文章 slug，也是文章 URL 的一部分；发布后尽量不要重命名。

## 元数据

`title`、`description`、`pubDate` 是必填；`updatedDate`、`tags`、`cover`、`coverAlt`、`draft`、`featured`、`category`、`sample` 可选。Schema 定义在 `src/content.config.ts`。`draft` 默认 `false`；创建脚本会显式设为 `true`。

发布前将 `draft` 设成 `false`。草稿过滤由 `src/lib/posts.ts` 的查询和动态路由共同执行。构建后 Pagefind 扫描生成的公开 HTML，因此草稿不会进入搜索索引。

## Markdown 能力

Astro Markdown 可直接使用标题、列表、引用、表格、图片和代码围栏；MDX 文章也可导入 `@/components/article/Callout.astro`、`ImageFigure.astro` 与 `Steps.astro` 作为轻量内容组件；Expressive Code 使用 Shiki 在构建期高亮代码，支持代码块标题和行号。可在围栏后加 `title="src/example.ts"` 显示文件名；行号默认显示。使用三级标题及以下会让文章页生成目录。代码块自动附加复制按钮，正文图片可点击放大。外部链接建议使用描述性链接文本。文章文字色由创作台的语义色工具写入 `data-tone` 标记，背景强调使用 `==重点内容==`；颜色会随浅色/深色主题适配。无法安全往返的 MDX 或代码围栏元数据会保留源码模式。

图片放在 `public/images/`，写作 `/images/example.jpg`。为内容图片提供 alt 描述；用 `<figure>`/`<figcaption>` 编写图注。长表格可横向滚动。

## 发布前核对

1. 标题、摘要与发布日期准确。
2. 文章 slug 稳定且唯一。
3. 草稿状态正确。
4. 图片有 alt 文本，链接有效。
5. 本地运行 `pnpm check` 与 `pnpm build`。
6. 推送仓库并等待 Cloudflare Pages 构建完成。

示例文章含有明显的“虚构示例”标记，可保留作版式参考，也可以删除后写入自己的内容。
