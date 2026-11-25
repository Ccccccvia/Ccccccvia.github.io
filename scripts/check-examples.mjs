import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read = (slug, locale = 'en') => fs.readFileSync(new URL(`../src/content/knowledge/${locale}/${slug}.md`, import.meta.url), 'utf8');
const blocks = (text, lang) => [...text.matchAll(new RegExp('```' + lang + '\\r?\\n([\\s\\S]*?)```', 'g'))].map(m => m[1]);
for (const slug of ['binary-search', 'floating-point-rounding', 'closure-capture', 'stack-lifo', 'ordered-vs-sorted']) {
  const lang = slug === 'closure-capture' ? 'csharp' : 'js';
  assert.deepEqual(blocks(read(slug), lang), blocks(read(slug, 'zh'), lang));
}
const capture = blocks(read('closure-capture'), 'csharp')[0];
assert.equal(capture.replaceAll('\r\n', '\n'), fs.readFileSync(new URL('../tests/fixtures/closure-capture/CaptureDemo.cs', import.meta.url), 'utf8'));
const results = [];
const sandbox = vm.createContext({console:{log: (...args) => results.push(args)}});
vm.runInContext(blocks(read('binary-search'), 'js')[0], sandbox);
assert.deepEqual(results, [[4], [-1], [-1]]);
for (const a of [[], [1], [1,1,1], [0,2,4,6], [-9,-5,0,8], Array.from({length:1000}, (_,i) => i*2)]) {
  for (const target of [-10, -9, 0, 1, 2, 6, 8, 998, 1998, 2000]) {
    const idx = sandbox.locate(a, target);
    assert.equal(idx === -1, !a.includes(target));
    if (idx !== -1) assert.equal(a[idx], target);
  }
}
results.length = 0;
for (const block of blocks(read('floating-point-rounding'), 'js')) vm.runInContext(block, sandbox);
assert.deepEqual(results, [[0.30000000000000004], [false], [true], [true], [true]]);
for (const [x, expected] of [[0.1,'0.10000000000000001'],[0.2,'0.20000000000000001'],[0.3,'0.29999999999999999'],[0.1+0.2,'0.30000000000000004']]) assert.equal(x.toPrecision(17), expected);
assert.equal(encodeURIComponent('+'), '%2B');
assert.equal(decodeURIComponent('+'), '+');
assert.equal(encodeURIComponent('%26'), '%2526');
assert.equal(decodeURIComponent('%2526'), '%26');
assert.equal(decodeURIComponent('%26'), '&');
assert.equal(Math.trunc(32767.9), 32767);
assert.deepEqual(blocks(read('http-vs-html'), 'http'), blocks(read('http-vs-html', 'zh'), 'http'));
for (const locale of ['en', 'zh']) {
  const response = blocks(read('http-vs-html', locale), 'http')[1].replaceAll('\r\n', '\n').trimEnd();
  const [headers, body] = response.split('\n\n');
  assert.equal(Buffer.byteLength(body, 'utf8'), Number(headers.match(/Content-Length: (\d+)/)[1]));
  const payload = Buffer.byteLength('HELLO WORLD!', 'ascii');
  const sizes = [payload, payload + 20, payload + 20 + 20, payload + 20 + 20 + 14 + 4];
  const tableSizes = [...read('network-encapsulation', locale).matchAll(/^\|[^\r\n]*\| (\d+) \|$/gm)].map(match => Number(match[1]));
  assert.deepEqual(tableSizes, sizes);
}
results.length = 0;
vm.runInContext(blocks(read('stack-lifo'), 'js')[0], sandbox);
assert.deepEqual(results, [[true], [false], [true], [false], [false], [true]]);
let samples = [''];
let bracketChecks = 0;
for (let length = 0; length <= 5; length++) {
  for (const sample of samples) {
    let reduced = sample;
    let previous;
    do {
      previous = reduced;
      reduced = reduced.replace(/\(\)|\[\]|\{\}/g, '');
    } while (reduced !== previous);
    assert.equal(sandbox.isBalanced(sample), reduced === '', sample);
    bracketChecks++;
  }
  if (length < 5) samples = samples.flatMap(sample => [...'()[]{}'].map(char => sample + char));
}
for (const [sample, expected] of [['({[]})', true], ['plain text', true], ['"("', false], ['['.repeat(1000) + ']'.repeat(1000), true]]) {
  assert.equal(sandbox.isBalanced(sample), expected);
}
results.length = 0;
vm.runInContext(blocks(read('ordered-vs-sorted'), 'js')[0], sandbox);
assert.deepEqual(results, [['[30,10,20]'], ['[10,20,30]'], [false]]);
assert.equal(vm.runInContext('JSON.stringify([2, 10, -1, 2].toSorted((a, b) => a - b))', sandbox), '[-1,2,2,10]');
assert.equal(vm.runInContext('JSON.stringify([2, 10].toSorted())', sandbox), '[10,2]');
console.log(`PASS: bilingual code equality; 60 binary-search edge cases; floating-point outputs; URL corrections; C# source equality; HTTP body length; encapsulation byte table; ${bracketChecks} exhaustive bracket strings plus boundary cases; numeric sorted copy.`);
