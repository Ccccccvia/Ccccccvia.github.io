---
key: stack-lifo
locale: en
cardId: K-012
title: 'Stacks and last in, first out'
subtitle: 'The newest item leaves first.'
summary: 'Trace A, B, and C through the top of a stack, then use a complete bracket checker to see how last-in-first-out access handles nesting.'
topic: algorithms
languages: [JavaScript]
cardArt: '/images/stack-lifo.svg'
facts:
  - { label: 'Removal rule', value: 'Last in, first out' }
  - { label: 'Match against', value: 'Latest unclosed bracket' }
tags: [stacks, bracket-matching, data-structures]
updated: '2026-11-20'
status: preview
---

## One end controls entry and exit

A stack restricts access: adding and removing both happen at one end, called the **top**.
The newest item sits above earlier items, so it leaves first. This is LIFO: last in, first out.

| Operation | Effect | Changes the stack? |
| --- | --- | --- |
| `push(value)` | Put a new item on top | Yes |
| `pop()` | Return and remove the top item | Yes |
| `peek()` | Inspect the top without removing it | No |

These are names for abstract operations, not methods every language must provide.
For a JavaScript array used as a stack, the end is the top; inspect it with `stack[stack.length - 1]`.

## Follow A, B, and C

Each row lists items from bottom to top, left to right; `[]` means empty.
Putting A in before B and C does not mean A will leave first.

| Operation | Stack afterward | Observed or removed value |
| --- | --- | --- |
| `push(A)` | `[A]` | — |
| `push(B)` | `[A, B]` | — |
| `push(C)` | `[A, B, C]` | — |
| `peek()` | `[A, B, C]` | C, still in the stack |
| `pop()` | `[A, B]` | C |
| `pop()` | `[A]` | B |
| `pop()` | `[]` | A |

Inspecting C does not make B the top; removing C does.
An empty stack has no valid top item. JavaScript array `pop()` returns `undefined`; another API may throw.

## Why brackets need a stack

An opening bracket means “still waiting to close.” A closing bracket must close the most recent opening first.
In `([{}])`, for example, `}` must match `{` before `]` can match `[`.

Counting opening and closing brackets is insufficient: `([)]` has equal counts, but `)` meets `[` on top.
Maintain this invariant: the stack contains exactly the opening brackets seen but not yet matched, in arrival order.

## A complete checker

The input must be a string. The function recognizes only `()`, `[]`, and `{}`, ignoring other characters.

```js
function isBalanced(text) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const char of text) {
    if ('([{'.includes(char)) {
      stack.push(char);
    } else if (Object.hasOwn(pairs, char)) {
      if (stack.length === 0 || stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }
  return stack.length === 0;
}

console.log(isBalanced('({[]})')); // true
console.log(isBalanced('([)]'));   // false
console.log(isBalanced(''));       // true
console.log(isBalanced('(()'));    // false
console.log(isBalanced(']'));      // false
console.log(isBalanced('a+(b*c)')); // true
```

At a closing bracket, an empty stack means there is no opener; a different type means incorrect or crossed nesting.
Check for an empty stack at the end too, or unfinished input such as `(()` would be accepted.

## State the limits and cost

The empty string has no unfinished pairs, so it returns `true`; ordinary text alone also returns `true`.
This is not a code parser: it does not recognize string literals, escapes, or comments; their brackets count too.
For example, an opening bracket enclosed in quotation marks is not automatically skipped as “inside a string.”

Use the common geometrically growing array model, with constant-cost operations on individual slots:
`push` is amortized O(1), though a single growth can cost O(n); top `pop` without shrinkage and `peek` cost O(1).
Under this model, scanning n characters takes O(n) total time and O(d) extra space, where d is the maximum unclosed depth, at most n.
This is an algorithmic model, not an ECMAScript guarantee about array layout or operation timings.

For the growth cost, see [dynamic array size and capacity](/en/knowledge/dynamic-array-capacity/).

## References

- [MDN: Array.prototype.push()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push)
- [MDN: Array.prototype.pop()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop)
