---
key: http-vs-html
locale: en
cardId: K-020
title: 'HTTP is not HTML'
subtitle: 'Delivery rules are not the delivered content.'
summary: 'HTTP defines request and response semantics; HTML describes page structure. A status code reports the outcome, Content-Type identifies the body type, and the body carries the content.'
topic: web
languages: []
cardArt: '/images/http-vs-html.svg'
facts:
  - { label: 'HTTP', value: 'Protocol' }
  - { label: 'HTML', value: 'Markup' }
tags: [HTTP, HTML, Request-response]
updated: '2026-11-20'
status: preview
---

## Similar names, different responsibilities

To visit a web page, a browser typically sends an HTTP request and receives HTML in the response. The two often appear together, but they are different kinds of things.

| Name | What it is | What it controls |
| --- | --- | --- |
| HTTP: Hypertext Transfer Protocol | A communication protocol | Requesting resources, expressing response status, and transferring content |
| HTML: HyperText Markup Language | A markup language | Page structure such as headings, paragraphs, links, and forms |

`<h1>Hello</h1>` is HTML. `GET`, `200`, and `Content-Type` belong to different parts of an HTTP exchange; they are not HTML tags.

## How one request and response fit together

These are simplified HTTP/1.1 message illustrations, not executable commands or a complete list of optional headers. An empty line separates the headers from the body.

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

The body is exactly `<h1>Hello</h1>`, without the code block's display newline. Its 14 ASCII characters also occupy 14 UTF-8 bytes. A real Content-Length counts bytes, not the character count of arbitrary text.

| Part | Meaning here | What it does not replace |
| --- | --- | --- |
| Request method `GET` | Request a representation of the target resource | It does not mean a result has already arrived |
| Request target `/greeting` | The path being requested | It does not require a file with that name on the server |
| Status code `200` | This request succeeded | It does not contain the actual page |
| `Content-Type: text/html` | The body is delivered as HTML | It does not guarantee safe or trustworthy content |
| Body `<h1>Hello</h1>` | The page content delivered to the browser | It is not another HTTP request |

## The browser still has work to do

```text
Browser sends a GET request
        |
        v
Server produces: status line + headers + HTML body
        |
        v
Browser parses HTML -> builds a DOM -> lays out and paints with styles
```

HTML may reference CSS, JavaScript, and images, prompting further requests. A server can also execute its own program to generate HTML; the browser receives that result, not an instruction to run the server's source code.

## One protocol can deliver different content

For JSON, a server can send `Content-Type: application/json` with a body such as `{"ok":true}`. It is still HTTP; changing the body from a page to data does not create a new communication protocol.

- **HTTP does not only transfer HTML**: JSON, images, audio, and PDFs are also possible.
- **HTML does not require HTTP**: browsers can open local HTML files, although local permissions and resource paths still affect behavior.
- **Responses have no “response method” field**: methods belong to requests and status codes to responses; both GET and POST can receive `200`.
- **Not every response has a body**: `204 No Content` has none, and HEAD responses carry no body either.
- **HTTPS protects transport**: TLS protects communication; it neither makes the author trustworthy nor automatically makes malicious HTML safe.

The textual message form above belongs to HTTP/1.1. HTTP/2 and HTTP/3 use different frame encodings, but the distinctions between protocol and content, and between request method and response status, still apply.

References: [MDN: Overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview), [MDN: HTML](https://developer.mozilla.org/en-US/docs/Web/HTML).
