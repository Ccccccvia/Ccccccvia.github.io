---
key: tcp-message-boundaries
locale: en
cardId: K-003
title: 'TCP message boundaries'
subtitle: 'Ordered bytes, not preserved envelopes.'
summary: 'Two writes need not become two reads. A framing rule and an accumulator recover complete messages from the byte stream.'
topic: 'networks'
cardArt: '/images/tcp-message-boundaries.svg'
facts:
  - { label: 'TCP unit', value: 'Byte stream' }
  - { label: 'Example header', value: '2 bytes' }
tags: [TCP, sockets, framing]
updated: '2026-11-18'
status: preview
---

## Order is not a message boundary

Suppose an application writes ASCII `AB`, then `CDE`, on one TCP connection. Once all five bytes are transferred, their order at the receiver is `ABCDE`. TCP does not preserve the two write boundaries for the receiving application.

A successful send reports local acceptance of bytes, not completion of the remote application’s work. A send may accept only part of the supplied data; the sender must account for that count.

## The same stream, different reads

Each row below is a possible grouping of the same five bytes. Vertical bars separate read results, not bytes inserted into the stream.

| Read results | What happened |
| --- | --- |
| `AB │ CDE` | Boundaries happen to match |
| `A │ BCD │ E` | Writes split and coalesced |
| `ABCDE` | Both writes read together |

A read requesting 1,024 bytes may return fewer. Neither a short read nor a convenient grouping defines the end of an application message.

The illustration follows the second row: letters keep their order while the surrounding groups change.

## Put a length before each payload

Choose a two-byte unsigned, big-endian header containing the payload’s byte length. Our ASCII messages become:

```text
[00 02] A B [00 03] C D E
   2 bytes      3 bytes
```

Here `00 02` and `00 03` are hexadecimal header bytes, not printed text. The header excludes its own two bytes from the length.

The stream contains nine bytes in total: four header bytes plus five payload bytes. This rule belongs to the application protocol, not to TCP.

## Accumulate before extracting

Append incoming bytes to a buffer, then repeatedly apply the rule:

1. With fewer than two bytes, wait for the rest of the header.
2. Decode length `L`; check the agreed maximum before accepting it.
3. With fewer than `2 + L` bytes, wait for the remaining payload.
4. Emit that payload, consume exactly `2 + L` bytes, and inspect any leftovers.

| Newly received | Result | Buffer left |
| --- | --- | --- |
| `00` | Header incomplete | `00` |
| `02 A B 00` | Emit `AB` | `00` |
| `03 C` | Payload incomplete | `00 03 C` |
| `D E` | Emit `CDE` | Empty |

Clearing the whole buffer after emitting `AB` would lose the next header’s first byte.

## Specify the remaining limits

Count encoded **bytes**, not Unicode characters. A character may occupy multiple bytes. Both endpoints must agree on encoding, header order, and the maximum payload size.

Two header bytes encode at most 65,535 payload bytes; an application can impose a smaller limit. Connection closure with an incomplete frame means truncated input, not a complete message.

Reference: [Python Socket Programming HOWTO](https://docs.python.org/3/howto/sockets.html).
