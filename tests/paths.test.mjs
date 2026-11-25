import test from 'node:test';
import assert from 'node:assert/strict';
import { knowledgeEntryPath, knowledgeCatalogPath, knowledgeDirectoryPath } from '../src/knowledge-paths.ts';
import { locales } from '../src/i18n/ui.ts';
import { readKnowledge } from '../scripts/knowledge-content.mjs';

for (const locale of locales) {
  test(`${locale}: detail paths match source identities`, () => {
    for (const entry of readKnowledge().filter(entry => entry.data.locale === locale)) {
      assert.equal(knowledgeEntryPath(locale, entry.data.key), `/${locale}/knowledge/${entry.data.key}/`);
    }
  });

  test(`${locale}: catalog and directory keep their public routes`, () => {
    assert.equal(knowledgeCatalogPath(locale), `/${locale}/knowledge/sets/`);
    assert.equal(knowledgeCatalogPath(locale, { q: '', language: '' }), `/${locale}/knowledge/sets/`);
    assert.equal(knowledgeDirectoryPath(locale), `/${locale}/knowledge/directory/`);
    assert.equal(knowledgeDirectoryPath(locale, 'networks-security'), `/${locale}/knowledge/directory/#networks-security`);
  });

  test(`${locale}: filters encode values without creating extra parameters or fragments`, () => {
    const filters = Object.freeze({ q: 'N+1 & 百分比 100% # /?', topic: 'programming', language: 'C#' });
    const url = new URL(knowledgeCatalogPath(locale, filters), 'http://localhost');
    assert.equal(url.pathname, `/${locale}/knowledge/sets/`);
    assert.equal(url.hash, '');
    assert.deepEqual(Object.fromEntries(url.searchParams), filters);
    assert.equal(knowledgeCatalogPath(locale, { language: 'C#' }), `/${locale}/knowledge/sets/?language=C%23`);
    assert.equal(knowledgeCatalogPath(locale, { topic: 'web' }), `/${locale}/knowledge/sets/?topic=web`);
  });

  test(`${locale}: independent path calls do not retain earlier filters`, () => {
    const before = knowledgeCatalogPath(locale, { language: 'SQL' });
    knowledgeCatalogPath(locale, { q: 'different', topic: 'web' });
    assert.equal(knowledgeCatalogPath(locale, { language: 'SQL' }), before);
    assert.equal(knowledgeCatalogPath(locale), `/${locale}/knowledge/sets/`);
  });
}
