import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import remarkSemanticTone from './remark-semantic-tone';

type Node = { type: string; name?: string; value?: string; attributes?: Array<{ name?: string; value?: string | { value?: string } }>; children?: Node[] };
const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const components = new Set(['Callout', 'ImageFigure', 'Steps']);
function attribute(node: Node, key: string) {
  const value = node.attributes?.find((item) => item.name === key)?.value;
  return typeof value === 'string' ? value : value?.value ?? '';
}
function renderStepInline(nodes: Node[]): string {
  return nodes.map((node) => {
    if (node.type === 'text') return escape(node.value ?? '');
    const tag = node.name ?? '';
    if (['strong', 'em', 'code', 'del'].includes(tag)) return `<${tag}>${renderStepInline(node.children ?? [])}</${tag}>`;
    if (tag === 'a') {
      const href = attribute(node, 'href');
      return href ? `<a href="${escape(href)}">${renderStepInline(node.children ?? [])}</a>` : renderStepInline(node.children ?? []);
    }
    throw new Error('步骤列表项只支持静态文字、强调、代码和链接。');
  }).join('');
}

/** Permit only the site's authored MDX components; fail visibly on unknown JSX or expressions. */
function controlledMdx() {
  return (tree: Node) => {
    const visit = (parent: Node) => {
      if (!parent.children) return;
      const output: Node[] = [];
      for (const node of parent.children) {
        if (node.type === 'mdxjsEsm') {
          const source = node.value ?? '';
          const imports = [...source.matchAll(/^import\s+([A-Z][A-Za-z0-9_]*)\s+from\s+['"](?:@\/components\/article|\.\.\/components\/article)\/(Callout|ImageFigure|Steps)\.astro['"]\s*;?\s*$/gmu)];
          const residue = source.replace(/^import\s+([A-Z][A-Za-z0-9_]*)\s+from\s+['"](?:@\/components\/article|\.\.\/components\/article)\/(Callout|ImageFigure|Steps)\.astro['"]\s*;?\s*$/gmu, '').trim();
          if (imports.length === 0 || residue || imports.some((match) => match[1] !== match[2])) {
            throw new Error('MDX 仅允许导入文章目录内的 Callout、ImageFigure 和 Steps 组件；其他 import/export 不会在公开 Worker 中执行。');
          }
          continue;
        }
        if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
          throw new Error('动态内容不支持 MDX JavaScript 表达式；请改用静态属性或受控文章组件。');
        }
        if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
          const name = node.name ?? '';
          const children = node.children ?? [];
          if (name === 'Steps') {
            const title = attribute(node, 'title') || '操作步骤';
            output.push({ type: 'html', value: `<section class="steps"><h3>${escape(title)}</h3><ol>` });
            for (const item of children) {
              if (!['mdxJsxFlowElement', 'mdxJsxTextElement'].includes(item.type) || item.name !== 'li') throw new Error('Steps 内必须使用静态 <li>步骤列表项。');
              output.push({ type: 'html', value: `<li>${renderStepInline(item.children ?? [])}</li>` });
            }
            output.push({ type: 'html', value: '</ol></section>' });
            continue;
          }
          for (const child of children) visit(child);
          if (!components.has(name)) {
            if (!/^[a-z][a-z0-9-]*$/u.test(name)) throw new Error(`文章包含未知 MDX 组件 <${name}>，内容已保留但未渲染。`);
            const attributes = (node.attributes ?? []).map((item) => {
              if (!item.name || /^on/iu.test(item.name)) return '';
              if (item.value && typeof item.value === 'object' && typeof item.value.value !== 'string') throw new Error(`HTML 属性 ${item.name} 使用了不受支持的动态表达式。`);
              const value = typeof item.value === 'string' ? item.value : item.value?.value;
              return value === undefined ? ` ${item.name}` : ` ${item.name}="${escape(value)}"`;
            }).join('');
            const voidTag = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/u.test(name);
            output.push({ type: 'html', value: `<${name}${attributes}>` }, ...children, ...(voidTag ? [] : [{ type: 'html', value: `</${name}>` }]));
            continue;
          }
          if (name === 'ImageFigure') {
            const src = attribute(node, 'src');
            const alt = attribute(node, 'alt');
            const caption = attribute(node, 'caption');
            if (!src) throw new Error('ImageFigure 缺少 src 属性。');
            output.push({ type: 'html', value: `<figure class="image-figure"><img src="${escape(src)}" alt="${escape(alt)}" loading="lazy" decoding="async" />${caption ? `<figcaption>${escape(caption)}</figcaption>` : ''}</figure>` });
          } else if (name === 'Callout') {
            const toneValue = attribute(node, 'tone') || attribute(node, 'type');
            const tone = ['note', 'tip', 'warning'].includes(toneValue) ? toneValue : 'note';
            const title = attribute(node, 'title') || '补充说明';
            output.push({ type: 'html', value: `<aside class="callout callout-${tone}"><strong>${escape(title)}</strong><div>` }, ...children, { type: 'html', value: '</div></aside>' });
          }
          continue;
        }
        visit(node);
        output.push(node);
      }
      parent.children = output;
    };
    visit(tree);
  };
}

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'dataTone'],
    a: [...(defaultSchema.attributes?.a ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'dataTone', 'className'],
    aside: ['className'], figure: ['className'], section: ['className'], ol: ['className'], li: ['className'], img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-/u]],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), 'aside', 'figure', 'figcaption', 'section', 'li', 'mark'],
  protocols: { ...defaultSchema.protocols, src: ['http', 'https'], href: ['http', 'https', 'mailto', 'tel'] },
} satisfies NonNullable<Parameters<typeof rehypeSanitize>[0]>;

export interface RenderedArticle { html: string; headings: Array<{ text: string; slug: string; depth: number }>; }
export async function renderArticle(markdown: string): Promise<RenderedArticle> {
  const html = String(await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .use(remarkSemanticTone)
    .use(controlledMdx)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap', properties: { className: ['heading-anchor'] } })
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(markdown));
  const headings: RenderedArticle['headings'] = [];
  for (const match of html.matchAll(/<h([2-6]) id="([^"]+)">([\s\S]*?)<\/h\1>/gu)) {
    const text = match[3].replace(/<[^>]+>/gu, '').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').trim();
    if (text) headings.push({ text, slug: match[2], depth: Number(match[1]) });
  }
  return { html, headings };
}
