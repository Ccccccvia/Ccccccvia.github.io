---
key: floating-point-rounding
locale: en
cardId: K-005
title: 'Floating-point rounding'
subtitle: 'The number line has discrete stops.'
summary: 'Some decimal fractions lie between binary floating-point values. Rounding literals and arithmetic can put mathematically equal expressions at different stops.'
topic: 'organization'
cardArt: '/images/floating-point-rounding.svg'
facts:
  - { label: '1/4 in binary', value: '0.01₂' }
  - { label: 'Gap near 0.3', value: '2⁻⁵⁴' }
languages: [JavaScript]
tags: [binary64, precision]
updated: '2026-11-18'
status: preview
---

## Why one quarter fits but one tenth does not

A finite binary fraction is an integer divided by a power of two. After reducing a fraction, its denominator must therefore contain no prime factor other than two for its binary expansion to terminate.

`1/4 = 0.01₂` terminates. But `1/10` still has a factor of five in its denominator, so its binary digits repeat: `0.000110011…₂`. A fixed-width format must approximate it.

## Rounding happens more than once

JavaScript’s ordinary `Number` uses binary64. Decimal literals such as `0.1`, `0.2`, and `0.3` are rounded to representable values. Adding the first two then rounds their sum again.

| Expression | Stored value shown to 17 significant digits |
| --- | --- |
| `0.1` | 0.10000000000000001 |
| `0.2` | 0.20000000000000001 |
| `0.3` | 0.29999999999999999 |
| `0.1 + 0.2` | 0.30000000000000004 |

These displays are rounded decimal descriptions, not full exact expansions. The two values in the last rows are adjacent binary64 values, separated by exactly `2⁻⁵⁴`.

The illustration magnifies this neighborhood schematically: mathematical 0.3 lies between the two stored values, closer to the lower one.

## Equality is not always wrong

Run these JavaScript expressions:

```js
console.log(0.1 + 0.2); // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // false
console.log((0.1 + 0.2) - 0.3 === 2 ** -54); // true
console.log(0.25 + 0.5 === 0.75); // true
```

The last addition is exact in binary64. Floating-point behavior follows defined rules; it is neither random nor a reason to forbid every equality test.

## Choose tolerance from the task

For finite values and nonnegative tolerances, a common acceptance rule is:

```text
abs(a - b) <= max(absTol, relTol * max(abs(a), abs(b)))
```

Suppose a length-checking task, restricted to magnitudes at most 1,000 metres, permits a difference of one millimetre or one part per million, whichever is larger:

```js
const a = 1.234, b = 1.2344; // metres
const absTol = 0.001, relTol = 1e-6;
const limit = Math.max(absTol, relTol * Math.max(Math.abs(a), Math.abs(b)));
console.log(Number.isFinite(a) && Number.isFinite(b) &&
  Math.abs(a - b) <= limit); // true
```

The difference is about 0.0004 m; the limit is 0.001 m. Acceptance means sufficiently close for this task, not identical numbers.

## No universal epsilon

`Number.EPSILON` is `2⁻⁵²`, the gap above 1, not a universal error budget. Spacing varies with magnitude; measurement uncertainty and accumulated error also matter.

Handle non-finite inputs and extreme ranges separately. Formatting fewer decimal places changes a display, not the stored arithmetic. This tolerance example is not a general financial rounding policy.

Reference: [MDN: Number.EPSILON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON).
