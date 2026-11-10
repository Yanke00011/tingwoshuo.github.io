---
title: 写 TypeScript 时，我会先检查的几件事
description: 虚构示例：从输入边界、类型收窄到错误处理，让类型系统帮助代码表达意图。
pubDate: 2026-08-21
tags: [TypeScript, 工程实践]
category: TypeScript
sample: true
---

> 示例文章｜以下内容为虚构教学笔记，不代表作者的真实项目经验。

TypeScript 的价值不只是让编辑器少画红线。它更像一份关于数据形状的说明，让函数的输入、输出和边界行为都更容易理解。

## 从边界开始验证

网络响应、用户输入和本地文件都属于运行时数据。给它们写一个静态类型，并不会自动验证真实数据。先用 `unknown` 接收，再做运行时检查，通常比直接断言类型可靠。

```ts
type Profile = { name: string; bio?: string };

function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === 'string'
    && (item.bio === undefined || typeof item.bio === 'string');
}
```

## 让状态成为明确的联合类型

如果一个值只可能处于几种状态，就把这些状态写清楚，而不是散落多个可能互相矛盾的布尔变量。

```ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };
```

这样在 `if (result.ok)` 后，TypeScript 可以自动缩窄到对应分支。调用方也必须处理失败情况。

## 少一点断言，多一点表达

类型断言适合描述运行时检查之后的事实，不适合用来压住编译器提出的问题。遇到 `as SomeType`，可以先问：这个值在哪一步被验证了？如果答案不清楚，最好回到数据边界重新设计。

示例内容仅用于展示博客排版、代码高亮与目录生成。
