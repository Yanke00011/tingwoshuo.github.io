import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const rl = createInterface({ input, crlfDelay: Infinity });
const lines = rl[Symbol.asyncIterator]();
const ask = async (label: string, fallback = '') => {
  output.write(`${label}${fallback ? ` (${fallback})` : ''}: `);
  const next = await lines.next();
  return String(next.value ?? '').trim() || fallback;
};
try {
  const sectionAnswer = (await ask('栏目：1 闲聊 / 2 技术', '1')).toLowerCase();
  const section = sectionAnswer === '2' || sectionAnswer === 'tech' ? 'tech' : 'life';
  const title = await ask('文章标题');
  if (!title) throw new Error('文章标题不能为空。');
  const description = await ask('文章简介', title);
  const tags = (await ask('标签（逗号分隔）', '随笔')).split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);
  const date = await ask('发布日期 YYYY-MM-DD', new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error('日期格式应为 YYYY-MM-DD。');
  const titleSlug = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  const slug = await ask('稳定链接 slug', titleSlug);
  if (!slug || slug.includes('/')) throw new Error('slug 不能为空，也不能包含斜杠。');
  const target = join(process.cwd(), 'src', 'content', section, `${slug}.md`);
  const tagYaml = tags.length ? `[${tags.map((tag) => JSON.stringify(tag)).join(', ')}]` : '[]';
  const content = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\npubDate: ${date}\ntags: ${tagYaml}\ndraft: true\nfeatured: false\n---\n\n在这里开始写作。\n`;
  await mkdir(join(process.cwd(), 'src', 'content', section), { recursive: true });
  await writeFile(target, content, { flag: 'wx' });
  console.log(`\n已创建草稿：${target}\n检查内容后将 draft 改为 false 即可发布。`);
} finally {
  rl.close();
}
