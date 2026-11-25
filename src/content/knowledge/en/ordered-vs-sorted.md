---
key: ordered-vs-sorted
locale: en
cardId: K-013
title: 'Ordered does not mean sorted'
subtitle: 'A first item is not necessarily the smallest.'
summary: 'Current order describes where elements are; a sorting rule describes how they should be arranged. Separate order, comparators, and access APIs with a numeric sorted copy.'
topic: algorithms
languages: [JavaScript]
cardArt: '/images/ordered-vs-sorted.svg'
facts:
  - { label: 'Ordered', value: 'Defined current order' }
  - { label: 'Sorted', value: 'Follows a comparator' }
tags: [sequences, sorting, containers]
updated: '2026-11-20'
status: preview
---

## First ask “in what order?”

Here, **ordered** means elements have a defined current order, not necessarily smallest to largest.
**Sorted** means that order satisfies a specified comparison rule, such as ascending numeric value.

The array `[30, 10, 20]` has 30 first, 10 second, and 20 third.
Its positions are well-defined, but it is not numerically ascending: 30 is larger than the following 10.

| Question | Answer for this array |
| --- | --- |
| What is at index 0? | 30 |
| What is the minimum? | 10; looking only at the first position is insufficient |
| Is there a defined order? | Yes: 30 → 10 → 20 |
| Is it sorted numerically ascending? | No |

“Ordered” does not mean the order can never change.
Insertion, deletion, reversal, and sorting can change positions; a position keeps its value only while the array is unchanged.

## Sorting applies a rule

A comparator receives two elements, `a` and `b`; the sign of its result specifies their relative order.
This example accepts finite numbers only and uses `a - b` to request numeric ascending order explicitly.

| Comparison result | Required relative order | Example |
| --- | --- | --- |
| Less than 0 | a before b | `10 - 30 = -20` |
| Greater than 0 | a after b | `30 - 20 = 10` |
| Equal to 0 | Equal under this rule | `20 - 20 = 0` |

The result need not be exactly -1 or 1; its sign matters.
This table explains the rule, not the order in which a sorting algorithm calls the comparator.

## Create a sorted copy

Run this in a JavaScript environment that supports `Array.prototype.toSorted()`:

```js
const original = [30, 10, 20];
const sorted = original.toSorted((a, b) => a - b);

console.log(JSON.stringify(original)); // [30,10,20]
console.log(JSON.stringify(sorted));   // [10,20,30]
console.log(original === sorted);      // false
```

`toSorted` returns a new array; the original still has the order 30 → 10 → 20.
The last line checks whether these are the same array object, not whether their elements are equal.
By contrast, `sort` modifies the array it is called on; do not confuse the two APIs.

## Do not let the default hide a mistake

Without a comparator, default sorting converts elements to strings and compares their UTF-16 code unit sequences.
It does not compare numeric magnitudes by default: the string for 10 comes before the string for 2.

For `[30, 10, 20]`, string order happens to agree with numeric ascending order, masking this mistake.
Getting an apparently correct answer for these three numbers does not justify omitting the comparator.

Pass `a - b` explicitly instead of depending on that coincidence.
Mixed strings, `NaN`, or special business rules need a separately defined comparator and are outside this example.

## Ordered iteration is not positional indexing

JavaScript `Map` and `Set` both iterate in insertion order, but neither provides sequence-style positional indexing.
Do not import the contract of a similarly named type from another language: Python `set` ordering rules do not describe JavaScript `Set`.

| JavaScript container | Order contract | Main access method |
| --- | --- | --- |
| `Array` | Elements have a current index order | `items[0]` accesses a position |
| `Map` | Iteration preserves insertion order | `map.get(key)` looks up a key |
| `Set` | Iteration preserves insertion order | `set.has(value)` checks membership |

`map.get(0)` looks for key 0, not “the first entry.”
To obtain the first iterated Map or Set item, use an iterator rather than assuming a sequence index exists.
Deleting and reinserting an entry puts it at the end of insertion order; order can still change.

## Ask three separate questions

1. What iteration order does this container promise?
2. Does its API support access by position, key, or membership?
3. Does the current order satisfy my chosen comparison rule?

These questions are more useful for choosing an API than the label “ordered container” alone.
A stack also has an order but restricts which end you can remove from; see [stacks and LIFO](/en/knowledge/stack-lifo/).

## References

- [MDN: Array.prototype.toSorted()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)
- [MDN: Keyed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections)
