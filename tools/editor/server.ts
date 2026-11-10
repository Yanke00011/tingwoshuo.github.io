import express from 'express';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import sharp from 'sharp';
import { createHash, randomBytes } from 'node:crypto';
import { readdir, readFile, mkdir, rename, writeFile, stat, realpath } from 'node:fs/promises';
import { resolve, relative, basename, extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = resolve(process.cwd());
const contentRoot = resolve(root, 'src/content');
const draftRoot = resolve(root, '.editor-drafts');
const imageRoot = resolve(root, 'public/images');
const app = express();
const csrf = randomBytes(32).toString('hex');
const allowedOrigins = new Set(['http://127.0.0.1:4310', 'http://localhost:4310']);
const sectionNames = new Set(['life', 'tech']);
const slugPattern = /^[\p{L}\p{N}][\p{L}\p{N}._-]{0,90}$/u;
app.disable('x-powered-by');
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (!/^127\.0\.0\.1:(4310|4311)$/.test(host) && !/^localhost:(4310|4311)$/.test(host)) return res.sendStatus(403);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.path.startsWith('/api/') && req.method !== 'GET') {
    const origin = req.headers.origin || '';
    if (!allowedOrigins.has(origin)) return res.status(403).json({ error: 'Origin 不在允许范围内。' });
    if (req.headers['x-csrf-token'] !== csrf) return res.status(403).json({ error: 'CSRF 校验失败，请刷新编辑器。' });
  }
  next();
});
app.use(express.json({ limit: '20mb', strict: true }));
app.get('/api/session', (_req, res) => res.json({ csrf, name: '听我说 · 创作台' }));
function safeTarget(section: string, slug: string, extension: string) {
  if (!sectionNames.has(section) || !slugPattern.test(slug) || !['.md', '.mdx'].includes(extension)) throw new Error('栏目、Slug 或扩展名无效。');
  const base = resolve(contentRoot, section);
  const target = resolve(base, `${slug}${extension}`);
  if (!target.startsWith(`${base}/`)) throw new Error('文件路径超出内容目录。');
  return target;
}
async function assertContained(target: string, base: string) {
  const realBase = await realpath(base);
  const parent = await realpath(resolve(target, '..'));
  if (parent !== realBase && !parent.startsWith(`${realBase}/`)) throw new Error('检测到路径符号链接越界，已拒绝操作。');
  try { const actual = await realpath(target); if (actual !== realBase && !actual.startsWith(`${realBase}/`)) throw new Error('检测到路径符号链接越界，已拒绝操作。'); } catch (e: any) { if (e.code !== 'ENOENT') throw e; }
}
async function walk(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return (await Promise.all(entries.map((e) => e.isDirectory() ? walk(resolve(dir, e.name)) : /\.mdx?$/.test(e.name) ? [resolve(dir, e.name)] : []))).flat();
  } catch { return []; }
}
function hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
function collectMdx(node: any, found: string[] = []): string[] {
  if (node?.type === 'mdxJsxFlowElement' || node?.type === 'mdxJsxTextElement') {
    const attrs = node.attributes || [];
    const tone = attrs.find((a: any) => a.name === 'data-tone')?.value;
    const validTone = node.name === 'span' && attrs.length === 1 && typeof tone === 'string' && ['default','muted','blue','green','orange','red','purple'].includes(tone);
    const validMark = node.name === 'mark' && attrs.length === 0;
    if (!validTone && !validMark) found.push(node.type);
  } else if (node?.type && ['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'].includes(node.type)) found.push(node.type);
  for (const child of node?.children || []) collectMdx(child, found);
  return found;
}
function inspectBody(body: string) {
  try { const tree: any = unified().use(remarkParse).use(remarkGfm).use(remarkMdx).parse(body); const unsupported = collectMdx(tree); const inspect = (node: any) => { if (node.type === 'text' && /\[\[(?:default|muted|blue|green|orange|red|purple)\|[^\[\]]+\]\]/.test(node.value || '')) unsupported.push('custom-tone-source'); if (node.type === 'html') unsupported.push('raw-html'); if (node.type === 'code' && node.meta) unsupported.push('code-fence-metadata'); if (node.type === 'image' && node.title) unsupported.push('image-title'); for (const child of node.children || []) inspect(child); }; inspect(tree); return [...new Set(unsupported)]; }
  catch { return ['parse-error']; }
}
app.get('/api/posts', async (_req, res) => {
  const files = await walk(contentRoot);
  const posts = await Promise.all(files.map(async (file) => {
    const raw = await readFile(file, 'utf8'); const parsed = matter(raw); const rel = relative(contentRoot, file).split('/');
    return { section: rel[0], slug: basename(file, extname(file)), extension: extname(file), title: parsed.data.title || basename(file), description: parsed.data.description || '', tags: parsed.data.tags || [], date: parsed.data.pubDate || '', updated: parsed.data.updatedDate || '', draft: Boolean(parsed.data.draft), path: relative(root, file), body: parsed.content, hash: hash(raw), unsupported: inspectBody(parsed.content) };
  }));
  res.json(posts.sort((a, b) => String(b.date).localeCompare(String(a.date))));
});
app.get('/api/post', async (req, res) => {
  try {
    const section = String(req.query.section || ''), slug = String(req.query.slug || ''), ext = String(req.query.extension || '.md');
    const file = safeTarget(section, slug, ext); await assertContained(file, contentRoot); const raw = await readFile(file, 'utf8'); const post = matter(raw);
    res.json({ section, slug, extension: ext, frontmatter: post.data, body: post.content, hash: hash(raw), unsupported: inspectBody(post.content) });
  } catch (e: any) { res.status(400).json({ error: e.code === 'ENOENT' ? '文章不存在。' : e.message }); }
});
app.post('/api/snapshot', async (req, res) => {
  try {
    const { id, content } = req.body || {};
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id) || typeof content !== 'object') throw new Error('草稿格式无效。');
    await mkdir(draftRoot, { recursive: true });
    const target = resolve(draftRoot, `${id}.json`), temp = `${target}.${randomBytes(6).toString('hex')}.tmp`;
    await writeFile(temp, JSON.stringify({ content, savedAt: new Date().toISOString() }), { mode: 0o600 }); await rename(temp, target);
    res.json({ savedAt: new Date().toISOString() });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});
