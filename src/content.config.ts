import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articleSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  category: z.string().optional(),
  sample: z.boolean().default(false),
});

export const collections = {
  life: defineCollection({ loader: glob({ base: './src/content/life', pattern: '**/*.{md,mdx}' }), schema: articleSchema }),
  tech: defineCollection({ loader: glob({ base: './src/content/tech', pattern: '**/*.{md,mdx}' }), schema: articleSchema }),
};
