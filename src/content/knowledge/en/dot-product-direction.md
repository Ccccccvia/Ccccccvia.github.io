---
key: dot-product-direction
locale: en
cardId: K-010
title: 'Front or back?'
subtitle: 'A sign test, not an angle calculation.'
summary: 'Dot the forward vector with target minus observer. Its sign separates front from back, without normalization or an inverse cosine.'
topic: 'mathematics'
languages: [JavaScript]
cardArt: '/images/dot-product-direction.svg'
facts:
  - { label: 'Positive dot', value: 'Front half-plane' }
  - { label: 'Negative dot', value: 'Back half-plane' }
tags: [vectors, geometry, games]
updated: '2026-11-18'
status: preview
---

## Is the target in front of the observer?

Use two vectors in the same coordinate space: the observer's forward direction and the displacement to the target.
Subtract the observer's position from the target's position; the target's absolute coordinates are not that displacement.

The sign of their dot product answers the front-or-back question.
It does not require computing the angle itself.

## Derive the sign from the definition

Let nonzero vectors `a` and `b` have lengths `A` and `B`, with direction angles `p` and `q`.
Their components give the identity directly:

```text
a = (A cos p, A sin p); b = (B cos q, B sin q)
a · b = ax bx + ay by
      = AB (cos p cos q + sin p sin q)
      = AB cos(p - q)
      = |a| |b| cos θ
```

The lengths are positive, so only the cosine determines the sign:
positive for an acute angle, negative for an obtuse angle, and zero for perpendicular nonzero vectors.
Normalization and `acos` are unnecessary for this test.

## Keep the coordinates concrete

Observer `O = (2, 1)` and forward `f = (2, 0)` point toward increasing x.
Use `d = target - O`, then calculate `f · d`:

| Target | Displacement d | Dot product | Result |
| --- | --- | --- | --- |
| `(5, 4)` | `(3, 3)` | `2×3 + 0×3 = 6` | Front |
| `(0, 4)` | `(-2, 3)` | `2×(-2) + 0×3 = -4` | Back |
| `(2, 4)` | `(0, 3)` | `0` | Boundary |

The dividing line passes through the observer, perpendicular to forward.
Here it is the vertical line `x = 2`, not the world's `x = 0` axis.

## A small sign helper

Precondition: positions and forward use the same coordinate space, components are finite numbers,
and forward is nonzero. Subtractions, products, and the final sum must also remain finite;
this is not an extreme-range routine. The helper treats a coincident target separately.

```js
function sideOfObserver(observer, forward, target) {
  const dx = target.x - observer.x;
  const dy = target.y - observer.y;
  if (dx === 0 && dy === 0) return 'coincident';
  const dot = forward.x * dx + forward.y * dy;
  return dot > 0 ? 'front' : dot < 0 ? 'back' : 'boundary';
}
```

## Know the limits

Zero displacement has no direction; a zero forward vector cannot define front.
With nonunit vectors, the dot product is not itself a cosine: the example's value of 6 is valid.

This divides a half-plane, or a half-space in 3D. It is not a narrower field-of-view test,
a distance check, or an occlusion test. Near the boundary, floating-point applications may need a deliberate tolerance policy.

## Reference

- [Wolfram MathWorld: Dot Product](https://mathworld.wolfram.com/DotProduct.html) — component and geometric definitions; the coordinates and derivation above are worked independently.