app.get('/api/snapshots', async (_req, res) => {
  const files = await readdir(draftRoot).catch(() => [] as string[]);
  const items = await Promise.all(files.filter((f) => /^[a-zA-Z0-9_-]+\.json$/.test(f)).map(async (f) => { try { return { id: f.slice(0,-5), ...(JSON.parse(await readFile(resolve(draftRoot, f),'utf8'))) }; } catch { return null; } }));
  res.json(items.filter(Boolean));
});
app.post('/api/generate', async (req, res) => {
  try {
    const { section, slug, extension = '.md', frontmatter, body, expectedHash, sourceMode } = req.body || {};
    if (typeof body !== 'string' || typeof frontmatter !== 'object') throw new Error('文章内容无效。');
    if (typeof frontmatter.title !== 'string' || !frontmatter.title.trim()) throw new Error('标题不能为空。');
    if (typeof frontmatter.description !== 'string' || !frontmatter.description.trim()) throw new Error('摘要不能为空。');
    if (typeof frontmatter.pubDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.pubDate) || Number.isNaN(Date.parse(frontmatter.pubDate))) throw new Error('发布时间格式应为 YYYY-MM-DD。');
    if (!Array.isArray(frontmatter.tags) || frontmatter.tags.some((tag: unknown) => typeof tag !== 'string')) throw new Error('标签必须为文本列表。');
    const file = safeTarget(section, slug, extension); await assertContained(file, contentRoot);
    const current = await readFile(file, 'utf8').catch((e) => e.code === 'ENOENT' ? null : Promise.reject(e));
    if (current && (!expectedHash || hash(current) !== expectedHash)) return res.status(409).json({ error: '文件已在外部修改，请重新读取后再生成。' });
    if (!current && expectedHash) return res.status(409).json({ error: '原文章已不存在，请刷新列表。' });
    const unsupported = inspectBody(body);
    if (unsupported.length && !sourceMode) return res.status(422).json({ error: '正文含编辑器不能安全往返转换的 Markdown/MDX 语法，已阻止生成。请切换源码模式确认原文保留。', unsupported });
    const yaml = matter.stringify(body, frontmatter);
    await mkdir(resolve(file, '..'), { recursive: true });
    const temp = `${file}.${randomBytes(6).toString('hex')}.tmp`;
    await writeFile(temp, yaml, { flag: 'wx', mode: 0o644 }); await rename(temp, file);
    res.json({ path: relative(root, file), hash: hash(yaml), unsupported });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});
