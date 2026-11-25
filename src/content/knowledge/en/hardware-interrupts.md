---
key: hardware-interrupts
locale: en
cardId: K-017
title: 'A hardware interrupt round trip'
subtitle: 'Save execution state, handle the event, then decide who runs.'
summary: 'A device asynchronously notifies the CPU. Hardware and entry software save state, vector dispatch reaches a short handler, and another thread may run before the interrupted one resumes.'
topic: 'operating-systems'
languages: []
cardArt: '/images/hardware-interrupts.svg'
facts:
  - { label: 'Notification', value: 'Asynchronous to instructions' }
  - { label: 'After handling', value: 'Original thread may wait' }
tags: [hardware-interrupts, CPU, scheduling]
updated: '2026-11-20'
status: preview
---

## A device need not wait for the program to ask

Suppose the CPU is executing thread A when a timer expires or a network adapter finishes a batch of receive work.
The device can notify the CPU through an interrupt; A need not be executing an instruction related to that device.
“Asynchronous to the current instruction stream” means the event comes from outside, rather than from an error in the current instruction itself.

Interrupts reduce the need for continuous polling, but systems may mix polling, interrupt coalescing, and other strategies.
One notification does not guarantee one packet, nor mean that the CPU has completed all device-related work.

## What must survive the round trip?

The interrupted program still needs its instruction position, register values, and necessary processor state.
The CPU does not automatically save everything, and the handler does not reconstruct it by guessing.

| Stage | Main work | Important boundary |
| --- | --- | --- |
| Request and acceptance | Controller and CPU deliver and accept the event under their rules | Masking or priority can delay acceptance |
| Entry and saving | CPU saves architecturally specified state; entry software saves additional required registers | Exact state depends on architecture and entry path |
| Vector dispatch | Use the vector mechanism to reach the appropriate entry | A vector number is not a handler address |
| Short handling | ISR checks the source, records essential state, and acknowledges as the device protocol requires | Avoid unbounded work in a high-priority entry |
| Follow-up work | Defer longer processing to a suitable mechanism | Execution context still determines whether blocking is allowed |
| Exit and restoration | Restore state or arrange for another runnable thread first | The original thread need not continue immediately |

Entry saving and dispatch are conceptual responsibilities here, not a universal strict sequence of architectural microsteps.
On x86, an interrupt vector normally indexes an IDT descriptor, which specifies the entry and related attributes.
Before entry software runs, hardware has already performed the actions needed to select that entry.

## Why keep the ISR short?

An interrupt service routine (ISR) usually does urgent, bounded work, then arranges follow-up processing.
For example, record device completion status and queue work instead of parsing all received data inside the ISR.

Windows drivers can defer suitable work to a DPC; Linux offers mechanisms such as threaded interrupts and workqueues.
These are not identical contexts: an ordinary Windows DPC still cannot perform arbitrary blocking waits.
Work that must wait or run longer needs a context that permits it, not merely a renamed function.

```text
Device notice → CPU / entry saves → ISR → queue follow-up work
                                    ↓
                            exit checks scheduling
                              ↙           ↘
                         resume A      run B first
```

Follow-up work may interleave with other tasks; “queued” does not mean “finished.”

## An illustrative timer timeline

Suppose the timer targets `4.0 ms`, while A is running.
These are invented explanatory readings, not platform measurements or latency promises.

| Time | Example event |
| --- | --- |
| `4.0 ms` | Timer expires and requests an interrupt |
| `4.2 ms` | CPU accepts it, enters handling, and saves necessary state |
| `4.3 ms` | Short handling ends; the scheduling path selects ready thread B |
| `4.5 ms` | A's state is restored later, and A continues |

The illustrative request-to-entry delay is `4.2 − 4.0 = 0.2 ms`.
A's entry-to-resumption interval is `4.5 − 4.2 = 0.3 ms`, not all of which is ISR execution time.
Interrupt masking, higher-priority work, and scheduling affect latency; timer interrupts do not automatically provide hard real-time guarantees.
Nor must every timer interrupt switch threads.

## Do not merge three different entry mechanisms

| Mechanism | Relation to the current instruction | Example |
| --- | --- | --- |
| Hardware interrupt | Arrives asynchronously | Timer expiry or device completion notification |
| Synchronous exception | Triggered by executing the current instruction | Page fault or divide-by-zero |
| System call | Program deliberately requests a kernel service | Entering the kernel through a dedicated system-call instruction |

System calls can use dedicated instructions or, on some systems, software-interrupt instructions; they are not all hardware interrupts.
Synchronous exceptions should not all be labeled “software interrupts” either.

Priority, nesting, and preemption rules vary by CPU and OS; there is no universal ranking of device priorities.
Saving state enables eventual restoration but does not guarantee when the interrupted thread gets the CPU again.

## References

- [Microsoft: Interrupt Service Routines](https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/interrupt-service-routines)
- [Linux kernel: Generic IRQ Handling](https://docs.kernel.org/core-api/genericirq.html)
