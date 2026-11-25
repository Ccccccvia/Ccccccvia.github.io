import { pagePath, type Locale } from './i18n/ui.ts';
import type { TopicId } from './knowledge.ts';

type CatalogFilters = { q?: string; topic?: TopicId; language?: string };

export function knowledgeEntryPath(locale: Locale, key: string): string {
  return `${pagePath(locale, 'knowledge')}${encodeURIComponent(key)}/`;
}

export function knowledgeCatalogPath(locale: Locale, filters: CatalogFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.topic) params.set('topic', filters.topic);
  if (filters.language) params.set('language', filters.language);
  const query = params.toString();
  return `${pagePath(locale, 'knowledge')}sets/${query ? `?${query}` : ''}`;
}

export function knowledgeDirectoryPath(locale: Locale, group?: string): string {
  return `${pagePath(locale, 'knowledge')}directory/${group ? `#${encodeURIComponent(group)}` : ''}`;
}
