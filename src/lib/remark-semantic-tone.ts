/** Compile the editor's constrained [[tone|text]] and ==highlight== syntax into safe inline AST nodes. */
type Node = { type: string; value?: string; children?: Node[]; [key: string]: any };
function escapeHtml(value: string) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function transform(mdx: boolean) {
  return () => (tree: Node) => {
    const visit = (node: Node) => {
      if (!node.children) return;
      const next: Node[] = [];
      for (const child of node.children) {
        if (child.type === 'text' && child.value) {
          const value = child.value; const pattern = /\[\[(default|muted|blue|green|orange|red|purple)\|([^\[\]\n]+)\]\]|==([^=\n]+)==/g;
          let last = 0; let match: RegExpExecArray | null;
          while ((match = pattern.exec(value))) {
            if (match.index > last) next.push({ type: 'text', value: value.slice(last, match.index) });
            const content = escapeHtml(match[2] ?? match[3]);
            const html = match[3] !== undefined ? `<mark>${content}</mark>` : `<span data-tone="${match[1]}">${content}</span>`;
            next.push(mdx ? (match[3] !== undefined
              ? { type: 'mdxJsxTextElement', name: 'mark', attributes: [], children: [{ type: 'text', value: match[3] }] }
              : { type: 'mdxJsxTextElement', name: 'span', attributes: [{ type: 'mdxJsxAttribute', name: 'data-tone', value: match[1] }], children: [{ type: 'text', value: match[2] }] }) : { type: 'html', value: html });
            last = pattern.lastIndex;
          }
          if (!last) next.push(child); else if (last < value.length) next.push({ type: 'text', value: value.slice(last) });
        } else { visit(child); next.push(child); }
      }
      node.children = next;
    };
    visit(tree);
  };
}
export default transform(false);
export const remarkSemanticToneMdx = transform(true);
