---
key: network-encapsulation
locale: zh
cardId: K-021
title: '网络数据的逐层封装'
subtitle: '同一份内容，不同层各管一段路。'
summary: 'TCP 头部区分传输端点，IP 头部支持跨网路由，以太网帧负责当前链路。沿途路由器换帧转发，不是把最终目标 IP 换成下一跳。'
topic: networks
languages: []
cardArt: '/images/network-encapsulation.svg'
facts:
  - { label: 'IP 目标', value: '远端接口' }
  - { label: '帧目标', value: '当前下一跳' }
tags: [TCP, IPv4, Ethernet, 封装]
updated: '2026-11-20'
status: preview
---

## 为什么一次发送需要几种头部

设主机 A 要通过路由器 R，把数据发送到另一个以太网子网的主机 B。端口、IP 地址和 MAC 地址回答不同的问题，不能互相替代。

| 层次 | 本例采用的协议 | 主要问题 |
| --- | --- | --- |
| 应用层 | 自定义文本内容 | 这些字节对应用意味着什么？ |
| 传输层 | TCP | 字节流属于哪组通信端点，怎样排序和可靠传送？ |
| 网络层 | IPv4 | 目标网络接口在哪里，包应经哪条路转发？ |
| 链路层 | Ethernet | 当前链路上的帧要交给哪个接口？ |

端口要与地址、传输协议等结合解释，不是跨整个互联网唯一的程序编号。IP 也不是设备永久不变的身份。

## 用 12 字节算一次封装

假设应用发送 ASCII 文本 `HELLO WORLD!`，恰好 12 字节，并且本例装入一个 TCP 段。采用没有选项的 TCP 和 IPv4 头部，不使用 TLS、VLAN 或隧道。

```text
Ethernet frame
[ Ethernet header
    [ IPv4 header
        [ TCP header [ HELLO WORLD! ] ] ]
  Ethernet FCS ]
```

| 层次 | 新增内容 | 本例累计字节 |
| --- | --- | --- |
| 应用数据 | 12 字节正文 | 12 |
| TCP 段 | 20 字节 TCP 头部 | 32 |
| IPv4 包 | 20 字节 IPv4 头部 | 52 |
| Ethernet 帧 | 14 字节头部和 4 字节 FCS | 70 |

本例的以太网数据部分为 52 字节，已达到通常 46 字节的最小数据长度，无需额外填充。70 字节不包含前导码、帧起始定界符或帧间间隔；这是简化的格式计算，不是实测吞吐量。常见 1,500 字节 Ethernet MTU 指链路承载的网络层包上限，不包含这里的 14 字节头部和 4 字节 FCS。

## 路由器换什么，不换什么

再限定：这是普通 IPv4 转发，没有 NAT 或隧道，包足够小而无需分片。

```text
A -- Ethernet subnet 1 -- R -- Ethernet subnet 2 -- B
```

| 字段 | A 发往 R 的帧 | R 发往 B 的帧 |
| --- | --- | --- |
| 源 MAC | A 的接口 | R 在子网 2 的接口 |
| 目标 MAC | R 在子网 1 的接口 | B 的接口 |
| 源 / 目标 IP | A / B | 仍是 A / B |
| TCP 源 / 目标端口 | 本次连接的两端端口 | 保持不变 |
| IPv4 TTL | 初始值，例如 64 | 减为 63 |

A 根据路由选择下一跳 R；在本地以太网上，可以用 ARP 解析 R 的 IPv4 邻居地址对应的 MAC。A 不是通过 ARP 跨互联网直接查询 B 的 MAC。

R 去掉收到的链路封装，按目标 IP 决定转发方向，递减 TTL 并更新 IPv4 头部校验和，再建立适合出接口的新帧。B 接收后逐层检查、解封装；TCP 按连接状态重组字节流，再交给应用。

## 不能从示意图推断什么

- **一次应用写入不保证一个 TCP 段**：大数据可拆分，多次写入也可合并，详见 [TCP 消息边界](/zh/knowledge/tcp-message-boundaries/)。HTTP 请求和 IP 包更不保证一一对应。
- **分层不是只有这一种组合**：HTTPS 的 HTTP/1.1、HTTP/2 通常通过 TLS 和 TCP；HTTP/3 使用 QUIC，经 UDP 承载，不能硬套本例的 TCP 头部。
- **MAC 不是所有链路的共同前提**：PPP 等链路采用不同格式。IPv6 使用邻居发现，而不是 ARP。
- **抓包显示不一定等于线上完整帧**：网卡卸载、抓包位置以及 FCS 是否保留会影响可见数据；上面的字节表是明确假设下的计算。

参考：[RFC 9293：TCP](https://www.rfc-editor.org/rfc/rfc9293)、[RFC 791：IPv4](https://www.rfc-editor.org/rfc/rfc791)。
