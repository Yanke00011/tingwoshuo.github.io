import type { APIRoute } from 'astro';
import { searchPublishedArticles, type Section } from '@/lib/content-db';

export const GET: APIRoute = async ({ locals, url }) => {
  const query = url.searchParams.get('q') ?? '';
  const rawSection = url.searchParams.get('section');
  const section = rawSection === 'life' || rawSection === 'tech' ? rawSection as Section : undefined;
  const articles = await searchPublishedArticles(locals, query, section);
  return Response.json({ articles }, { headers: { 'Cache-Control': 'public, max-age=0, must-revalidate', 'X-Content-Type-Options': 'nosniff' } });
};
