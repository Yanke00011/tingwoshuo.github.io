export async function findArticles(query: string, limit?: number) {
  const response = await fetch(`/api/search.json?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(`Search API returned ${response.status}`);
  const data = await response.json() as { articles: Array<{ section: string; slug: string; title: string; description: string; excerpt: string }> };
  return data.articles.slice(0, limit).map((article) => ({
    url: `/${article.section}/${encodeURIComponent(article.slug)}`,
    meta: { title: article.title, section: article.section === 'life' ? '闲聊' : '技术' },
    excerpt: article.excerpt || article.description,
  }));
}
