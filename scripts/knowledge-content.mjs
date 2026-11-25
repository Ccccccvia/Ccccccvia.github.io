import { globSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from 'astro/markdown';
import { knowledgeEntryId, knowledgeSchema } from '../src/knowledge-schema.ts';
import { locales } from '../src/i18n/ui.ts';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = path.join(projectRoot, 'src/content/knowledge');
export const reservedKeys = readdirSync(path.join(projectRoot, 'src/pages/[lang]/knowledge'))
  .filter(name => name.endsWith('.astro') && !name.includes('['))
  .map(name => name.slice(0, -'.astro'.length));
const fenceLanguages = { js: 'JavaScript', javascript: 'JavaScript', cs: 'C#', csharp: 'C#', sql: 'SQL' };

export function readKnowledge() {
  return [...globSync('**/*.md', { cwd: contentRoot })].sort().map(file => {
    const { frontmatter, content } = parseFrontmatter(readFileSync(path.join(contentRoot, file), 'utf8'));
    return { file: file.split(path.sep).join('/'), data: frontmatter, body: content };
  });
}

export function validateKnowledge(source) {
  const errors = [];
  const entries = [];
  const keys = new Map();
  const ids = new Map();
  const translations = new Map();
  for (const entry of source) {
    const parsed = knowledgeSchema.safeParse(entry.data);
    if (!parsed.success) {
      errors.push(`${entry.file}: ${parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
      continue;
    }
    const data = parsed.data;
    entries.push({ ...entry, data });
    const key = knowledgeEntryId(data);
    const id = `${data.locale}/${data.cardId}`;
    if (keys.has(key)) errors.push(`${entry.file}: duplicate locale/key ${key} (also ${keys.get(key)})`);
    if (ids.has(id)) errors.push(`${entry.file}: duplicate locale/cardId ${id} (also ${ids.get(id)})`);
    keys.set(key, entry.file);
    ids.set(id, entry.file);
    if (reservedKeys.includes(data.key)) errors.push(`${entry.file}: reserved route key ${data.key}`);
    if (new Set(data.languages).size !== data.languages.length) errors.push(`${entry.file}: duplicate languages`);
    for (const match of entry.body.matchAll(/^\s{0,3}(?:`{3,}|~{3,})(\w+)[^\r\n]*$/gm)) {
      const language = fenceLanguages[match[1].toLowerCase()];
      if (language && !data.languages.includes(language)) errors.push(`${entry.file}: ${match[1]} code fence requires languages: ${language}`);
    }
    const asset = path.resolve(projectRoot, 'public', `.${data.cardArt}`);
    const publicRoot = path.join(projectRoot, 'public') + path.sep;
    if (!data.cardArt.startsWith('/') || !asset.startsWith(publicRoot) || !existsSync(asset)) {
      errors.push(`${entry.file}: missing or invalid cardArt ${data.cardArt}`);
    }
    const group = translations.get(data.key) ?? [];
    group.push({ ...entry, data });
    translations.set(data.key, group);
  }
  for (const [key, group] of translations) {
    for (const locale of locales) {
      if (!group.some(entry => entry.data.locale === locale)) errors.push(`${key}: missing ${locale} translation`);
    }
    const first = group[0].data;
    for (const entry of group.slice(1)) {
      for (const field of ['cardId', 'topic']) {
        if (entry.data[field] !== first[field]) errors.push(`${entry.file}: translations disagree on ${field} for ${key}`);
      }
      if (JSON.stringify([...entry.data.languages].sort()) !== JSON.stringify([...first.languages].sort())) {
        errors.push(`${entry.file}: translations disagree on languages for ${key}`);
      }
    }
  }
  if (errors.length) throw new Error(`Knowledge content validation failed:\n- ${errors.join('\n- ')}`);
  return entries;
}
