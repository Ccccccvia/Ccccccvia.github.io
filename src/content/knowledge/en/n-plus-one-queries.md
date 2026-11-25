---
key: n-plus-one-queries
locale: en
cardId: K-007
title: 'N+1 queries'
subtitle: 'One list can hide twelve extra trips.'
summary: 'Loading each author’s books separately can turn one page into thirteen queries. Batching related rows reduces trips, not necessarily total database work.'
topic: 'databases'
languages: [SQL]
cardArt: '/images/n-plus-one-queries.svg'
facts:
  - { label: 'Per author', value: '1 + 12 = 13' }
  - { label: 'Batched', value: '2 queries' }
tags: [database, ORM, batching]
updated: '2026-11-18'
status: preview
---

## Why does one page issue thirteen queries?

A catalog displays twelve authors and their books. The application first fetches the authors,
then asks for books separately for every author. One initial query plus twelve follow-ups makes thirteen.

This is the N+1 pattern: query count grows with the number of parent rows.
A small loop in application code can therefore create many database round trips.

## Follow the relationship access

With lazy loading enabled, reading a related collection may trigger a query when it has not been loaded.
That can hide database access behind an ordinary-looking property read inside a loop.

This is a risk of a particular loading strategy, not universal behavior of every ORM.
Explicit queries inside a loop can create the same pattern without lazy loading.

## Collect identifiers, then fetch together

For this twelve-author page, use two logical steps:

```sql
SELECT id, name FROM authors
ORDER BY id LIMIT 12;

SELECT author_id, title FROM books
WHERE author_id IN (4, 9, 15, 22, 31, 38, 46, 57, 63, 74, 81, 96);
```

The identifiers illustrate the first query's returned rows; they are not a fixed list to reuse.
Group the books by `author_id` in memory, then attach each group to its author.
An author with no matching books gets an empty collection.

| Plan | Author queries | Book queries | Total |
| --- | ---: | ---: | ---: |
| One per author | 1 | 12 | 13 |
| One batch | 1 | 1 | 2 |

## Count waiting, not a promised speedup

Assume each serial round trip contributes exactly 15 ms of network waiting:

```text
13 × 15 ms = 195 ms
 2 × 15 ms =  30 ms
```

These are only the assumed waiting components, not measured response times.
Execution, transfer, grouping, connection behavior, and other work still matter.

## Keep the batch bounded

- Paginate the authors first; do not load an entire database to save trips.
- Parameter or batch-size limits may require several book queries instead of one.
- Separate queries can observe changes between reads; choose consistency guarantees deliberately.
- Large child collections still consume bandwidth and memory. Select only needed columns.

A single join is another option, but repeated parent columns or multiple joined collections can inflate results.
One query is not automatically the fastest plan. Inspect query logs, row counts, and actual timings.

## References

- [Microsoft: Lazy loading and the N+1 warning](https://learn.microsoft.com/en-us/ef/core/querying/related-data/lazy)
- [Microsoft: Single versus split queries](https://learn.microsoft.com/en-us/ef/core/querying/single-split-queries)
