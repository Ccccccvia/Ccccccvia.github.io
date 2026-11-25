import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { knowledgeEntryId, knowledgeSchema } from './knowledge-schema';

const knowledge = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/knowledge',
    generateId: ({ data }) => knowledgeEntryId(data),
  }),
  schema: knowledgeSchema,
});

export const collections = { knowledge };
