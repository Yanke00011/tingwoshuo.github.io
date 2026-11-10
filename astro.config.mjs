import { defineConfig } from 'astro/config';
import remarkSemanticTone, { remarkSemanticToneMdx } from './src/lib/remark-semantic-tone.ts';
import expressiveCode from 'astro-expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { site } from './src/config/site';

export default defineConfig({
  site: site.url,
  integrations: [expressiveCode({ themes: ['github-dark'], plugins: [pluginLineNumbers()] }), mdx({ remarkPlugins: [remarkSemanticToneMdx] }), sitemap()],
  markdown: { remarkPlugins: [remarkSemanticTone] },
  vite: { plugins: [tailwindcss()] },
});
