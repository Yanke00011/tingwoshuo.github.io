import assert from 'node:assert/strict';
import { renderArticle } from '../src/lib/render-content.ts';

const article = await renderArticle(`import Callout from '@/components/article/Callout.astro';
import ImageFigure from '@/components/article/ImageFigure.astro';
import Steps from '@/components/article/Steps.astro';

# 中文标题

[[green|语义强调]] 与 ==重点内容==。

<Callout tone="tip" title="提示"><p>先验证隔离环境。</p></Callout>

<Steps title="迁移步骤"><li>备份</li><li>校验</li></Steps>

<ImageFigure src="https://example.test/cover.webp" alt="示例" caption="图片说明" />

| 字段 | 值 |
| --- | --- |
| slug | stable |

~~~ts
const ok: boolean = true;
~~~`);

assert.match(article.html, /<h1 id="中文标题">/u);
assert.match(article.html, /data-tone="green"/u);
assert.match(article.html, /<mark>重点内容<\/mark>/u);
assert.match(article.html, /class="callout callout-tip"/u);
assert.match(article.html, /class="steps"/u);
assert.match(article.html, /<ol><li>备份<\/li><li>校验<\/li><\/ol>/u);
assert.match(article.html, /class="image-figure"/u);
assert.match(article.html, /<table>/u);
assert.match(article.html, /language-ts/iu);
assert.ok(article.headings.some((heading) => heading.text === '迁移步骤'));

const hostile = await renderArticle('<script>alert(1)</script>\n\n<img src="javascript:alert(1)" onerror="alert(1)" />');
assert.doesNotMatch(hostile.html, /<script|onerror|javascript:/iu);

await assert.rejects(renderArticle("import fs from 'node:fs';\n\n# Unsafe"), /仅允许导入文章目录/u);
await assert.rejects(renderArticle('# Expression\n\n{process.env.SECRET}'), /JavaScript 表达式/u);
console.log('V7 runtime Markdown/MDX smoke: passed');
