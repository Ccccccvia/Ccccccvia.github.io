import { readKnowledge, validateKnowledge } from './knowledge-content.mjs';

try {
  const entries = validateKnowledge(readKnowledge());
  console.log(`Content check passed: ${entries.length} articles, ${new Set(entries.map(entry => entry.data.key)).size} concepts.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
