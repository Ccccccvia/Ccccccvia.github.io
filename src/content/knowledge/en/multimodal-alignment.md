---
key: multimodal-alignment
locale: en
cardId: K-011
title: 'Image–text alignment'
subtitle: 'Matching dimensions is only the beginning.'
summary: 'CLIP-like contrastive training teaches image and text encoders to make matching pairs relatively similar. Equal vector length alone cannot provide semantic alignment.'
topic: 'ai'
cardArt: '/images/multimodal-alignment.svg'
facts:
  - { label: 'Shared dimensions', value: 'Not enough' }
  - { label: 'Paired training', value: 'Relative similarity' }
tags: [multimodal, embeddings, CLIP]
updated: '2026-11-18'
status: preview
---

## Why can a picture match a sentence?

An image begins as pixels; a caption begins as text. Comparing their raw values does not reveal shared meaning.
Even converting both to vectors with the same number of entries only makes comparison mechanically possible.
It does not make corresponding directions mean the same thing.

Semantic alignment must be learned or otherwise established, not assumed from matching dimensions.

## Two encoders, one comparison space

In a CLIP-like architecture, an image encoder processes an image while a text encoder processes its caption.
Their outputs are projected into a shared embedding space and normalized for similarity comparison.

```text
bicycle image → image encoder → image embedding
bicycle caption → text encoder → text embedding
                           ↓
                 compare in a shared space
```

The encoders do not need identical internal structures.
What matters is that training gives their output coordinates a compatible use in the comparison.

## Pairing supplies the training signal

A training batch contains paired images and captions. Contrastive learning promotes the similarity
of each recorded pair relative to the other image–caption combinations in that batch.

The objective operates in both directions: find the caption for an image and the image for a caption.
Repeated comparisons adjust the encoders rather than merely renaming vector entries.
Other batch combinations serve as contrasting examples, although some can still be semantically related.

## Read a small bicycle example

Imagine an original drawing of a bicycle leaning beside a fence.
Compare its image embedding with two separately encoded captions:

| Caption | Schematic similarity | Interpretation |
| --- | ---: | --- |
| A bicycle beside a fence | 0.78 | More compatible in this illustration |
| A ceramic cup on a saucer | 0.12 | Less compatible in this illustration |

These scores are invented illustrations, not measurements or probabilities.
A value of 0.78 does not mean a 78% chance that every statement in the caption is true.

The artwork places the matching pair close together and the cup caption farther away.
That two-dimensional sketch explains the relationship; it is not an actual embedding projection.

## Similarity has boundaries

- A shared space does not guarantee correct object counts, spatial relationships, or negation handling.
- Training data and domain shifts influence which features become useful shortcuts.
- A plausible caption can resemble an image semantically while making an unsupported factual claim.

This is one multimodal architecture, not a description of all multimodal systems.
Similarity supports retrieval and ranking; it does not by itself establish truth or guarantee detailed visual grounding.

## Reference

- [CLIP: Learning Transferable Visual Models From Natural Language Supervision](https://arxiv.org/html/2103.00020v1#S2.SS3) — contrastive image–text pretraining and its shared representation.
