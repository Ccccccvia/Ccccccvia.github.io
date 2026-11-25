---
key: floating-point-rounding
locale: zh
cardId: K-005
title: '浮点数的舍入'
subtitle: '数轴上的落点并不连续。'
summary: '有些十进制小数落在两个可表示的二进制浮点数之间。字面量和算术结果分别舍入，可能让数学上相等的表达式落在不同位置。'
topic: 'organization'
cardArt: '/images/floating-point-rounding.svg'
facts:
  - { label: '1/4 的二进制', value: '0.01₂' }
  - { label: '0.3 附近间距', value: '2⁻⁵⁴' }
languages: [JavaScript]
tags: [binary64, 精度]
updated: '2026-11-18'
status: preview
---

## 四分之一能写完，十分之一不能

有限二进制小数可以写成「整数除以二的幂」。因此，一个分数约分后，分母只有二这个质因子，它的二进制展开才能终止。

`1/4 = 0.01₂` 可以写完；但 `1/10` 的分母仍含因子五，二进制位会循环：`0.000110011…₂`。固定宽度的格式只能选择近似值。

## 舍入不只发生一次

JavaScript 的普通 `Number` 使用 binary64。`0.1`、`0.2`、`0.3` 这样的十进制字面量先舍入到可表示值，前两个值相加时，结果还要再舍入。

| 表达式 | 存储值显示为 17 位有效数字 |
| --- | --- |
| `0.1` | 0.10000000000000001 |
| `0.2` | 0.20000000000000001 |
| `0.3` | 0.29999999999999999 |
| `0.1 + 0.2` | 0.30000000000000004 |

表中是经过十进制显示舍入的描述，不是完整精确展开。最后两行对应相邻的两个 binary64 值，间隔恰好为 `2⁻⁵⁴`。

配图把这段数轴示意性放大：数学上的 0.3 位于两个存储值之间，且更靠近较小的那个。

## 并非所有相等比较都会失败

运行下面的 JavaScript 表达式：

```js
console.log(0.1 + 0.2); // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // false
console.log((0.1 + 0.2) - 0.3 === 2 ** -54); // true
console.log(0.25 + 0.5 === 0.75); // true
```

最后一次加法在 binary64 中可以精确完成。浮点运算遵循确定的规则，既不是随机出错，也不意味着必须禁止所有相等比较。

## 容差应由任务来决定

对于有限数值和非负容差，一种常见的接受规则是：

```text
abs(a - b) <= max(absTol, relTol * max(abs(a), abs(b)))
```

假设某长度检查任务只处理绝对值不超过 1,000 米的数据，允许一毫米或百万分之一的差异，取两者中较大的限值：

```js
const a = 1.234, b = 1.2344; // metres
const absTol = 0.001, relTol = 1e-6;
const limit = Math.max(absTol, relTol * Math.max(Math.abs(a), Math.abs(b)));
console.log(Number.isFinite(a) && Number.isFinite(b) &&
  Math.abs(a - b) <= limit); // true
```

两者相差约 0.0004 米，限值为 0.001 米。通过检查表示「对这个任务足够接近」，不表示两个数完全相同。

## 没有通用的 epsilon

`Number.EPSILON` 是 `2⁻⁵²`，表示 1 与下一个更大可表示值的距离，不是万能误差预算。间距随数值量级变化，测量不确定性和累积误差也需要考虑。

非有限输入与极端数值范围要另外处理。少显示几位小数只改变外观，不会改写存储值和运算。本例容差也不是通用的财务舍入规则。

参考：[MDN：Number.EPSILON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON)。
