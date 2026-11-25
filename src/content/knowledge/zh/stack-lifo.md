---
key: stack-lifo
locale: zh
cardId: K-012
title: '栈与后进先出'
subtitle: '最近放入的，最先取出。'
summary: '用 A、B、C 的进出轨迹理解栈顶，再用一个完整的括号检查器观察后进先出如何处理嵌套。'
topic: algorithms
languages: [JavaScript]
cardArt: '/images/stack-lifo.svg'
facts:
  - { label: '取出规则', value: '后进先出' }
  - { label: '匹配对象', value: '最近未闭合括号' }
tags: [栈, 括号匹配, 数据结构]
updated: '2026-11-20'
status: preview
---

## 栈顶是唯一的出入口

栈是一种限制访问方式的结构：添加和移除都发生在同一端，称为**栈顶**。
最后放入的元素挡在更早的元素上方，因此先被取出。这就是 LIFO，后进先出。

| 操作 | 作用 | 是否改变栈 |
| --- | --- | --- |
| `push(value)` | 把新元素放到栈顶 | 是 |
| `pop()` | 取出并移除栈顶元素 | 是 |
| `peek()` | 查看栈顶，不移除 | 否 |

这些是抽象操作的名字，不代表每种语言都有同名方法。
在 JavaScript 数组示例里，数组末端充当栈顶；查看可用 `stack[stack.length - 1]`。

## 跟着 A、B、C 走一遍

下表从左到右表示栈底到栈顶；空白栈记为 `[]`。
先放入 A，再放入 B 和 C，并不意味着 A 会先出来。

| 操作 | 操作后的栈 | 观察或取出的值 |
| --- | --- | --- |
| `push(A)` | `[A]` | — |
| `push(B)` | `[A, B]` | — |
| `push(C)` | `[A, B, C]` | — |
| `peek()` | `[A, B, C]` | C，仍在栈中 |
| `pop()` | `[A, B]` | C |
| `pop()` | `[A]` | B |
| `pop()` | `[]` | A |

查看 C 不会让 B 变成栈顶；只有移除 C 才会。
空栈不能提供有效栈顶。JavaScript 数组的 `pop()` 返回 `undefined`，其他 API 可能抛错。

## 括号为什么需要栈

读到左括号时，把它记为“尚待闭合”；读到右括号时，必须先闭合最近那个左括号。
例如 `([{}])` 中，`}` 必须先配 `{`，之后 `]` 才能配 `[`。

只数左右括号数量不够：`([)]` 数量相同，却在 `)` 出现时遇到栈顶 `[`。
检查过程中保持一个不变量：栈内恰好是已经读到、仍未匹配的左括号，按出现先后排列。

## 一个完整的检查器

输入约定为字符串。函数只识别 `()`、`[]`、`{}`，忽略其他字符。

```js
function isBalanced(text) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const char of text) {
    if ('([{'.includes(char)) {
      stack.push(char);
    } else if (Object.hasOwn(pairs, char)) {
      if (stack.length === 0 || stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }
  return stack.length === 0;
}

console.log(isBalanced('({[]})')); // true
console.log(isBalanced('([)]'));   // false
console.log(isBalanced(''));       // true
console.log(isBalanced('(()'));    // false
console.log(isBalanced(']'));      // false
console.log(isBalanced('a+(b*c)')); // true
```

遇到右括号时，空栈表示它没有对应的左括号；类型不同表示发生交叉或错误闭合。
扫描结束还要检查空栈，否则 `(()` 这种只缺结尾的输入会被误判。

## 明确边界与成本

空字符串没有未完成的配对，所以返回 `true`；只有普通文字也返回 `true`。
这不是代码解析器：它不识别字符串字面量、转义或注释，里面的括号也会被计入。
例如包含带引号的左括号的文本，不能因为那个括号“在字符串里”就自动跳过。

分析采用常见的几何扩容数组模型，并假设单个槽位操作为常数成本：
`push` 摊还 O(1)，单次扩容可能 O(n)；不触发收缩搬移的栈顶 `pop` 和 `peek` 为 O(1)。
在此模型下，扫描 n 个字符总计 O(n) 时间，额外空间 O(d)，d 是最大的未闭合深度，至多为 n。
这是算法模型，不是 ECMAScript 对数组内存布局或操作耗时的保证。

扩容成本的来由见[动态数组的长度与容量](/zh/knowledge/dynamic-array-capacity/)。

## 参考

- [MDN：Array.prototype.push()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push)
- [MDN：Array.prototype.pop()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop)
