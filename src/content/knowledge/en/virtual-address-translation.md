---
key: virtual-address-translation
locale: en
cardId: K-015
title: 'Virtual address translation'
subtitle: 'Replace the page number, keep the offset.'
summary: 'A 4 KiB page calculation separates the jobs: the OS creates mappings, the MMU checks permissions and translates, and the TLB caches translations rather than data.'
topic: 'operating-systems'
languages: []
cardArt: '/images/virtual-address-translation.svg'
facts:
  - { label: 'Example page size', value: '4 KiB' }
  - { label: 'Preserved part', value: '12-bit offset' }
tags: [virtual-memory, MMU, TLB]
updated: '2026-11-20'
status: preview
---

## Split the address into two parts

Consider a user-mode access with common x86 paging; this example uses only 4 KiB pages.
A page contains `4 × 1024 = 4096 = 2^12` bytes, so the low 12 address bits are the page offset.
The remaining high bits form the virtual page number; hardware may further split them into multilevel page-table indices.

Apply integer division to virtual address `0x12345`:

```text
Page size = 0x1000 = 4096 bytes
Virtual page number = integer quotient of 0x12345 ÷ 0x1000 = 0x12 = 18
Page offset = 0x12345 mod 0x1000 = 0x345 = 837
Virtual address = 18 × 4096 + 837 = 74565
```

The offset ranges from `0` through `4095`, not from `0` through `4096`.

## Translate the page number, preserve the offset

Suppose the OS has mapped virtual page `0x12` to physical frame `0x2A`, and the current access is permitted.
A frame number is not a physical byte address: multiply it by the page size, then add the original offset.

| Part | Virtual address | Physical address |
| --- | --- | --- |
| Page / frame number | `0x12`, or 18 | `0x2A`, or 42 |
| Page offset | `0x345`, or 837 | `0x345`, or 837 |
| Complete address | `0x12345` | `0x2A345` |

```text
Physical frame base = 42 × 4096 = 172032 = 0x2A000
Physical address = 172032 + 837 = 172869 = 0x2A345
```

The two offset fields in the illustration stay identical; the mapping replaces only the page-number part.
This arithmetic explains address composition, not whether the address is valid in an arbitrary process.

## Who sets the rules, and who applies them?

| Role | Responsibility | Not its job |
| --- | --- | --- |
| OS memory manager | Manage regions, establish page-table mappings, handle faults | Translate every ordinary access in software |
| MMU | Translate in the current address space and check permissions | Decide which page an application should receive |
| TLB | Cache translations and permissions with address-space context | Store the application data bytes being read |

An access can use a translation already in the TLB.
On a TLB miss, common x86 hardware walks the page tables; a present, permitted mapping can still complete the access normally.
Thus **a TLB miss is not a page fault**, and need not enter the OS.

A nonpresent page or a paging-protection condition can instead cause a page fault, leaving the OS to decide whether it can resolve the access.
Even a TLB hit does not bypass permission checks.
After changing mappings or permissions, the OS must also maintain relevant TLB state according to architecture rules.

## The same number need not mean the same memory

These are separate address spaces; the last row is an alternative explicit-sharing configuration, not an automatic result.

| Address space and configuration | Virtual address | Physical frame | Final physical address |
| --- | --- | --- | --- |
| Process A | `0x12345` | `0x2A` | `0x2A345` |
| Process B, independent mapping | `0x12345` | `0x91` | `0x91345` |
| Process B, OS-authorized sharing of A's page | `0x12345` | `0x2A` | `0x2A345` |

Sharing does not require identical virtual page numbers; what matters is reaching the same physical page.
Different mappings of a shared page can still have different permissions.

## Separate translation caching from data caching

The TLB answers “where does this virtual page lead, and which accesses are allowed?” Data caches hold copies of actual data.
A TLB hit does not guarantee a data-cache hit, and cached data does not make an illegal access legal.
This separates responsibilities; it does not claim that the CPU must strictly serialize all cache steps.

Large pages, nested virtualization, and the full set of x86 permission bits are outside this example.
Reserving a virtual address range also does not immediately provide an equal amount of resident RAM.

## References

- [Microsoft: Virtual Address Space](https://learn.microsoft.com/en-us/windows/win32/memory/virtual-address-space)
- [Linux kernel: Page Tables](https://docs.kernel.org/mm/page_tables.html)
