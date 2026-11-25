---
key: url-query-and-fragment
locale: zh
cardId: K-008
title: '查询与片段'
subtitle: '同一行地址，走向不同的位置。'
summary: '查询部分进入 HTTP 请求目标，片段不会。浏览器可以在本地使用片段，但脚本也能主动把它发送出去。'
topic: 'web'
cardArt: '/images/url-query-and-fragment.svg'
facts:
  - { label: '? 查询', value: '进入请求目标' }
  - { label: '# 片段', value: '供客户端使用' }
tags: [URL, HTTP, 浏览器]
updated: '2026-11-18'
status: preview
---

## 地址的哪部分会到达服务器？

看一个使用保留示例域名的地址：

```text
https://example.org/catalog?sort=date#shipping
```

其中查询是 `sort=date`，片段是 `shipping`。
它们并排出现在地址栏里，但普通 HTTP 导航时，并不会沿着同一条路线传递。

## 分清请求选择与页面定位

路径指出请求的位置，查询则携带接收方可以解释的附加数据。
应用可以把 `sort=date` 解释为按日期排序；这个含义不是 HTTP 自动规定的。

片段由客户端处理，不包含在 HTTP 请求目标中。
对于 HTML 文档，它可以指向一个供浏览器滚动定位的元素，例如 `id="shipping"`。
客户端路由也可以为片段赋予其他含义。

| 组成 | 示例 | 此次导航中的作用 |
| --- | --- | --- |
| 主机 | `example.org` | 请求的目的主机 |
| 路径 | `/catalog` | 请求的位置 |
| 查询 | `sort=date` | 随请求目标发送的数据 |
| 片段 | `shipping` | 客户端定位线索 |

## 看一次具体请求

采用普通 origin-form 请求目标的直接 HTTP/1.1 请求，相关行如下：

```http
GET /catalog?sort=date HTTP/1.1
Host: example.org
```

请求目标里没有 `#shipping`，但主机仍会出现在自己的首部中。
这里描述的是这一种请求形式，不是说所有协议或代理都发送完全相同的文本。

收到文档后，浏览器可以根据片段定位配送说明区域。
如果文档没有匹配的目标，片段不会凭空创建该区域，也不保证出现可见的跳转。

## 留在客户端，不等于保密

页面脚本可以读取 `location.hash`，再显式发送其中的内容。
片段也可能留在地址栏、浏览历史或复制出去的链接里。
不能仅凭它不在初始请求目标中，就把它当成存放秘密的安全位置。

HTTPS 会在传输中加密查询，使无法接触解密流量的网络观察者不能直接读到它。
接收方仍然能看见查询，应用日志、浏览历史或共享链接也可能保存它。

## 记住这条边界

把查询看成请求数据，把片段看成客户端地址信息。
两者本身都不提供保密性；哪些信息适合放进 URL，需要另外判断。

## 参考资料

- [RFC 3986：查询与片段，第 3.4–3.5 节](https://www.rfc-editor.org/rfc/rfc3986)
- [WHATWG URL 标准](https://url.spec.whatwg.org/)
