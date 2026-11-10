---
title: 用 Astro Content Collections 管理 Markdown
description: 虚构示例：从 Schema、集合 Loader 到静态动态路由，搭建一个轻量可靠的文章内容层。
pubDate: 2026-10-12
tags: [Astro, TypeScript, Markdown]
category: Astro
featured: false
sample: true
---

> 示例文章｜代码与说明为教学用途，可能需要按项目版本调整。

个人博客的文章不需要数据库后台，也能获得类型检查和自动生成页面的体验。Astro Content Collections 可以把每篇 Markdown 文章当作有固定结构的数据条目。

## 定义集合与 Schema

在当前 Astro 项目中，集合配置放在 `src/content.config.ts`。用 Zod 描述 Frontmatter，就能在构建时发现缺少标题或错误日期。

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ base: './src/content/tech', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});
```

需要同时维护闲聊和技术文章时，可以分别创建集合，保持栏目清晰。Loader 会读取指定目录下的 Markdown 文件，Schema 会校验元数据。

## 生成静态文章路由

内容集合不会自动创建页面。动态路由通过 `getStaticPaths()` 为每篇文章生成静态页面：

```ts
export async function getStaticPaths() {
  const posts = await getCollection('tech', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}
```

过滤草稿要同时用于列表页、详情页和搜索内容。只在首页隐藏草稿并不够，因为搜索引擎可能仍然收录它。

## 让文件名稳定

集合条目的 `id` 默认来自文件名。因此一旦文章公开，移动文件或改名可能会改变链接。写作时最好把 slug 当作 URL 的一部分认真维护，避免随手重命名已发布的 Markdown 文件。

本文属于虚构的项目示例，具体实现以仓库配置为准。
