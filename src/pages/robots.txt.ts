import type { APIRoute } from 'astro';
import { isStaging, publicSiteBase } from '@/lib/site-url';
export const GET: APIRoute = ({ locals, url }) => {
  const staging = isStaging(locals);
  const sitemap = new URL('/sitemap.xml', publicSiteBase(url, locals)).toString();
  const content = staging ? `User-agent: *\nDisallow: /\nSitemap: ${sitemap}\n` : `User-agent: *\nAllow: /\nSitemap: ${sitemap}\n`;
  return new Response(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate', ...(staging ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}) } });
};
