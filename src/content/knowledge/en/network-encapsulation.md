---
key: network-encapsulation
locale: en
cardId: K-021
title: 'Network encapsulation'
subtitle: 'The same content, with a different job at each layer.'
summary: 'TCP identifies transport endpoints, IP supports routing across networks, and Ethernet handles the current link. Routers replace frames without replacing the final destination IP with the next hop.'
topic: networks
languages: []
cardArt: '/images/network-encapsulation.svg'
facts:
  - { label: 'IP target', value: 'Remote interface' }
  - { label: 'Frame target', value: 'Current next hop' }
tags: [TCP, IPv4, Ethernet, Encapsulation]
updated: '2026-11-20'
status: preview
---

## Why one transmission needs several headers

Suppose host A sends data through router R to host B on another Ethernet subnet. Ports, IP addresses, and MAC addresses answer different questions; none replaces the others.

| Layer | Protocol in this example | Main question |
| --- | --- | --- |
| Application | Custom text content | What do these bytes mean to the application? |
| Transport | TCP | Which endpoints own the byte stream, and how is it ordered and reliably transferred? |
| Network | IPv4 | Where is the destination interface, and which route should forward the packet? |
| Link | Ethernet | Which interface on the current link should receive this frame? |

A port must be interpreted together with an address, transport protocol, and related context. It is not an Internet-wide unique program number. An IP address is not a permanent device identity either.

## Encapsulating 12 bytes

Assume the application sends the ASCII text `HELLO WORLD!`: exactly 12 bytes, carried in one TCP segment for this example. TCP and IPv4 have no header options, and there is no TLS, VLAN tagging, or tunneling.

```text
Ethernet frame
[ Ethernet header
    [ IPv4 header
        [ TCP header [ HELLO WORLD! ] ] ]
  Ethernet FCS ]
```

| Layer | Added content | Running byte count |
| --- | --- | --- |
| Application data | 12-byte body | 12 |
| TCP segment | 20-byte TCP header | 32 |
| IPv4 packet | 20-byte IPv4 header | 52 |
| Ethernet frame | 14-byte header and 4-byte FCS | 70 |

The Ethernet data field is 52 bytes, already meeting the usual 46-byte minimum, so no padding is needed. The 70 bytes exclude the preamble, start-frame delimiter, and inter-frame gap. This is a simplified format calculation, not a throughput measurement. A common 1,500-byte Ethernet MTU limits the network-layer packet carried on the link; it excludes the 14-byte header and 4-byte FCS shown here.

## What a router changes—and what it keeps

Add these constraints: ordinary IPv4 forwarding, no NAT or tunnel, and a packet small enough to avoid fragmentation.

```text
A -- Ethernet subnet 1 -- R -- Ethernet subnet 2 -- B
```

| Field | Frame from A to R | Frame from R to B |
| --- | --- | --- |
| Source MAC | A's interface | R's subnet-2 interface |
| Destination MAC | R's subnet-1 interface | B's interface |
| Source / destination IP | A / B | Still A / B |
| TCP source / destination ports | The connection's endpoint ports | Unchanged |
| IPv4 TTL | An initial value such as 64 | Decreased to 63 |

A chooses R as its next hop using its route. On the local Ethernet link, ARP can resolve that IPv4 neighbor's address to a MAC address. A does not use ARP to query B's MAC directly across the Internet.

R removes the incoming link encapsulation, selects a forwarding direction using the destination IP, decreases TTL and updates the IPv4 header checksum, then constructs a frame suitable for the outgoing interface. B checks and removes the layers; TCP reassembles the byte stream according to connection state before delivering data to the application.

## What the diagram does not promise

- **One application write is not necessarily one TCP segment**: data can be split or multiple writes combined; see [TCP message boundaries](/en/knowledge/tcp-message-boundaries/). HTTP requests and IP packets are not necessarily one-to-one either.
- **This is not the only protocol stack**: HTTPS with HTTP/1.1 or HTTP/2 commonly uses TLS and TCP; HTTP/3 uses QUIC over UDP, so this example's TCP header does not apply.
- **MAC addressing is not universal**: links such as PPP use different formats. IPv6 uses Neighbor Discovery rather than ARP.
- **A packet capture may not show the complete wire frame**: NIC offloading, capture location, and whether FCS is retained affect the visible data. The byte table is a calculation under explicit assumptions.

References: [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293), [RFC 791: IPv4](https://www.rfc-editor.org/rfc/rfc791).
