---
key: mb-vs-mib
locale: en
cardId: K-001
title: 'MB vs MiB'
subtitle: 'One file, two rulers.'
summary: 'An MB counts one million bytes; a MiB counts 1,048,576. Switching units changes the number, not the data in your file.'
collection: 'Data & measurement'
cardArt: '/images/binary-observatory.svg'
facts:
  - { label: '1 MB', value: '10⁶ B' }
  - { label: '1 MiB', value: '2²⁰ B' }
tags: [MB, MiB, storage, capacity]
updated: '2026-10-22'
status: preview
---

## Start with bytes and two units

MB and MiB measure data quantity using different-sized units. MB uses a decimal prefix; MiB uses a binary prefix. Neither is an approximate spelling of the other.

B means byte, while bit means a binary digit: 1 B = 8 bit. Capitalization matters. This card covers file size and storage capacity, not Mbps or transfer-rate conversions. Computers using binary does not require every capacity measurement to use binary units.

## Compare the two scales

| Unit | Name | Definition | Bytes per unit |
| --- | --- | --- | --- |
| MB | megabyte | 1 MB = 10^6 B | 1,000,000 B |
| MiB | mebibyte | 1 MiB = 2^20 B | 1,048,576 B |

A MiB is larger than an MB, so the same data needs fewer MiB.

## A smaller number, not a smaller file

Take a file containing exactly 1,048,576 bytes:

**1,048,576 B = 1 MiB = 1.048576 MB**

Think of measuring one length with two rulers: larger divisions mean fewer divisions counted. Switching from MB to MiB does not compress, delete, or lose anything. The byte count stays unchanged.

## Convert through bytes

Multiply by the source unit's byte count, then divide by the target unit's byte count.

```text
Value in MiB = value in MB × 1,000,000 ÷ 1,048,576
Value in MB = value in MiB × 1,048,576 ÷ 1,000,000

6.78 MB = 6.78 × 1,000,000 B
        = 6,780,000 B
        ≈ 6.465912 MiB
```

This treats 6.78 MB as exact and rounds the result to six decimal places. A rounded software display cannot reveal a unique, exact byte count.

## Check more than the MB label

Some tools historically label binary-calculated values as MB. Check the documentation and raw byte count, and distinguish file size from disk usage or available capacity.

Formatting also involves filesystem metadata and reserved space. Unit conversion alone cannot explain every difference in available storage.

Definitions: [NIST: Prefixes for binary multiples](https://physics.nist.gov/cuu/Units/binary.html).

**MB and MiB are two rulers: changing the ruler changes the reading, not the data.**
