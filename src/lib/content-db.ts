export type Section = 'life' | 'tech';

export interface ArticleData {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  tags: string[];
  cover?: string;
  coverAlt?: string;
  featured: boolean;
  category?: string;
  sample: boolean;
}

export interface Post {
  id: string;
  slug: string;
  collection: Section;
  data: ArticleData;
  body: string;
  html?: string;
  revision: number;
}

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}
export interface D1Database { prepare(query: string): D1Statement; }
export interface BlogLocals { runtime?: { env?: { DB?: D1Database } }; }

interface ArticleRow {
  id: string; section: Section; slug: string; title: string; description: string;
  pub_date: string; content_updated_date: string | null; body_markdown: string;
  body_html: string | null; tags_json: string; frontmatter_json: string; revision: number;
}

function dbFrom(locals?: BlogLocals): D1Database {
  const db = locals?.runtime?.env?.DB;
  if (!db) throw new Error('D1 binding DB is not available. Configure the isolated local Worker database before serving content.');
  return db;
}
function toPost(row: ArticleRow): Post {
  let frontmatter: Record<string, unknown> = {};
  try { frontmatter = JSON.parse(row.frontmatter_json); } catch { /* schema guarantees valid JSON */ }
  return {
    id: row.id,
    slug: row.slug,
    collection: row.section,
    body: row.body_markdown,
    html: row.body_html ?? undefined,
    revision: row.revision,
    data: {
      title: row.title,
      description: row.description,
      pubDate: new Date(`${row.pub_date}T00:00:00.000Z`),
      updatedDate: row.content_updated_date ? new Date(`${row.content_updated_date}T00:00:00.000Z`) : undefined,
      tags: JSON.parse(row.tags_json) as string[],
      cover: typeof frontmatter.cover === 'string' ? frontmatter.cover : undefined,
      coverAlt: typeof frontmatter.coverAlt === 'string' ? frontmatter.coverAlt : undefined,
      featured: frontmatter.featured === true,
      category: typeof frontmatter.category === 'string' ? frontmatter.category : undefined,
      sample: frontmatter.sample === true,
    },
  };
}
const PUBLIC_WHERE = "a.status = 'published' AND a.deleted_at IS NULL AND a.pub_date <= date('now') AND a.published_at IS NOT NULL AND v.revision = a.published_revision";

export async function getPosts(locals: BlogLocals, section?: Section): Promise<Post[]> {
  const query = `SELECT a.id, a.section, a.slug, v.title, v.description, v.pub_date, v.content_updated_date, v.body_markdown, v.body_html, v.tags_json, v.frontmatter_json, v.revision FROM articles a JOIN article_versions v ON v.article_id = a.id WHERE ${PUBLIC_WHERE}${section ? ' AND a.section = ?' : ''} ORDER BY v.pub_date DESC, a.id ASC`;
  const result = await (section ? dbFrom(locals).prepare(query).bind(section) : dbFrom(locals).prepare(query)).all<ArticleRow>();
  return (result.results ?? []).map(toPost);
}

export async function getPost(locals: BlogLocals, section: Section, slug: string): Promise<Post | undefined> {
  const row = await dbFrom(locals).prepare(`SELECT a.id, a.section, a.slug, v.title, v.description, v.pub_date, v.content_updated_date, v.body_markdown, v.body_html, v.tags_json, v.frontmatter_json, v.revision FROM articles a JOIN article_versions v ON v.article_id = a.id WHERE ${PUBLIC_WHERE} AND a.section = ? AND a.slug = ? LIMIT 1`).bind(section, slug).first<ArticleRow>();
  return row ? toPost(row) : undefined;
}

export function postPath(post: Post) { return `/${post.collection}/${post.slug}`; }
export function sectionOf(post: Post): Section { return post.collection; }
export function readingMinutes(body = '') {
  const cjkCharacters = (body.match(/[\u3400-\u9fff]/gu) ?? []).length;
  const latinWords = body.replace(/[\u3400-\u9fff]/gu, ' ').trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.ceil(cjkCharacters / 400 + latinWords / 200));
}
export function dateLabel(date: Date, options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }) {
  return new Intl.DateTimeFormat('zh-CN', options).format(date);
}
export function tagsOf(posts: Post[]) { return [...new Set(posts.flatMap((post) => post.data.tags))].sort((a, b) => a.localeCompare(b, 'zh-CN')); }

export interface SearchResult { section: Section; slug: string; title: string; description: string; pubDate: string; tags: string[]; excerpt: string; }
export async function searchPublishedArticles(locals: BlogLocals, query: string, section?: Section, limit = 20): Promise<SearchResult[]> {
  const q = query.trim().normalize('NFKC').slice(0, 80);
  if (q.length < 1) return [];
  const db = dbFrom(locals);
  const boundSection = section ? ' AND a.section = ?' : '';
  const cap = Math.min(50, Math.max(1, limit));
  if ([...q].length >= 3 && !/["*:^]/u.test(q)) {
    const statement = db.prepare(`SELECT a.section, a.slug, v.title, v.description, v.pub_date, v.tags_json, snippet(article_search, 4, '', '', ' … ', 20) AS excerpt FROM article_search JOIN articles a ON a.id = article_search.article_id JOIN article_versions v ON v.article_id = a.id AND v.revision = a.published_revision WHERE article_search MATCH ? AND ${PUBLIC_WHERE}${boundSection} ORDER BY v.pub_date DESC LIMIT ?`);
    const binds: unknown[] = [`"${q.replaceAll('"', '""')}"`];
    if (section) binds.push(section);
    binds.push(cap);
    const rows = await statement.bind(...binds).all<Record<string, unknown>>();
    return (rows.results ?? []).map((row) => ({ section: row.section as Section, slug: String(row.slug), title: String(row.title), description: String(row.description), pubDate: String(row.pub_date), tags: JSON.parse(String(row.tags_json)) as string[], excerpt: String(row.excerpt ?? '') }));
  }
  // Trigram FTS5 has no token for one or two character searches. Keep this
  // narrow fallback only for short queries or FTS operators, while normal
  // Chinese/English substring search is served by the maintained FTS index.
  const escaped = q.replace(/[\\%_]/g, (character) => `\\${character}`);
  const statement = db.prepare(`SELECT a.section, a.slug, v.title, v.description, v.pub_date, v.tags_json, substr(v.body_markdown, max(1, instr(v.body_markdown, ?) - 60), 180) AS excerpt FROM articles a JOIN article_versions v ON v.article_id = a.id WHERE ${PUBLIC_WHERE}${section ? ' AND a.section = ?' : ''} AND (v.title LIKE ? ESCAPE '\\' OR v.description LIKE ? ESCAPE '\\' OR v.tags_json LIKE ? ESCAPE '\\' OR v.body_markdown LIKE ? ESCAPE '\\') ORDER BY v.pub_date DESC LIMIT ?`);
  const pattern = `%${escaped}%`;
  const binds: unknown[] = [q];
  if (section) binds.push(section);
  binds.push(pattern, pattern, pattern, pattern, cap);
  const rows = await statement.bind(...binds).all<Record<string, unknown>>();
  return (rows.results ?? []).map((row) => ({ section: row.section as Section, slug: String(row.slug), title: String(row.title), description: String(row.description), pubDate: String(row.pub_date), tags: JSON.parse(String(row.tags_json)) as string[], excerpt: String(row.excerpt ?? '') }));
}
