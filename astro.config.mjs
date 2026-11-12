import { defineConfig } from 'astro/config';
import remarkSemanticTone, { remarkSemanticToneMdx } from './src/lib/remark-semantic-tone.ts';
import expressiveCode from 'astro-expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import { site } from './src/config/site';

export default defineConfig({
  site: site.url,
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough', platformProxy: { configPath: './wrangler.local.jsonc' } }),
  integrations: [expressiveCode({ themes: ['github-dark'], plugins: [pluginLineNumbers()] }), mdx({ remarkPlugins: [remarkSemanticToneMdx] })],
  markdown: { remarkPlugins: [remarkSemanticTone] },
  vite: { plugins: [tailwindcss()] },
});
