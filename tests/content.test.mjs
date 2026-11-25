import test from 'node:test';
import assert from 'node:assert/strict';
import { readKnowledge, validateKnowledge, reservedKeys } from '../scripts/knowledge-content.mjs';
import { locales } from '../src/i18n/ui.ts';
import { knowledgeEntryId } from '../src/knowledge-schema.ts';
import { topicIds, programmingLanguages, featuredCardLimit, selectFeaturedCards } from '../src/knowledge.ts';

const source = readKnowledge();
const valid = () => structuredClone(source);
const pair = () => valid().filter(entry => entry.data.key === source[0].data.key);

function rejects(label, change, pattern) {
  test(label, () => {
    const entries = valid();
    change(entries);
    assert.throws(() => validateKnowledge(entries), pattern);
  });
}

test('all current articles satisfy the shared schema and collection rules', () => {
  const entries = validateKnowledge(source);
  assert.equal(entries.length, source.length);
  for (const locale of locales) {
    assert.equal(entries.filter(entry => entry.data.locale === locale).length, new Set(entries.map(entry => entry.data.key)).size);
  }
});

test('Astro IDs use locale/key even when translations have the same legacy slug', () => {
  const entries = pair();
  for (const entry of entries) entry.data.slug = 'same-legacy-slug';
  assert.doesNotThrow(() => validateKnowledge(entries));
  const ids = entries.map(entry => knowledgeEntryId(entry.data));
  assert.equal(new Set(ids).size, entries.length);
  assert.deepEqual(ids, entries.map(entry => `${entry.data.locale}/${entry.data.key}`));
});

rejects('duplicate localized keys are rejected', entries => entries.push(structuredClone(entries[0])), /duplicate locale\/key/);
rejects('different concepts cannot reuse a card ID in one locale', entries => {
  const other = entries.find(entry => entry.data.locale === entries[0].data.locale && entry.data.key !== entries[0].data.key);
  other.data.cardId = entries[0].data.cardId;
}, /duplicate locale\/cardId/);
for (const reserved of reservedKeys) {
  rejects(`page route ${reserved} cannot be a card key`, entries => { entries[0].data.key = reserved; }, /reserved route key/);
}
rejects('missing translation is rejected', entries => entries.splice(0, 1), /missing .* translation/);
rejects('translation card IDs must agree', entries => { entries[0].data.cardId = 'K-test-different'; }, /disagree on cardId/);
rejects('translation topics must agree', entries => {
  entries[0].data.topic = topicIds.find(topic => topic !== entries[0].data.topic);
}, /disagree on topic/);
rejects('translation language sets must agree', entries => {
  const entry = entries.find(entry => (entry.data.languages?.length ?? 0) < programmingLanguages.length);
  entry.data.languages = [...(entry.data.languages ?? []), programmingLanguages.find(language => !entry.data.languages?.includes(language))];
}, /disagree on languages/);
rejects('duplicate language labels are rejected', entries => { entries[0].data.languages = ['JavaScript', 'JavaScript']; }, /duplicate languages/);
rejects('JavaScript fences cannot lose their language label', entries => {
  const entry = entries.find(entry => /^```js\s*$/m.test(entry.body));
  entry.data.languages = [];
}, /code fence requires languages: JavaScript/);
rejects('SQL fences cannot lose their language label', entries => {
  const entry = entries.find(entry => /^```sql\s*$/m.test(entry.body));
  entry.data.languages = [];
}, /code fence requires languages: SQL/);
rejects('unknown topic is rejected by the same schema Astro uses', entries => { entries[0].data.topic = 'not-a-topic'; }, /topic:/);
rejects('unknown language is rejected', entries => { entries[0].data.languages = ['not-a-language']; }, /languages/);
rejects('unknown locale is rejected', entries => { entries[0].data.locale = 'not-a-locale'; }, /locale:/);
rejects('invalid URL key is rejected', entries => { entries[0].data.key = '../invalid'; }, /key:/);
rejects('missing card art is rejected', entries => { entries[0].data.cardArt = '/images/nonexistent-test-asset.svg'; }, /missing or invalid cardArt/);
rejects('card art cannot traverse outside public', entries => { entries[0].data.cardArt = '/../package.json'; }, /missing or invalid cardArt/);

test('language ordering does not create a false bilingual mismatch', () => {
  const entries = pair();
  for (const entry of entries) { entry.body = ''; entry.data.languages = [...programmingLanguages]; }
  entries[0].data.languages.reverse();
  assert.doesNotThrow(() => validateKnowledge(entries));
});
test('articles without code can omit language labels', () => {
  const entries = pair();
  for (const entry of entries) { entry.body = ''; delete entry.data.languages; }
  assert(validateKnowledge(entries).every(entry => entry.data.languages.length === 0));
});
test('translated text, dates and preview labels remain independent', () => {
  const entries = pair();
  entries[0].data.title = 'A different translated title';
  entries[0].data.updated = '2026-11-20';
  entries[0].data.status = 'published';
  assert.equal(validateKnowledge(entries).length, entries.length);
});

for (const size of [0, 1, featuredCardLimit - 1, featuredCardLimit, featuredCardLimit + 1, featuredCardLimit * 3]) {
  test(`featured pool of ${size} respects the limit without duplicates or source mutation`, () => {
    const cards = Object.freeze(Array.from({ length: size }, (_, id) => ({ id })));
    const original = [...cards];
    for (const value of [0, 0.5, 1 - Number.EPSILON]) {
      const selected = selectFeaturedCards(cards, () => value);
      assert.equal(selected.length, Math.min(featuredCardLimit, cards.length));
      assert.equal(new Set(selected).size, selected.length);
      assert(selected.every(card => cards.includes(card)));
      if (size <= featuredCardLimit) assert.deepEqual(new Set(selected), new Set(cards));
      assert.deepEqual(cards, original);
    }
  });
}

test('every localized article can be selected, including members beyond the fallback', () => {
  for (const locale of locales) {
    const cards = source.filter(entry => entry.data.locale === locale);
    for (let index = 0; index < cards.length; index++) {
      const selected = selectFeaturedCards(cards, () => (index + 0.5) / cards.length);
      assert.equal(selected[0], cards[index]);
      assert(selected.every(entry => entry.data.locale === locale));
    }
  }
});

test('featured selection draws again instead of caching its previous result', () => {
  const cards = Array.from({ length: featuredCardLimit + 1 }, (_, index) => index);
  const first = selectFeaturedCards(cards, () => 0);
  const next = selectFeaturedCards(cards, () => 1 - Number.EPSILON);
  assert.notDeepEqual(first, next);
  assert.equal(first[0], cards[0]);
  assert.equal(next[0], cards.at(-1));
});
