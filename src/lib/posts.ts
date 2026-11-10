import { getCollection, type CollectionEntry } from 'astro:content';
export type Post = CollectionEntry<'life'> | CollectionEntry<'tech'>;
export type Section = 'life' | 'tech';
export async function getPosts(section?: Section) {
  const entries = section ? await getCollection(section) : (await Promise.all([getCollection('life'), getCollection('tech')])).flat();
  return entries.filter((post) => !post.data.draft).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
export function sectionOf(post: Post): Section { return post.collection; }
export function postPath(post: Post) { return `/${post.collection}/${post.id}`; }
export function readingMinutes(body = '') {
  const cjkCharacters = (body.match(/[\u3400-\u9fff]/gu) ?? []).length;
  const latinWords = body.replace(/[\u3400-\u9fff]/gu, ' ').trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.ceil(cjkCharacters / 400 + latinWords / 200));
}
export function dateLabel(date: Date, options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }) {
  return new Intl.DateTimeFormat('zh-CN', options).format(date);
}
export function tagsOf(posts: Post[]) { return [...new Set(posts.flatMap((post) => post.data.tags))].sort((a, b) => a.localeCompare(b, 'zh-CN')); }
