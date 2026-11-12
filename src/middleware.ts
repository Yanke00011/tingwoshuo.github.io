import { defineMiddleware } from 'astro:middleware';
import { isStaging } from '@/lib/site-url';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const headers = new Headers(response.headers);
  if (context.url.pathname.startsWith('/api/')) {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    headers.set('X-Content-Type-Options', 'nosniff');
  } else if (headers.get('Content-Type')?.includes('text/html')) {
    // Content pages are always revalidated so withdrawals and edits do not
    // linger in browser/CDN caches. Stable media uses its own short policy.
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    headers.set('X-Content-Type-Options', 'nosniff');
  }
  if (isStaging(context.locals)) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
