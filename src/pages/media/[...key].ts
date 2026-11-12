import type { APIRoute } from 'astro';
import type { D1Database } from '@/lib/content-db';

interface MediaBucket { get(key: string): Promise<{ body: ReadableStream<Uint8Array>; httpMetadata?: { contentType?: string }; httpEtag?: string } | null>; }
interface RuntimeLocals { runtime?: { env?: { DB?: D1Database; PRIVATE_MEDIA?: MediaBucket } }; }
const missing = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });

export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.key ?? '';
  if (!/^private\/[a-f0-9-]{36}\.webp$/u.test(key)) return missing();
  const env = (locals as RuntimeLocals).runtime?.env;
  if (!env?.DB || !env.PRIVATE_MEDIA) return new Response('Media is unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const visible = await env.DB.prepare(`SELECT m.content_type, m.sha256 FROM media m WHERE m.key = ? AND m.visibility = 'published' AND EXISTS (SELECT 1 FROM article_media am JOIN articles a ON a.id = am.article_id WHERE am.media_key = m.key AND am.revision = a.published_revision AND a.status = 'published' AND a.deleted_at IS NULL AND a.pub_date <= date('now') AND a.published_at IS NOT NULL) LIMIT 1`).bind(key).first<{ content_type: string; sha256: string | null }>();
  if (!visible) return missing();
  const object = await env.PRIVATE_MEDIA.get(key);
  if (!object) return missing();
  const headers = new Headers({
    'Content-Type': object.httpMetadata?.contentType || visible.content_type || 'image/webp',
    'Cache-Control': 'public, max-age=60, s-maxage=300, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  });
  if (object.httpEtag) headers.set('ETag', object.httpEtag);
  return new Response(object.body, { headers });
};
