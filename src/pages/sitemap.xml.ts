import type { APIRoute } from 'astro';
import { getPosts, postPath } from '@/lib/posts';
import { publicSiteBase } from '@/lib/site-url';
const xml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export const GET: APIRoute = async ({ locals, url }) => {
  const staticPaths = ['/', '/life', '/tech', '/archive', '/about'];
  const posts = await getPosts(locals);
  const urls = [...staticPaths.map((path) => ({ path, lastmod: undefined as Date | undefined })), ...posts.map((post) => ({ path: postPath(post), lastmod: post.data.updatedDate ?? post.data.pubDate }))];
  const base = publicSiteBase(url, locals);
  const entries = urls.map(({ path, lastmod }) => `<url><loc>${xml(new URL(path, base).toString())}</loc>${lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' } });
};
