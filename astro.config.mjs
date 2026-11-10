import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { site } from './src/config/site';

export default defineConfig({
  site: site.url,
  integrations: [expressiveCode({ themes: ['github-dark'], plugins: [pluginLineNumbers()] }), mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
