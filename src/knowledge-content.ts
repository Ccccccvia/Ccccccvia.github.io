import { getCollection } from 'astro:content';
import type { Locale } from './i18n/ui';

export async function getKnowledgeEntries(locale?: Locale) {
  const entries = await getCollection('knowledge', ({ data }) => locale === undefined || data.locale === locale);
  return entries.toSorted((a, b) => a.data.cardId.localeCompare(b.data.cardId));
}
