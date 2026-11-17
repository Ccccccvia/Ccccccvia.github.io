import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/knowledge' }),
  schema: z.object({
    key: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    locale: z.enum(['zh', 'en']),
    cardId: z.string(),
    title: z.string(),
    subtitle: z.string(),
    summary: z.string(),
    collection: z.string(),
    cardArt: z.string(),
    facts: z.array(z.object({ label: z.string(), value: z.string() })),
    tags: z.array(z.string()),
    updated: z.string(),
    status: z.enum(['preview', 'published']),
  }),
});

export const collections = { knowledge };
