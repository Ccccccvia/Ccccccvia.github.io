---
key: dynamic-array-capacity
locale: en
cardId: K-014
title: 'Dynamic array size and capacity'
subtitle: 'How many are stored, and how many fit?'
summary: 'Grow from size 3 and capacity 4 to a fifth element. Separate live slots from spare storage, and see why occasional linear growth permits amortized constant-time appends.'
topic: algorithms
languages: []
cardArt: '/images/dynamic-array-capacity.svg'
facts:
  - { label: 'Size', value: 'Number of live elements' }
  - { label: 'Capacity', value: 'Room before growth' }
tags: [dynamic-arrays, capacity, amortized-analysis]
updated: '2026-11-20'
status: preview
---

## Two numbers describe different things

The dynamic array model stores a sequence in contiguous element slots, tracking its live size and storage capacity separately.
This is a language-neutral model, not a memory snapshot of a particular language array object.

| Record | Question answered | Starting example |
| --- | --- | --- |
| `size` | How many live elements are there? | 3 |
| `capacity` | How many elements fit without growing? | 4 |
| `capacity - size` | How many more appends fit before growth? | 1 |

A valid state satisfies `0 ≤ size ≤ capacity`.
Valid element indices satisfy `0 ≤ index < size`, not merely `index < capacity`.

## Start with three elements

Here, `--` marks spare capacity, not an element value or a readable placeholder element.

```text
index:          0    1    2    3
size=3, cap=4: [10] [20] [30] [--]
size=4, cap=4: [10] [20] [30] [40]

index:          0    1    2    3    4    5    6    7
size=5, cap=8: [10] [20] [30] [40] [50] [--] [--] [--]
```

Initially, index 3 is within the buffer capacity but is not a live element of the sequence.
Appending 40 is a container operation: store the new element, then update `size` from 3 to 4.
This does not allow callers to bypass the API and treat every reserved slot as an existing element.

## The fourth fits; the fifth may relocate

| Moment | Size / capacity | Work required |
| --- | --- | --- |
| Initially | 3 / 4 | Store 10, 20, 30, with one spare slot |
| After appending 40 | 4 / 4 | Use the remaining slot; no growth needed |
| Before appending 50 | 4 / 4 | Full; obtain more capacity first |
| After appending 50 | 5 / 8 | Keep the original four, add 50, leave three spare slots |

This example grows capacity from 4 to 8 and assumes a new buffer is allocated.
Transfer the four live elements in order, add 50, update the container records, and release the old storage.

**Doubling is only an example policy**, not a requirement shared by all languages or libraries.
Some storage can expand in place; when a new buffer is needed, existing element order must still be preserved.
Contiguous slots do not imply that referenced objects are adjacent or that those objects are deep-copied.

## Why O(n) once can mean O(1) amortized

Let n be the current element count, assuming constant-cost reads, writes, and transfers for each slot.
If copying an element is itself expensive, that cost must be included too.

| Operation | Cost in this model | Reason |
| --- | --- | --- |
| Indexed read | O(1) | Locate a slot from its base and fixed slot size |
| Append with spare capacity | O(1) | Write one slot and increase size |
| Append requiring a copied replacement buffer | O(n) | Transfer n existing elements, then append |
| Repeated appends with geometric growth | Amortized O(1) per append | Total transfers grow linearly with append count |
| Middle insertion | O(n) worst case | Shift later elements even when capacity is sufficient |

Starting with a fixed small capacity and doubling gives transfer counts such as `4 + 8 + 16 + …`.
Over m consecutive appends, this geometric sum is O(m); adding the m new-element writes still gives O(m).
Thus each append costs O(1) amortized, although an individual growth-triggering append can still cost O(n).
Amortization accounts for a whole sequence of operations; it is neither a per-call latency promise nor a random-input average.
Growing by only one slot each time can accumulate O(m²) copying work, so the same conclusion would not hold.

## Spare capacity does not make middle insertion free

To insert 15 at index 1 of `[10, 20, 30]`, first make room for it.
Even with spare capacity, move 30 right, then move 20 right, and only then write 15.
The result is `[10, 15, 20, 30]` with a larger size; preserving order is what requires those shifts.
An end append has no suffix to shift, so its amortized cost does not apply to middle insertion.

## Similar concepts, different APIs

Some containers expose capacity: .NET `List<T>` distinguishes `Count` from `Capacity`; C++ vector has `size()` and `capacity()`.
Reserving more capacity does not itself add live elements; removing an element need not immediately shrink capacity.
An empty container can have `size = 0` and positive capacity without contradiction.

JavaScript `Array` has no standard capacity API of this kind, and the language does not guarantee contiguous storage.
In particular, a sparse array's `length` cannot simply be treated as this model's live-element count.
For a use of this model with access restricted to one end, see [stacks and LIFO](/en/knowledge/stack-lifo/).

## References

- [Microsoft Learn: `List<T>.Capacity`](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.capacity)
- [Microsoft Learn: C++ vector](https://learn.microsoft.com/en-us/cpp/standard-library/vector-class)
