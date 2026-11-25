---
key: ordered-vs-sorted
locale: zh
cardId: K-013
title: '有序不等于已排序'
subtitle: '有第几个，不代表从小到大。'
summary: '当前次序回答元素在哪里，排序规则回答它们应如何排列。用不修改原数组的数字排序，区分次序、比较器与容器接口。'
topic: algorithms
languages: [JavaScript]
cardArt: '/images/ordered-vs-sorted.svg'
facts:
  - { label: '有序', value: '当前次序明确' }
  - { label: '已排序', value: '满足比较规则' }
tags: [序列, 排序, 容器]
updated: '2026-11-20'
status: preview
---

## 先问“按什么顺序”

这里的**有序**指元素具有明确的当前次序，不是数据一定从小到大。
**已排序**则指这个次序满足指定比较规则，例如数值升序。

数组 `[30, 10, 20]` 的第一个元素是 30，第二个是 10，第三个是 20。
它有清楚的位置关系，却不满足数值升序：30 大于后面的 10。

| 问题 | 当前数组给出的答案 |
| --- | --- |
| 下标 0 处是什么？ | 30 |
| 最小值是什么？ | 10，不能只看第一个位置 |
| 是否有明确次序？ | 有：30 → 10 → 20 |
| 是否已按数值升序排序？ | 没有 |

“有序”也不意味着次序永远不变。
插入、删除、反转和排序都可能改变元素的位置；未修改数组时，同一位置才保持原值。

## 排序是在应用一个规则

比较器接收两个元素 `a`、`b`，返回值的符号表达它们的先后关系。
本例只处理有限数字，用 `a - b` 明确要求数值升序。

| 比较结果 | 对先后关系的要求 | 例子 |
| --- | --- | --- |
| 小于 0 | a 在 b 前面 | `10 - 30 = -20` |
| 大于 0 | a 在 b 后面 | `30 - 20 = 10` |
| 等于 0 | 此规则下相等 | `20 - 20 = 0` |

不必返回恰好 -1 或 1；符号才是关键。
这张表解释比较规则，不是在规定排序算法的调用顺序。

## 生成已排序副本

在支持 `Array.prototype.toSorted()` 的 JavaScript 环境中运行：

```js
const original = [30, 10, 20];
const sorted = original.toSorted((a, b) => a - b);

console.log(JSON.stringify(original)); // [30,10,20]
console.log(JSON.stringify(sorted));   // [10,20,30]
console.log(original === sorted);      // false
```

`toSorted` 返回一个新数组，原数组的当前次序仍为 30 → 10 → 20。
最后一行检查两者是否为同一个数组对象，不是在比较各元素是否相等。
若改用 `sort`，则会修改接收调用的那个数组；两种接口不要混淆。

## 不要让默认比较掩盖问题

省略比较器时，默认排序会把元素转换为字符串，按 UTF-16 码元序列比较。
它不是默认按数字大小比较：数字 10 的字符串会排在数字 2 的字符串前面。

`[30, 10, 20]` 恰好让字符串次序与数字升序一致，因此容易掩盖错误。
只用这三个数“看起来对了”，不能证明省略比较器是正确的。

这里显式传入 `a - b`，而不是依赖这种巧合。
混合字符串、`NaN` 或特殊业务规则需要另行定义比较器，不在本例输入范围内。

## 迭代有顺序，不一定有位置索引

JavaScript 的 `Map` 和 `Set` 都按插入顺序迭代，但不提供序列式的位置索引接口。
不要把其他语言中同名容器的约定直接搬过来：Python `set` 的顺序约定不适用于 JavaScript `Set`。

| JavaScript 容器 | 次序约定 | 主要访问方式 |
| --- | --- | --- |
| `Array` | 元素有当前索引次序 | `items[0]` 按位置访问 |
| `Map` | 迭代保留插入顺序 | `map.get(key)` 按键访问 |
| `Set` | 迭代保留插入顺序 | `set.has(value)` 判断成员 |

`map.get(0)` 查找的是键 0，不是“第一个条目”。
想得到 Map 或 Set 的首个迭代项，应使用迭代器，而不是假定存在序列下标。
删除后重新插入一个条目会把它放到插入次序的末尾；次序仍然可以改变。

## 把三个问题分开问

1. 这个容器承诺怎样的迭代次序？
2. 它允许按位置、按键，还是按成员关系访问？
3. 当前次序是否满足我指定的比较规则？

明确这三点，比仅凭“有序容器”四个字选择 API 更可靠。
栈也有先后关系，但限制从哪一端取出，见[栈与后进先出](/zh/knowledge/stack-lifo/)。

## 参考

- [MDN：Array.prototype.toSorted()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)
- [MDN：Keyed collections](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections)
