---
key: closure-capture
locale: en
cardId: K-006
title: 'Closure capture'
subtitle: 'Remember the variable, not a frozen value.'
summary: 'A C# callback can keep access to a variable after its surrounding code moves on. Sharing one loop variable differs from capturing a fresh local on each iteration.'
topic: 'programming'
cardArt: '/images/closure-capture.svg'
facts:
  - { label: 'Shared i', value: '3, 3, 3' }
  - { label: 'Local copy', value: '0, 1, 2' }
languages: ['C#']
tags: [closures, scope]
updated: '2026-11-18'
status: preview
---

## A callback keeps access to a variable

A C# lambda that uses an outer local variable captures that variable, not an immutable snapshot of its current value. The variable remains available for later calls through the resulting delegate.

For example, if a captured counter changes from 4 to 9 before a callback reads it, that callback observes 9. The important questions are which variable was captured and when its value is read.

## Build first, invoke after the loops

This standalone C# program creates two lists of callbacks. Neither list runs during its construction; both are invoked only after their respective loops have finished.

```csharp
using System;
using System.Collections.Generic;

class CaptureDemo
{
    static void Main()
    {
        var shared = new List<Action>();
        for (int i = 0; i < 3; i++)
        {
            shared.Add(() => Console.WriteLine(i));
        }

        var separate = new List<Action>();
        for (int i = 0; i < 3; i++)
        {
            int copy = i;
            separate.Add(() => Console.WriteLine(copy));
        }

        foreach (Action callback in shared) callback();
        Console.WriteLine("---");
        foreach (Action callback in separate) callback();
    }
}
```

It prints `3`, `3`, `3`, a separator, then `0`, `1`, `2`, each on its own line. No asynchronous scheduling is involved.

## Trace the shared variable

The first `for` loop has one `i`. Each lambda retains access to that same variable; creating another callback does not create another `i`.

| Moment | Shared i | What is stored |
| --- | --- | --- |
| First body | 0 | Callback reading i |
| Second body | 1 | Another callback reading i |
| Third body | 2 | Another callback reading i |
| Final increment and failed test | 3 | Loop ends |
| Later invocation | 3 | All three read 3 |

Although `i` is out of lexical scope after the loop, its captured storage remains available to the delegates.

## Why a local copy changes the result

The second loop enters the body three times, creating a fresh `copy` each time. Those three variables start with 0, 1, and 2. Each callback reads its own variable, and this program never changes those copies afterward.

This is still variable capture. Assigning a different value to a particular `copy` before its callback runs would change that callback’s output. Moving the declaration outside the loop would instead create one shared variable again.

## Do not generalize the wrong loop rule

Since C# 5, `foreach` gives its iteration variable a fresh instance for each iteration. That rule does not change how the `for` initializer variable behaves here.

A fresh variable also does not deep-copy an object it references. Distinguish separate variable storage from separate objects when callbacks use mutable data.

Reference: [Microsoft C# specification: Captured outer variables](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions#122262-captured-outer-variables).
