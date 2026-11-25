---
key: hard-links-and-symlinks
locale: en
cardId: K-004
title: 'Hard links & symlinks'
subtitle: 'A shared identity or a stored route.'
summary: 'Hard links give one file multiple equal names. A symbolic link instead stores a path, which can stop resolving when a name disappears.'
topic: 'operating-systems'
cardArt: '/images/hard-links-and-symlinks.svg'
facts:
  - { label: 'Hard link', value: 'Same inode' }
  - { label: 'Symlink', value: 'Target path' }
tags: [Linux, filesystems, links]
updated: '2026-11-18'
status: preview
---

## Separate the name from the file

In a Linux filesystem, a directory entry associates a name with an inode: the file’s identity and metadata within that filesystem. Two hard links are two names for the same inode, not two independent copies of its contents.

Neither name is a privileged “original.” Updating the existing file through either name changes the shared contents. Replacing a directory entry with a different file is a separate operation.

## Compare identity with a route

Suppose `a` and `b` name inode 42. A symbolic link named `s` has its own inode, 77, whose contents specify the target path `a`.

```text
a ───────────────► inode 42 ──► data
b ───────────────► inode 42
s ──► inode 77 ──► path "a" ──► inode 42
```

The numbers are illustrative, not globally unique identifiers. Following `s` requires resolving its stored path; the symlink does not directly add a hard link to inode 42.

## Remove one name, not every route

Assume all three names are in the same directory, and only `a` is removed:

| Observation | Before | After |
| --- | --- | --- |
| Hard-link count of inode 42 | 2 | 1 |
| Access through `b` | Works | Still works |
| Access through `s` | Reaches `a` | Dangling target |
| Symlink inode 77 | Exists | Still exists |

The symlink survives as a link object even though following it fails. If a different file later receives the name `a`, the unchanged symlink can resolve to that new file.

## Paths and filesystem boundaries

- Hard links must stay within one filesystem. Ordinary users cannot create hard links to directories.
- Symlinks can target directories or paths across filesystems, subject to normal access permissions.
- A relative symlink target is resolved from the directory containing the symlink, not the caller’s working directory.

For example, `shelf/shortcut` storing `../items/a` resolves to `items/a` relative to the parent of `shelf`.

Moving that symlink elsewhere can therefore change what its unchanged target text means.

## When can the space be reused?

Removing the last hard-link name makes the link count zero. For an ordinary file, storage can be reclaimed only when no open references remain as well; an open descriptor can keep a nameless file usable.

```text
links > 0                   → named file remains
links = 0, open reference    → file still retained
links = 0, no open reference → space may be reclaimed
```

This describes file lifetime, not secure erasure. Unlinking does not promise that old storage bytes have been overwritten.

Reference: [Linux unlink(2) manual](https://man7.org/linux/man-pages/man2/unlink.2.html).
