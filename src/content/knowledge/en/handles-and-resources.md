---
key: handles-and-resources
locale: en
cardId: K-018
title: 'Handles and resources'
subtitle: 'A controlled reference, not a resource address.'
summary: 'Treat a handle as an opaque identifier for its matching API. Permissions, lifetime, and ownership govern its use; closing one reference does not delete the underlying file.'
topic: 'operating-systems'
languages: []
cardArt: '/images/handles-and-resources.svg'
facts:
  - { label: 'Access through', value: 'The matching API' }
  - { label: 'Closing a reference', value: 'Not file deletion' }
tags: [handles, Windows, resource-lifetime]
updated: '2026-11-20'
status: preview
---

## An identifier reaches a resource through an API

A handle is an API-defined opaque resource identifier; its representation may be an integer or a pointer-shaped type.
“Opaque” means callers should not interpret its bit pattern, infer a resource location, or dereference it directly.
A handle is not a physical address; even an ordinary, legally dereferenceable user-mode pointer usually denotes a virtual address.

```text
Opaque handle h → matching API → validity / type / permission checks → resource operation
```

This is a conceptual path, not a promise that every API uses one handle table or the same check order.
Handles hide implementation details but do not automatically fix incorrect ownership or concurrent use.

## A Windows file HANDLE lifecycle

Consider opening an existing ordinary file for reading only, without requesting deletion on close.
The table describes a conceptual lifecycle, not a compilable file-I/O program.

| Stage | API and conceptual action | What the program must establish |
| --- | --- | --- |
| Acquire | `CreateFile` opens an existing file and returns a `HANDLE` | Success; failure returns `INVALID_HANDLE_VALUE` |
| Use | Pass the handle to `ReadFile`, requesting 128 bytes | Return status, actual byte count, and the requirements of the chosen call mode |
| Controlled access | System uses the handle to locate the open file object | Valid handle, suitable type, and granted access rights |
| Close | Owner calls `CloseHandle` for this open reference | No code still needs this reference; do not close it twice |
| After closing | The local value no longer identifies a usable old reference | Stop using the old value and prevent stale aliases from calling through it |

Requesting 128 bytes does not guarantee receiving 128; reaching the end of the file can return fewer.
Check each API's failure sentinel rather than treating every handle failure as zero.
Both success and failure paths must manage references that were acquired successfully and remain owned by the caller.

## Permissions belong to the reference

A process-private Windows kernel handle is normally interpreted through its owning process's handle table.
Knowing a read-only file handle's numeric value does not grant write access.

| Proposed action | Why the numeric value is insufficient |
| --- | --- |
| Send the value to another process | Its handle table is not this process's table |
| Share access across processes | Follow duplication or inheritance mechanisms and their access rules |
| Hold several references to one resource | Manage the rights and lifetime of each reference separately |

Authorized duplication or inheritance can give several references to the same kernel object.
This does not give every handle family the same process scope or duplication mechanism.

## What does close actually end?

`CloseHandle` ends this owned kernel-handle reference; it does not mean “delete the file on disk.”
Other references can remain, so immediate destruction of the underlying object is not guaranteed.
File deletion follows specific file APIs and semantics; explicitly requesting delete-on-close has its own rules.

Closing a thread's handle also does not request termination of that thread.
A variable retaining a nonzero value is not evidence that its reference remains valid.

The system may reuse a closed handle value for a new resource.
Even if a later call accepts the old value, that does not prove it still denotes the original object.
Clearing one local variable can reduce mistakes but does not clear copies held elsewhere.

## Different API families need different cleanup

| Acquired resource or reference | Example matching cleanup |
| --- | --- |
| Ordinary owned kernel `HANDLE` | Usually `CloseHandle`; still check the specific API |
| Owned window `HWND` | Follow window rules with `DestroyWindow` |
| Context from `GetDC` / `BeginPaint` / `CreateCompatibleDC` | Match with `ReleaseDC` / `EndPaint` / `DeleteDC`, respectively |
| Module reference added by `LoadLibrary` | Use `FreeLibrary`; `GetModuleHandle` alone does not add a reference |

A shared “handle” name does not mean everything can be passed to `CloseHandle`.
Borrowing a reference does not transfer ownership; do not release it for the owner without contractual authority.

## Lifetime is also a concurrency problem

If thread A is using a handle, thread B cannot ignore the usage protocol and close that same reference.
An application should define ownership, borrowing, and when every user has finished.
Internal API checks are not a general solution to races between use and close.

Remember three rules: use the matching API, operate within granted rights, and close within a valid, managed lifecycle.

## References

- [Microsoft: Handles and Objects](https://learn.microsoft.com/en-us/windows/win32/sysinfo/handles-and-objects)
- [Microsoft: CloseHandle](https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-closehandle)
