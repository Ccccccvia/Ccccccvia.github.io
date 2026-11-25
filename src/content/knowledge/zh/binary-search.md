---
key: binary-search
locale: zh
cardId: K-002
title: '二分查找'
subtitle: '比较一次，排除半边候选。'
summary: '有序性让中点一侧的元素整体失去成为答案的可能。保持区间定义一致，直到找到目标或候选耗尽。'
topic: 'algorithms'
languages: [JavaScript]
cardArt: '/images/binary-search.svg'
facts:
  - { label: '探测次数', value: 'O(log n)' }
  - { label: '闭区间', value: '[lo, hi]' }
tags: [查找, 数组, 循环不变量]
updated: '2026-11-18'
status: preview
---

## 为什么有序就能排除半边

设数组由有限数值组成，并按从小到大排列。如果中点的值小于目标，那么它左边的所有值也都太小。无需逐个检查，就能排除这一整段，连同中点本身。

如果中点的值太大，就排除它和右侧所有元素。真正提供依据的是有序性，而不只是「选中间」。未排序的数据也可能碰巧查对，但此时排除候选的推理不成立，结果没有保证。

## 先给边界一个固定含义

采用闭区间 `[lo, hi]`，两个端点都仍是候选。初始值是 `lo = 0`、`hi = length - 1`。

- 当 `lo <= hi` 时继续；两者相等，说明还剩一个元素要检查。
- 比较的是 `a[mid]` 与目标，不是索引数字 `mid` 与目标。
- 不相等时，用 `mid + 1` 或 `mid - 1` 排除已经检查的位置。

循环不变量是：若存在匹配，区间内就仍保留至少一个匹配。每次未命中的迭代都必须让区间缩小。

## 一段可直接运行的查找

下面的 JavaScript 函数要求输入已经有序；它不会排序，也不会修改数组。

```js
function locate(a, target) {
  let lo = 0;
  let hi = a.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] === target) return mid;
    if (a[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

console.log(locate([2, 5, 8, 12, 16, 23], 16)); // 4
console.log(locate([2, 5, 8, 12, 16, 23], 15)); // -1
console.log(locate([], 16)); // -1
```

返回值是从零开始的索引，不是找到的数值本身。

## 跟着保留下来的区间走

查找 `16` 时，两次探测如下：

| 轮次 | lo | hi | mid | a[mid] | 决定 |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | 5 | 2 | 8 | 保留索引 3–5 |
| 2 | 3 | 5 | 4 | 16 | 返回 4 |

查找不存在的 `15` 时，中点索引依次为 `2 → 4 → 3`。随后边界变为 `lo = 4, hi = 3`，候选区间为空。

空数组一开始就有 `hi = -1`，因此不会进入循环。

## 保证到哪里为止

不断减半带来 **O(log n) 次探测**。要进一步说时间是 O(log n)，还需要索引访问和比较都是 O(1)；链表不具备这种访问模型。这里的迭代写法只用 O(1) 辅助空间。

存在重复值时，本函数返回某个匹配位置，不保证最靠前。寻找第一次出现需要另设边界规则。预先排序也有成本，而且可能改变元素的原始索引。

延伸阅读：[CP-Algorithms：二分查找](https://cp-algorithms.com/num_methods/binary_search.html)。
