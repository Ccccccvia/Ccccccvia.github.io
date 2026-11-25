---
key: url-query-and-fragment
locale: en
cardId: K-008
title: 'Query & fragment'
subtitle: 'One address, two different destinations.'
summary: 'The query accompanies the HTTP request target; the fragment stays out of it. A browser can use the fragment locally, but scripts can also transmit it.'
topic: 'web'
cardArt: '/images/url-query-and-fragment.svg'
facts:
  - { label: '? query', value: 'In request target' }
  - { label: '# fragment', value: 'Client-side use' }
tags: [URL, HTTP, browser]
updated: '2026-11-18'
status: preview
---

## Which part reaches the server?

Consider this address on the reserved example domain:

```text
https://example.org/catalog?sort=date#shipping
```

The query is `sort=date`; the fragment is `shipping`.
They share an address bar, but they do not follow the same route during an ordinary HTTP navigation.

## Separate request selection from page location

The path identifies the requested location. The query supplies additional data that the recipient may interpret.
Here, the application could interpret `sort=date` as a sorting instruction; that meaning is not built into HTTP.

The fragment is handled on the client side rather than included in the HTTP request target.
For an HTML document, it can identify an element to scroll to, such as an element with `id="shipping"`.
Client-side routers can assign it other meanings.

| Component | Example | Role in this navigation |
| --- | --- | --- |
| Host | `example.org` | Request destination |
| Path | `/catalog` | Requested location |
| Query | `sort=date` | Data sent with the target |
| Fragment | `shipping` | Client-side location cue |

## Inspect one concrete request

For a direct HTTP/1.1 request using the ordinary origin-form target, the relevant lines are:

```http
GET /catalog?sort=date HTTP/1.1
Host: example.org
```

There is no `#shipping` in the request target. The host still appears in its own header.
This example describes that request form, not a claim that every protocol or proxy sends identical text.

After receiving the document, the browser can use the fragment to locate the shipping section.
If the document has no matching target, the fragment does not create that section or guarantee a visible jump.

## Client-side does not mean secret

A script on the page can read `location.hash` and explicitly transmit its contents.
The fragment can also remain in the address bar, browser history, or a copied link.
It is not a safe place to store secrets merely because the initial request target excludes it.

HTTPS encrypts the query in transit against network observers without access to the decrypted traffic.
The recipient still sees it, and application logs, browser history, or shared links may preserve it.

## A useful boundary

Treat the query as request data and the fragment as client-side address information.
Neither component provides confidentiality by itself; decide separately what information belongs in a URL.

## References

- [RFC 3986: Query and fragment, sections 3.4–3.5](https://www.rfc-editor.org/rfc/rfc3986)
- [WHATWG URL Standard](https://url.spec.whatwg.org/)
