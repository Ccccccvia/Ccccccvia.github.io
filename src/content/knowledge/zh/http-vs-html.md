---
key: http-vs-html
locale: zh
cardId: K-020
title: 'HTTP 不是 HTML'
subtitle: '交付的规则，不是交付的内容。'
summary: 'HTTP 规定请求与响应的语义，HTML 描述页面结构。状态码说明处理结果，Content-Type 说明正文类型，正文才承载实际内容。'
topic: web
languages: []
cardArt: '/images/http-vs-html.svg'
facts:
  - { label: 'HTTP', value: '通信协议' }
  - { label: 'HTML', value: '标记语言' }
tags: [HTTP, HTML, 请求响应]
updated: '2026-11-20'
status: preview
---

## 两个名字相似，但职责不同

浏览器访问网页时，通常先发 HTTP 请求，再从响应中取得 HTML。它们经常一起出现，却不属于同一类东西。

| 名称 | 是什么 | 负责什么 |
| --- | --- | --- |
| HTTP：Hypertext Transfer Protocol | 通信协议 | 请求什么资源、怎样表达响应状态、如何传递内容 |
| HTML：HyperText Markup Language | 标记语言 | 页面包含哪些标题、段落、链接和表单等结构 |

`<h1>Hello</h1>` 是 HTML。`GET`、`200` 和 `Content-Type` 则是一次 HTTP 交互中的不同部分；它们不是 HTML 标签。

## 一次请求和响应怎样配合

下面是 HTTP/1.1 的精简消息示意，不是可直接执行的命令，也没有列出所有可选头部。空行分隔头部与正文。

```http
GET /greeting HTTP/1.1
Host: example.com

```

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 14

<h1>Hello</h1>
```

正文只取 `<h1>Hello</h1>`，不包含代码块显示用的末尾换行；它由 14 个 ASCII 字符组成，UTF-8 编码后也是 14 字节。真实的 Content-Length 计算的是字节数，不是任意文本的字符数。

| 部分 | 本例中的意思 | 不能替代什么 |
| --- | --- | --- |
| 请求方法 `GET` | 请求目标资源的表示 | 不代表服务器已经给出了结果 |
| 请求目标 `/greeting` | 本次请求的路径 | 不要求服务器上存在同名文件 |
| 状态码 `200` | 本次请求成功 | 不包含页面实际内容 |
| `Content-Type: text/html` | 正文按 HTML 类型交付 | 不保证内容安全或可信 |
| 正文 `<h1>Hello</h1>` | 交付给浏览器的页面内容 | 不是另一次 HTTP 请求 |

## 浏览器收到之后还要做什么

```text
浏览器发送 GET 请求
        |
        v
服务器生成响应：状态行 + 头部 + HTML 正文
        |
        v
浏览器解析 HTML -> 建立 DOM -> 结合样式进行布局和绘制
```

HTML 可以引用 CSS、JavaScript 和图片，浏览器可能继续请求这些资源。服务器也可以先执行自己的程序生成 HTML；浏览器拿到生成结果，不会因此直接运行服务器的源代码。

## 同一个协议可以交付不同内容

若服务器返回 JSON，可以使用 `Content-Type: application/json`，正文例如 `{"ok":true}`。HTTP 仍然是 HTTP，并没有因为正文不是页面就变成另一套协议。

- **HTTP 不只传 HTML**：也能传 JSON、图片、音频、PDF 等。
- **HTML 不一定经 HTTP**：浏览器能打开本地 HTML 文件，但本地权限和资源路径仍影响行为。
- **响应没有“响应方法”字段**：方法属于请求，状态码属于响应；GET 和 POST 都可以对应 `200`。
- **不是每个响应都有正文**：例如 `204 No Content` 没有正文，HEAD 响应也不携带正文。
- **HTTPS 提供传输保护**：使用 TLS 保护通信，不等于网页作者可信，也不会把恶意 HTML 自动变成安全内容。

上面的文本消息形态属于 HTTP/1.1。HTTP/2 和 HTTP/3 使用不同的帧编码，但协议与内容、请求方法与响应状态的区别仍然成立。

参考：[MDN：HTTP 概述](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)、[MDN：HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)。
