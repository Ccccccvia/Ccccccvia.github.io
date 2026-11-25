import { z } from 'astro/zod';
import { locales } from './i18n/ui.ts';
import { topicIds, programmingLanguages } from './knowledge.ts';

export function knowledgeEntryId(data: Record<string, unknown>) {
  return `${data.locale}/${data.key}`;
}

export const knowledgeSchema = z.object({
  key: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  locale: z.enum(locales),
  cardId: z.string().min(1),
  title: z.string(),
  subtitle: z.string(),
  summary: z.string(),
  topic: z.enum(topicIds),
  languages: z.array(z.enum(programmingLanguages)).default([]),
  cardArt: z.string(),
  facts: z.array(z.object({ label: z.string(), value: z.string() })),
  tags: z.array(z.string()),
  updated: z.string(),
  status: z.enum(['preview', 'published']),
});
