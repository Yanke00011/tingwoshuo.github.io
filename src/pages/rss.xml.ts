import rss from '@astrojs/rss';
import { getPosts, postPath } from '@/lib/posts';
import { site } from '@/config/site';
import type { APIRoute } from 'astro';
export const prerender = true;
export const GET: APIRoute = async (context) => {
  const posts = await getPosts();
  return rss({ title: site.name, description: site.description, site: context.site!, items: posts.map((post) => ({ title: post.data.title, description: post.data.description, pubDate: post.data.pubDate, link: postPath(post), categories: post.data.tags })), customData: '<language>zh-cn</language>' });
};