app.post('/api/upload', async (req, res) => {
  try {
    const { filename, data, alt = '' } = req.body || {};
    if (typeof data !== 'string' || !/^data:image\/(png|jpeg|webp|gif);base64,/.test(data)) throw new Error('请选择 PNG、JPEG、WebP 或 GIF 图片。');
    const buffer = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
    if (buffer.length > 12 * 1024 * 1024) throw new Error('图片最大为 12 MB。');
    const image = sharp(buffer, { failOn: 'error', limitInputPixels: 40000000 });
    const meta = await image.metadata();
    if (!meta.format || !['png','jpeg','webp','gif'].includes(meta.format)) throw new Error('图片格式无法识别。');
    await mkdir(imageRoot, { recursive: true });
    const actualImageRoot = await realpath(imageRoot); const actualPublic = await realpath(resolve(root,'public'));
    if (!actualImageRoot.startsWith(`${actualPublic}/`)) throw new Error('图片目录不能指向 public 目录之外。');
    const stem = String(filename || 'image').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,48) || 'image';
    const out = `${stem}-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}.webp`;
    const target = resolve(imageRoot, out), temp = `${target}.tmp`; await assertContained(target, imageRoot);
    await image.rotate().resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(temp);
    await rename(temp, target);
    res.json({ src: `/images/${out}`, alt: String(alt).slice(0,300), width: Math.min(meta.width || 2200, 2200), height: Math.min(meta.height || 2200, 2200), path: `public/images/${out}` });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});
app.post('/api/delete', async (req, res) => {
  try {
    const { section, slug, extension = '.md', expectedHash } = req.body || {};
    const file = safeTarget(section, slug, extension); await assertContained(file, contentRoot); const raw = await readFile(file, 'utf8');
    if (!expectedHash || hash(raw) !== expectedHash) return res.status(409).json({ error: '文件已修改，请重新读取后再删除。' });
    await (await import('node:fs/promises')).unlink(file); res.json({ deleted: relative(root, file) });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});
app.get('/api/git-status', async (_req, res) => {
  try { const { stdout } = await execFileAsync('git',['status','--short'],{cwd:root}); const { stdout: branch } = await execFileAsync('git',['branch','--show-current'],{cwd:root}); res.json({ status: stdout.trim().split('\n').filter(Boolean), branch: branch.trim() }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post('/api/publish', async (req, res) => {
  try {
    if (req.body?.confirmed !== true) return res.status(400).json({ error: '必须先在编辑器中明确确认发布。' });
    const paths = [...new Set(req.body.paths as string[])];
    if (!paths.length || paths.length > 30 || paths.some((p) => !(/^(src\/content\/(life|tech)\/[^/]+\.mdx?|public\/images\/[a-zA-Z0-9_-]+\.webp)$/.test(p)))) throw new Error('发布文件列表无效。');
    const git = async (args: string[]) => execFileAsync('git', args, { cwd: root, maxBuffer: 1024*1024 });
    const { stdout: branch } = await git(['branch','--show-current']);
    if (!branch.trim()) throw new Error('当前处于 detached HEAD，已停止发布。');
    const { stdout: remotes } = await git(['remote']); if (!remotes.trim()) throw new Error('未配置 Git 远程仓库。');
    await git(['fetch','--quiet']);
    const { stdout: upstream } = await git(['rev-parse','--abbrev-ref','--symbolic-full-name','@{u}']).catch(() => ({stdout:''}));
    if (!upstream.trim()) throw new Error('当前分支没有上游分支，已停止发布。');
    const { stdout: counts } = await git(['rev-list','--left-right','--count',`HEAD...${upstream.trim()}`]);
    const [ahead, behind] = counts.trim().split(/\s+/).map(Number);
    if (behind > 0) throw new Error(`远程分支领先 ${behind} 个提交，请先同步后再发布。`);
    if (ahead > 0) throw new Error(`本地分支已有 ${ahead} 个未推送提交；为避免推送无关提交，本次已停止。`);
    const { stdout: status } = await git(['status','--porcelain']);
    const dirty = status.trim().split('\n').filter(Boolean).map((line) => line.slice(3));
    if (dirty.some((p) => !paths.includes(p))) throw new Error(`工作区含未选中的改动：${dirty.filter((p) => !paths.includes(p)).join('、')}`);
    const checked = await Promise.all(paths.map(async (p) => { const full=resolve(root,p); if(!full.startsWith(`${root}/`)) throw new Error('文件路径无效。'); await stat(full); return p; }));
    const { stdout: build, stderr: buildErr } = await execFileAsync('pnpm',['build'],{cwd:root,maxBuffer:10*1024*1024,env:{...process.env}});
    await git(['add','--',...checked]);
    const staged = await git(['diff','--cached','--name-only']);
    const stagedPaths = staged.stdout.trim().split('\n').filter(Boolean);
    if (stagedPaths.some((p) => !checked.includes(p))) throw new Error('暂存区包含未授权文件，已停止。');
    await git(['commit','-m',String(req.body.message || '发布文章').slice(0,100)]);
    await git(['push']);
    res.json({ output: (build+buildErr).slice(-1000), committed: stagedPaths, branch: branch.trim() });
  } catch (e: any) { res.status(409).json({ error: e.stderr || e.message || '发布失败。' }); }
});
app.listen(4311, '127.0.0.1', () => console.log('Writing Studio API listening on http://127.0.0.1:4311'));
