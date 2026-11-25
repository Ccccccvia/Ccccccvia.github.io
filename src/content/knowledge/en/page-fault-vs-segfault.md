---
key: page-fault-vs-segfault
locale: en
cardId: K-016
title: 'A page fault is not a segfault'
subtitle: 'Hardware raises the question; the OS decides whether to continue.'
summary: 'A fault may only need a zero page, a cached page, or copy-on-write handling. An illegal access may become a segfault; fault counts are not disk-read counts.'
topic: 'operating-systems'
languages: []
cardArt: '/images/page-fault-vs-segfault.svg'
facts:
  - { label: 'After a fault', value: 'Not always a crash' }
  - { label: 'Resolving a page', value: 'Not always disk I/O' }
tags: [virtual-memory, page-faults, memory-protection]
updated: '2026-11-20'
status: preview
---

## Ask about legality, then residency

An address can belong to a valid region yet temporarily lack a currently usable physical-page mapping.
“May this address be used?” and “Is this page already resident in RAM?” are different questions.

| Layer | Question | Example |
| --- | --- | --- |
| Address range | Can this address model represent the number? | A representable virtual address |
| Region and permissions | Is the region valid, and is this read, write, or execution allowed? | A valid but read-only region |
| Current mapping | Is a present, usable page available now? | Demand provision, not yet resident |

A representable number is not necessarily allocated to the program; a nonresident page is not necessarily an illegal address.

## A page fault is a handling entry point

This discussion uses common x86 paging: a nonpresent page or a paging-protection condition can cause the hardware exception `#PF`.
The CPU enters the OS exception handler, where the kernel considers regions, permissions, and page state to identify the cause.

```text
Access → hardware detects a paging condition → #PF → OS decision
  Legal and resolvable → supply a page or adjust mapping → retry faulting instruction
  Illegal address or genuinely forbidden operation → report an access error
```

A recoverable fault is usually transparent to the application: after resolution, the original access can continue.
A TLB miss alone is not a page fault on common x86 systems; hardware may only need a page-table walk.
Not every memory-access exception is `#PF`; address-format or alignment issues may use other exception entries.

## A zero-page and copy-on-write scenario

Suppose a program has one valid, logically read-write 4 KiB anonymous page, provisioned on demand.
Before the first read, it has no currently usable mapping; this example chooses an implementation using a shared zero page.

| Step | Hardware observation | Possible OS action |
| --- | --- | --- |
| First read | Page is nonpresent, causing a fault | Map a read-only shared zero page so the read returns zero |
| Later write | Current hardware mapping is read-only, causing another fault | Supply a private zeroed page and create a writable mapping |
| Retried write | New mapping is present and writable | Complete the write without affecting other zero-page users |

The second fault is copy-on-write (COW) handling, not permission to modify arbitrary read-only memory.
The OS knows that the region logically permits writes; only the current shared page's hardware permissions temporarily prohibit them.
General COW can also copy existing nonzero contents; the zero-page case can directly supply a private zeroed page.
Other systems or allocation policies may supply a private page directly, without exactly these two faults.

## Which faults need disk reads?

| Page source or state | Typical resolution | Must content be read from storage? |
| --- | --- | --- |
| First use of a valid anonymous page | Supply a zeroed page | No |
| Required file page already cached in RAM | Reconnect its mapping | No |
| Original COW page already in RAM | Copy it or supply a private page | No |
| Required contents only in swap, a page file, or a disk file | Perform I/O, then update the mapping | Yes |

Fault counts cannot directly be treated as disk-read counts.
A file page cached in RAM and its contents on disk are not two sources that must both be read.

## When does it become a segfault?

If an address has no valid region, or a write targets a genuinely read-only region, the OS cannot legally satisfy that access request.
Unix/Linux commonly reports such accesses with `SIGSEGV`; Windows commonly reports an Access Violation.
Default or unhandled behavior usually terminates the process; this does not mean applications have no signal or exception handling mechanisms.
Simply returning to the same instruction without fixing the cause usually cannot make an illegal access succeed.

The illustration contrasts “resolvable” with “illegal access,” not every possible failure cause.
Even a legal page may fail to be supplied because of memory exhaustion or I/O errors; not every legal fault is guaranteed to succeed.

## No crash does not mean a C access is safe

C object boundaries and lifetimes are not hardware page boundaries.
An out-of-bounds or use-after-free access may still land in a mapped, writable page and silently corrupt data.
Such accesses can be undefined behavior; the absence of a segfault does not prove correctness.

Page-level protection helps isolate address spaces, but it is not a per-object memory-safety checker.

## References

- [Linux kernel: Memory Management Concepts](https://docs.kernel.org/admin-guide/mm/concepts.html)
- [Microsoft: Working Set](https://learn.microsoft.com/en-us/windows/win32/memory/working-set)
