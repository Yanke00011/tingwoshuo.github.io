import type { APIRoute } from 'astro';
import { getPosts, postPath } from '@/lib/posts';
import { site } from '@/config/site';
import { publicSiteBase } from '@/lib/site-url';
const xml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export const GET: APIRoute = async ({ locals, url }) => {
  const posts = await getPosts(locals);
  const base = publicSiteBase(url, locals);
  const items = posts.slice(0, 50).map((post) => `<item><title>${xml(post.data.title)}</title><description>${xml(post.data.description)}</description><link>${xml(new URL(postPath(post), base).toString())}</link><guid isPermaLink="true">${xml(new URL(postPath(post), base).toString())}</guid><pubDate>${post.data.pubDate.toUTCString()}</pubDate>${post.data.tags.map((tag) => `<category>${xml(tag)}</category>`).join('')}</item>`).join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(site.name)}</title><description>${xml(site.description)}</description><link>${xml(base.toString())}</link><language>zh-cn</language>${items}</channel></rss>`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' } });
};
