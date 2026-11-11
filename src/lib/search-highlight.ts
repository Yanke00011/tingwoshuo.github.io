// Match only for display. Pagefind still decides which articles are results.
export function createHighlighter(query: string) {
  const words = query.match(/[\p{L}\p{N}]+/gu) ?? [];
  const tokens = [...new Set([query.trim(), ...words])].filter(Boolean).sort((a, b) => b.length - a.length);
  const pattern = tokens.length
    ? new RegExp(tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'giu')
    : undefined;

  return (text: string) => {
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const match of pattern ? text.matchAll(pattern) : []) {
      const start = match.index;
      fragment.append(text.slice(cursor, start));
      fragment.append(makeMark(match[0]));
      cursor = start + match[0].length;
    }
    fragment.append(text.slice(cursor));
    return fragment;
  };
}

function makeMark(text: string) {
  const mark = document.createElement('mark');
  mark.className = 'search-hit';
  mark.textContent = text;
  return mark;
}

export function renderExcerpt(html: string, highlight: ReturnType<typeof createHighlighter>) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const fragment = document.createDocumentFragment();
  for (const node of template.content.childNodes) {
    const text = node.textContent ?? '';
    fragment.append(node instanceof HTMLElement && node.localName === 'mark' ? makeMark(text) : highlight(text));
  }
  return fragment;
}
