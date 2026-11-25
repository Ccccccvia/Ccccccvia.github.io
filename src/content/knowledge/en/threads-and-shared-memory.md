---
key: threads-and-shared-memory
locale: en
cardId: K-019
title: 'What threads share'
subtitle: 'Separate execution state, one shared address space.'
summary: 'Threads in one process share the address space and heap, but have separate execution contexts, logical stacks, and TLS. A lost update shows why a complete read-modify-write needs synchronization.'
topic: 'operating-systems'
languages: []
cardArt: '/images/threads-and-shared-memory.svg'
facts:
  - { label: 'Shared', value: 'Address space and heap' }
  - { label: 'Separate', value: 'Stacks and register contexts' }
tags: [threads, shared-memory, synchronization]
updated: '2026-11-20'
status: preview
---

## One address space, several execution paths

Threads in one process normally share its virtual address space, including code, global data, and the heap.
Given the address of the same valid heap object, two threads can access that object without copying it.
This enables both cooperation and conflict: the OS schedules threads but does not automatically maintain application object invariants.

| State or region | Relationship between threads | Important boundary |
| --- | --- | --- |
| Address space, code, global data, heap | Shared within the process | Permissions, object lifetimes, and language rules still apply |
| Register context and instruction position | Kept separately for each thread | Execution switches save and restore necessary state |
| Logical call stack | Each thread has its own stack and call sequence | Stack memory normally remains in the shared address space |
| Thread-local storage, TLS | Each thread has its own instance | “Thread-local” is not a hardware-isolated secret region |

“Own stack” describes execution organization and lifetime, not a memory wall that no other thread can cross.
Passing the address of a live stack object to another thread can let it access that object; lifetime and synchronization must still be correct.
Continuing to use an expired local object after the original thread returns does not become safe because it came from a stack.

## Concurrency need not be parallelism

Concurrency means tasks make progress over the same interval, possibly by taking turns on one logical CPU.
Parallelism means multiple tasks actually execute at the same instant, requiring suitable hardware and scheduling.

| Scenario | Concurrent? | Necessarily parallel? |
| --- | --- | --- |
| One logical CPU alternates between A and B | Yes | No |
| Two available logical CPUs execute A and B simultaneously | Yes | Parallel at that moment |
| Two threads exist, but one is waiting | They can form concurrent tasks | Not guaranteed |

Even without simultaneous execution, a switch inside a read-modify-write is enough for a logical race.

## Why can two increments leave only one?

Let shared `counter` start at `0`; A and B each intend to add `1`.
Conceptually split the operation into “read, add one to a private temporary value, write back.”

| Step | Thread A | Thread B | Shared counter |
| --- | --- | --- | --- |
| 0 | Not started | Not started | 0 |
| 1 | Read 0 into its temporary value | — | 0 |
| 2 | — | Read 0 into its temporary value | 0 |
| 3 | Change temporary value from 0 to 1 | — | 0 |
| 4 | — | Change temporary value from 0 to 1 | 0 |
| 5 | Write back 1 | — | 1 |
| 6 | — | Write back 1 | 1 |

Two intended increments should total `2`, but this conceptual interleaving leaves `1`: one update is lost.
The table is a teaching abstraction, not executable code or a promise about how machine instructions are split.

In particular, it does not establish that an unsynchronized C++ data race on an ordinary integer can only produce `1` or `2`.
Such a data race is undefined behavior in C++; this table is not a guarantee of actual program output.

## Lock the entire read-modify-write

All participating accesses must follow one synchronization protocol, with “read—modify—write” inside the same critical section.
Locking once for the read and again for the write still leaves a race window between them.

```text
A: acquire lock → read 0 → add one → write 1 → release lock
B: acquire same lock → read 1 → add one → write 2 → release lock
```

This is one valid order; B could acquire the lock first, but the two protected increments do not overwrite each other.
Locking in only one thread while another accesses the same data outside the protocol does not provide this guarantee.

## Which problem does atomic addition solve?

For one counter, a defined atomic-add operation makes an increment an indivisible read-modify-write.
If both increments follow the same atomic-access scheme, nothing else resets the value, and observation after completion follows synchronization rules, the result is `2`.
An ordinary increment expression or a thread-safe library call does not automatically make every business step atomic.

For example, “check stock, decrement stock, record an order” is a compound operation.
Making only the decrement atomic does not prevent overselling or guarantee that orders and stock remain consistent.
Choose locks, transactions, or a verified concurrent algorithm around the complete business invariant.

Separate stacks organize execution state; consistency of shared data is a different design responsibility.

## References

- [Microsoft: About Processes and Threads](https://learn.microsoft.com/en-us/windows/win32/procthread/about-processes-and-threads)
- [Microsoft: Interlocked Variable Access](https://learn.microsoft.com/en-us/windows/win32/sync/interlocked-variable-access)
