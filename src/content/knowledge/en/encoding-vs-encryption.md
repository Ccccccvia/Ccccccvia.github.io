---
key: encoding-vs-encryption
locale: en
cardId: K-009
title: 'Encoding vs encryption'
subtitle: 'A different alphabet is not a locked door.'
summary: 'Base64 changes how bytes are represented without a secret. Encryption protects confidentiality; authenticated encryption also detects unauthorized modification.'
topic: 'security'
languages: [JavaScript]
cardArt: '/images/encoding-vs-encryption.svg'
facts:
  - { label: 'Base64', value: 'No secret needed' }
  - { label: 'Authenticated encryption', value: 'Privacy + integrity' }
tags: [Base64, encoding, encryption]
updated: '2026-11-18'
status: preview
---

## Does unreadable text mean encrypted data?

No. A string can look unfamiliar simply because its bytes are written using another alphabet.
Encoding answers how to represent data. Encryption answers how to keep its contents confidential without the key.

Those are different jobs, even when both outputs look like random characters.
A visual inspection cannot establish which protection a string has.

## Follow three bytes

The text `cat` uses three UTF-8 bytes. Here they are in hexadecimal, followed by their Base64 representation:

```text
text                 cat
UTF-8 bytes (hex)     63 61 74
Base64               Y2F0
```

Base64 groups the bits into six-bit values and maps each value to a public alphabet.
The reverse mapping needs no password or secret. Anyone with `Y2F0` and the format can recover the original bytes.

For this ASCII-only example, browser JavaScript can demonstrate the round trip:

```js
btoa('cat');   // 'Y2F0'
atob('Y2F0');  // 'cat'
```

`btoa` is not a Unicode text encoder: it expects a binary string whose character values fit in one byte.
General Unicode text must first be converted to bytes with a suitable text encoding.

## An envelope can contain ciphertext

Encryption transforms plaintext into ciphertext using cryptographic key material.
The ciphertext can then be Base64-encoded so a text-oriented channel can carry it.

```text
plaintext → encrypt → ciphertext bytes → Base64 → transport text
transport text → Base64 decode → ciphertext bytes
ciphertext bytes → decrypt with the right key → plaintext
```

Removing the Base64 envelope does not remove the encryption inside it.
Ciphertext bytes need not be valid UTF-8; interpreting them as text can fail or produce meaningless characters.

## Separate confidentiality from integrity

| Operation | Main purpose | Secret needed to reverse |
| --- | --- | --- |
| Base64 encoding | Represent bytes as text | No |
| Encryption | Protect confidentiality | Yes |
| Authenticated encryption | Confidentiality and integrity | Yes |

Encryption alone does not necessarily detect tampering. Authenticated encryption adds verification,
so modified or unauthentic data can be rejected instead of accepted as genuine plaintext.

Fernet is an authenticated-encryption token format with a URL-safe Base64 outer representation.
Decoding that representation does not authenticate the token or reveal its plaintext.
Correct key handling and use of the complete authenticated scheme still matter.

## References

- [cryptography: Fernet](https://cryptography.io/en/latest/fernet/)
- [cryptography: Symmetric encryption and authentication](https://cryptography.io/en/latest/hazmat/primitives/symmetric-encryption/)
