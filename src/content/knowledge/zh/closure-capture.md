---
key: closure-capture
locale: zh
cardId: K-006
title: '闭包捕获变量'
subtitle: '记住变量，而非冻结的数值。'
summary: 'C# 回调能在外围代码继续执行后，保留对变量的访问。共享一个循环变量，与每轮捕获一个新局部变量，会得到不同结果。'
topic: 'programming'
cardArt: '/images/closure-capture.svg'
facts:
  - { label: '共享 i', value: '3, 3, 3' }
  - { label: '局部 copy', value: '0, 1, 2' }
languages: ['C#']
tags: [闭包, 作用域]
updated: '2026-11-18'
status: preview
---

## 回调保留的是对变量的访问

C# lambda 使用外围局部变量时，捕获的是这个变量，不是它当前值的一份不可变快照。稍后通过生成的委托调用 lambda，仍能访问该变量。

例如，一个被捕获的计数器在回调读取前从 4 改成 9，回调看到的就是 9。关键不是「创建回调时是多少」，而是「捕获了哪个变量，以及何时读取它」。

## 先建立回调，循环后再调用

下面是一段可独立运行的 C# 程序。它建立两个回调列表，构建列表时都不调用回调；两个列表都在各自循环结束后才执行。

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

输出依次是 `3`、`3`、`3`，然后一条分隔线，再是 `0`、`1`、`2`，各占一行。这个例子没有异步调度参与。

## 跟踪那个共享的变量

第一个 `for` 循环只有一个 `i`。每个 lambda 都保留对同一变量的访问；多建一个回调，并不会多建一个 `i`。

| 时刻 | 共享 i | 保存下来的内容 |
| --- | --- | --- |
| 第一次进入循环体 | 0 | 读取 i 的回调 |
| 第二次进入循环体 | 1 | 另一个读取 i 的回调 |
| 第三次进入循环体 | 2 | 另一个读取 i 的回调 |
| 最后递增并检查失败 | 3 | 循环结束 |
| 稍后调用 | 3 | 三个回调都读到 3 |

循环后，`i` 虽已不在词法作用域内，被捕获的存储位置仍可供委托访问。

## 为什么局部副本会改变结果

第二个循环每次进入循环体，都会创建新的 `copy`。这三个变量分别从 0、1、2 开始，每个回调读取自己的变量，而本程序之后没有修改它们。

这仍然是捕获变量。若在某个回调运行前给它对应的 `copy` 重新赋值，该回调的输出也会改变。若把声明移到循环外，则又会变成共享一个变量。

## 不要把一种循环的规则套给另一种

从 C# 5 开始，`foreach` 的迭代变量在每次迭代中都有新的实例。这条规则没有改变本例中 `for` 初始化变量的行为。

新变量也不会自动深拷贝它引用的对象。回调使用可变对象时，要区分「变量存储彼此独立」和「对象彼此独立」。

参考：[Microsoft C# 规范：捕获的外围变量](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions#122262-captured-outer-variables)。
