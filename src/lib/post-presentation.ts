import type { Post } from '@/lib/posts';

// Only use authored Markdown images with a portable URL. Other media stays in the article.
export function firstInlineImage(body = '') {
  let fence: string | undefined;
  for (const line of body.split('\n')) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
      continue;
    }
    if (marker) {
      fence = marker[1];
      continue;
    }

    const image = line.match(/^ {0,3}!\[([^\]]*)\]\(<?((?:\/(?![\/\\])|https:\/\/)[^\s<>\\)]+)>?(?:\s+"[^"]*")?\)/u);
    if (image) return { src: image[2], alt: image[1] };
  }
}

export function postPresentation(post: Post, compact: boolean, treatment?: 'lead' | 'spotlight') {
  const cover = post.data.cover ? { src: post.data.cover, alt: post.data.coverAlt ?? '' } : undefined;
  if (compact) return { variant: 'text', image: cover };
  const image = cover ?? firstInlineImage(post.body);
  if (treatment === 'spotlight') return { variant: 'spotlight', image };
  if (treatment === 'lead') return { variant: image ? 'mixed' : 'spotlight', image };
  if (post.collection === 'tech') return { variant: 'technical', image };
  if (cover) return { variant: 'cover', image: cover };
  return { variant: image ? 'mixed' : 'text', image };
}
