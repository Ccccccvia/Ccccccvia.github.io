---
key: binary-search
locale: en
cardId: K-002
title: 'Binary search'
subtitle: 'One comparison can rule out half.'
summary: 'Sorted order makes an entire side of the midpoint impossible. Keep the remaining bounds consistent until a match appears or no candidates remain.'
topic: 'algorithms'
languages: [JavaScript]
cardArt: '/images/binary-search.svg'
facts:
  - { label: 'Probes', value: 'O(log n)' }
  - { label: 'Bounds', value: '[lo, hi]' }
tags: [search, arrays, invariants]
updated: '2026-11-18'
status: preview
---

## Why order lets us discard candidates

Consider an ascending array of finite numbers. If its middle value is smaller than the target, every value to the left is also too small. That whole region, including the midpoint, can be excluded without inspecting each element.

If the middle value is too large, discard it and everything to its right. The useful fact is order, not merely choosing a middle position. An unsorted array may yield a correct answer by coincidence, but the exclusion is no longer justified.

## Give the bounds one meaning

Use a closed interval `[lo, hi]`: both endpoints are still candidates. Initially, `lo = 0` and `hi = length - 1`.

- Continue while `lo <= hi`; equality leaves one candidate to test.
- Compare the target with `a[mid]`, not with the numeric index `mid`.
- After a mismatch, use `mid + 1` or `mid - 1` to exclude the tested position.

The invariant is simple: if a match exists, at least one match remains inside the interval. Every unsuccessful iteration shrinks that interval.

## A small executable search

This JavaScript function expects an already sorted array; it neither sorts nor modifies its input.

```js
function locate(a, target) {
  let lo = 0;
  let hi = a.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] === target) return mid;
    if (a[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

console.log(locate([2, 5, 8, 12, 16, 23], 16)); // 4
console.log(locate([2, 5, 8, 12, 16, 23], 15)); // -1
console.log(locate([], 16)); // -1
```

The result is a zero-based index, not the value found.

## Follow the surviving interval

For target `16`, the two probes are:

| Step | lo | hi | mid | a[mid] | Decision |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | 5 | 2 | 8 | Keep indices 3–5 |
| 2 | 3 | 5 | 4 | 16 | Return 4 |

For missing `15`, the midpoint indices are `2 → 4 → 3`. The bounds then become `lo = 4, hi = 3`, so the interval is empty.

An empty input starts with `hi = -1` and never enters the loop.

## Know what the guarantee covers

Halving gives **O(log n) probes**. O(log n) running time additionally assumes O(1) indexed access and comparisons; a linked list does not provide that access model. This iterative version uses O(1) auxiliary space.

With duplicates, it returns a matching position, not necessarily the first. Finding the first occurrence requires a different boundary rule. Sorting beforehand has its own cost and may change original indices.

Further reading: [CP-Algorithms: Binary search](https://cp-algorithms.com/num_methods/binary_search.html).
