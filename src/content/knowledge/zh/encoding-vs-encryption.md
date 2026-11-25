---
key: encoding-vs-encryption
locale: zh
cardId: K-009
title: '编码不是加密'
subtitle: '换一套字母，不等于锁上一扇门。'
summary: 'Base64 不用秘密就能改变字节的表示方式。加密保护机密性；认证加密还会检测未经授权的修改。'
topic: 'security'
languages: [JavaScript]
cardArt: '/images/encoding-vs-encryption.svg'
facts:
  - { label: 'Base64', value: '无需秘密即可还原' }
  - { label: '认证加密', value: '机密性 + 完整性' }
tags: [Base64, 编码, 加密]
updated: '2026-11-18'
status: preview
---

## 看不懂的字符串就是密文吗？

不是。字符串看起来陌生，可能只是因为同一组字节换了一套字母来表示。
编码解决数据如何表示的问题；加密解决没有密钥时，如何让内容保持机密的问题。

这两项任务不同，即使它们的输出都可能看起来像随机字符。
仅凭外观，无法确认一个字符串受到什么保护。

## 跟着三个字节走一遍

文本 `cat` 在 UTF-8 中占三个字节。下面依次是文本、十六进制字节和 Base64 表示：

```text
文本                 cat
UTF-8 字节（十六进制） 63 61 74
Base64               Y2F0
```

Base64 把比特分成每组六位的数值，再映射到公开的字符表。
反向映射不需要密码或秘密。任何知道格式并拿到 `Y2F0` 的人，都能恢复原始字节。

对于这个仅含 ASCII 的例子，浏览器 JavaScript 可以展示往返过程：

```js
btoa('cat');   // 'Y2F0'
atob('Y2F0');  // 'cat'
```

`btoa` 不是 Unicode 文本编码器：它接收的二进制字符串，字符值必须能装进一个字节。
一般的 Unicode 文本应先通过合适的文本编码转换成字节，再做 Base64 编码。

## 编码信封里面也可以装密文

加密利用密码学密钥材料，把明文转换为密文。
密文字节还可以再套一层 Base64，方便通过面向文本的渠道传递。

```text
明文 → 加密 → 密文字节 → Base64 → 传输文本
传输文本 → Base64 解码 → 密文字节
密文字节 → 使用正确密钥解密 → 明文
```

拆掉 Base64 这层信封，并不会解除里面的加密。
密文字节不一定是有效的 UTF-8；硬当成文本解释，可能失败，也可能得到无意义的字符。

## 分开看机密性与完整性

| 操作 | 主要目的 | 反向还原是否需要秘密 |
| --- | --- | --- |
| Base64 编码 | 用文本表示字节 | 不需要 |
| 加密 | 保护机密性 | 需要 |
| 认证加密 | 保护机密性与完整性 | 需要 |

仅有加密，不一定能够检测篡改。认证加密加入验证，
使遭到修改或无法通过认证的数据能被拒绝，而不是直接当成可信明文接收。

Fernet 是一种认证加密令牌格式，外层使用 URL 安全的 Base64 表示。
解码这层表示，既不等于验证令牌，也不会直接得到明文。
仍然需要正确管理密钥，并完整使用认证加密方案。

## 参考资料

- [cryptography：Fernet](https://cryptography.io/en/latest/fernet/)
- [cryptography：对称加密与认证](https://cryptography.io/en/latest/hazmat/primitives/symmetric-encryption/)
