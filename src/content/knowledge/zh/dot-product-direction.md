---
key: dot-product-direction
locale: zh
cardId: K-010
title: '点积判断前后'
subtitle: '看正负，不必先求夹角。'
summary: '用前向向量点乘“目标减观察者”的位移向量，符号就能区分前后；不需要归一化，也不需要反余弦。'
topic: 'mathematics'
languages: [JavaScript]
cardArt: '/images/dot-product-direction.svg'
facts:
  - { label: '点积为正', value: '前半平面' }
  - { label: '点积为负', value: '后半平面' }
tags: [向量, 几何, 游戏]
updated: '2026-11-18'
status: preview
---

## 目标在观察者的前方吗？

使用同一坐标空间里的两个向量：观察者的前向，以及指向目标的位移。
先用目标位置减去观察者位置；目标的绝对坐标，并不是这段位移。

这两个向量的点积符号，就能回答前后问题。
不需要先把夹角的数值求出来。

## 从定义推出符号意义

设非零向量 `a`、`b` 的长度分别为 `A`、`B`，方向角分别为 `p`、`q`。
展开分量，便能得到下面的恒等式：

```text
a = (A cos p, A sin p); b = (B cos q, B sin q)
a · b = ax bx + ay by
      = AB (cos p cos q + sin p sin q)
      = AB cos(p - q)
      = |a| |b| cos θ
```

两个长度都是正数，因此符号只由余弦决定：
锐角为正，钝角为负，两个非零向量垂直时为零。
只做这项判断，不需要归一化，也不需要调用 `acos`。

## 把坐标算清楚

观察者 `O = (2, 1)`，前向 `f = (2, 0)`，朝向 x 增大的方向。
先计算 `d = 目标位置 - O`，再计算 `f · d`：

| 目标位置 | 位移 d | 点积 | 结果 |
| --- | --- | --- | --- |
| `(5, 4)` | `(3, 3)` | `2×3 + 0×3 = 6` | 前方 |
| `(0, 4)` | `(-2, 3)` | `2×(-2) + 0×3 = -4` | 后方 |
| `(2, 4)` | `(0, 3)` | `0` | 边界 |

分界线穿过观察者，并与前向垂直。
在这个例子里，它是竖直直线 `x = 2`，不是世界坐标的 `x = 0` 轴。

## 一个简短的符号判断函数

前提：位置与前向使用同一坐标空间，分量都是有限数值，
且前向向量非零；减法、乘法及最终求和也必须保持有限，不能用于极端数值范围。
函数把目标与观察者重合的情况单独返回。

```js
function sideOfObserver(observer, forward, target) {
  const dx = target.x - observer.x;
  const dy = target.y - observer.y;
  if (dx === 0 && dy === 0) return 'coincident';
  const dot = forward.x * dx + forward.y * dy;
  return dot > 0 ? 'front' : dot < 0 ? 'back' : 'boundary';
}
```

## 明确判断的边界

零位移没有方向，零前向无法定义前方。
向量不是单位向量时，点积本身不是余弦值；例子中的结果 6 完全合理。

这项测试划分的是半平面，在三维中则是半空间。它不能替代更窄的视野范围测试，
也不检查距离或遮挡。靠近分界线时，浮点数应用可能需要明确的容差策略。

## 参考资料

- [Wolfram MathWorld：点积](https://mathworld.wolfram.com/DotProduct.html) — 分量定义与几何定义；上文坐标示例及推导均从定义独立展开。
