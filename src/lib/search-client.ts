interface SearchArticle {
  url: string;
  meta: { title?: string; section?: string };
  excerpt: string;
}
interface Pagefind {
  search(query: string): Promise<{ results: Array<{ data(): Promise<SearchArticle> }> }>;
}

const indexPath = '/pagefind/pagefind.js';
let index: Promise<Pagefind> | undefined;

export async function findArticles(query: string, limit?: number) {
  index ??= import(/* @vite-ignore */ indexPath).catch((error) => {
    index = undefined;
    throw error;
  });
  const pagefind = await index;
  const { results } = await pagefind.search(query);
  return Promise.all(results.slice(0, limit).map((result) => result.data()));
}
