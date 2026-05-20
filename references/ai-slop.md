# AI-slop patterns

The patterns below are the recurring tells that an LLM wrote a passage without an editor. Each entry has the pattern, why it's slop, and a recommended fix. Use these in dimension 3 (professional prose).

The principle: **patterns are findings, single instances usually aren't**. One "leverage" in five thousand words is not slop. "Leverage" three times in one section is.

---

## Tic words and phrases

These are the LLM-favorite words that crowd out specific verbs. The fix is usually "say the actual thing".

| Tic word                    | Why it's slop                                                    | Reach for instead                       |
| --------------------------- | ---------------------------------------------------------------- | --------------------------------------- |
| **leverage** (verb)         | Replaces "use" with corporate fog                                | use, apply, draw on                     |
| **delve into**              | Movie-trailer voice. Nothing actually "delves"                   | explain, cover, walk through            |
| **dive into / dive deep**   | Same family as "delve". Cliché signal                            | explain, examine, work through          |
| **navigate (the X of)**     | "Navigate the complexities of X" — the verb adds no meaning      | (just drop the navigation phrasing)     |
| **robust**                  | Means nothing specific. Hides the property that actually matters | reliable / fault-tolerant / well-tested |
| **comprehensive**           | Same — what's actually covered?                                  | (name what's covered)                   |
| **seamless**                | Marketing word. Real systems have seams                          | (cut, or name the integration point)    |
| **vibrant / dynamic**       | Brochure adjectives                                              | (cut)                                   |
| **cutting-edge**            | Marketing                                                        | (name the actual technology)            |
| **revolutionary**           | Marketing                                                        | (name what changed)                     |
| **game-changing**           | Marketing                                                        | (name the change and its consequence)   |
| **streamlined**             | Marketing                                                        | shorter / fewer steps / faster          |
| **empower (users to)**      | Marketing                                                        | let / enable                            |
| **harness (the power of)**  | Marketing                                                        | use                                     |
| **unlock (potential)**      | Marketing                                                        | (cut entirely)                          |
| **landscape / realm / world** in "the X of Y"  | Decorative noun                          | (cut)                                   |
| **tapestry / mosaic of**    | Decorative noun                                                  | (cut)                                   |
| **paradigm / paradigm shift** | Decorative                                                     | (name what changed)                     |
| **at scale**                | Often filler                                                     | (be specific: at 10M req/s, etc.)       |

---

## Hedge phrases

These appear at the start of a load-bearing statement and soften it for no reason. Cut.

- "It's worth noting that…"
- "It's important to remember that…"
- "It bears mentioning that…"
- "One could argue that…"
- "It might be useful to consider…"
- "In a sense, …"
- "To some extent, …"

The fix is almost always to delete the hedge and start with the actual sentence.

### Example

Before: "It's worth noting that PCI-DSS 4.0 changes the timeline for compliance."
After: "PCI-DSS 4.0 changes the compliance timeline."

---

## Transition adverbs as filler

These have legitimate uses, but LLMs overuse them as paragraph glue.

- "Moreover"
- "Furthermore"
- "Additionally"
- "Consequently"
- "Subsequently"
- "Notably"
- "Importantly"

**Flag when:** More than one appears in the same section, or one appears at the start of a sentence that doesn't need a transition (the second sentence is on the same topic; no glue needed).

### Example

Before: "PCI-DSS 4.0 introduces new MFA requirements. Furthermore, the standard mandates quarterly scans. Additionally, organisations must document scope reduction. Moreover, compensating controls require executive sign-off."

After: "PCI-DSS 4.0 introduces new MFA requirements. The standard mandates quarterly scans, requires documented scope reduction, and demands executive sign-off on compensating controls."

---

## Triplet padding

Three adjectives or nouns where one would do. Often used because LLMs are trained to sound thorough.

- "clear, concise, and comprehensive"
- "secure, scalable, and reliable"
- "robust, performant, and maintainable"
- "auditable, transparent, and verifiable"

**Fix:** Pick the one that actually carries meaning. The other two are usually redundant.

### Example

Before: "A clear, concise, and comprehensive explanation of FAPI 2.0."
After: "An explanation of FAPI 2.0." (the noun already commits the page; the adjective stack adds nothing) — or pick one: "A practitioner's guide to FAPI 2.0."

---

## "Not only X but also Y"

A structure LLMs lean on to sound balanced. Usually the X and the Y aren't really in tension — both are just facts the writer wants to mention.

### Example

Before: "FAPI 2.0 not only mandates sender-constrained tokens but also requires PAR for authorization requests."

After: "FAPI 2.0 mandates sender-constrained tokens and requires PAR for authorization requests."

---

## "X is a Y that Z" definitional padding

The recursion-by-relative-clause sentence shape that LLMs use to define things. Often the simpler form is "Z is X" or just "X: definition".

### Example

Before: "Tokenization is a process by which sensitive data is replaced with a non-sensitive equivalent that has no extrinsic or exploitable meaning."

After: "Tokenization replaces sensitive data with a non-sensitive surrogate that has no exploitable meaning."

---

## Marketing prologue

The opening paragraph that sets the scene with generic urgency. Cut the prologue, start with the substance.

Common openers to flag:
- "In today's fast-paced [adjective] landscape, …"
- "As organisations navigate the complexities of …"
- "In the rapidly evolving world of …"
- "With the increasing demand for …"
- "Modern enterprises face unprecedented challenges in …"

**Fix:** Delete the prologue. The TL;DR should be the first content.

---

## Definitional padding around "involves" / "encompasses"

LLM-favorite verbs when defining a process. Usually replaced with the actual verbs.

- "The process involves [list of nouns]" → "The process [verbs the nouns]"
- "The standard encompasses [list]" → "The standard covers [list]" or just list them

---

## Random bolding

Bold should mark either:
1. A term being defined for the first time
2. The single most important phrase in a paragraph

It should NOT mark:
- Every fourth word for visual interest
- Whole sentences (use blockquote or callout instead)
- Verbs ("you **must** configure")

Flag paragraphs where more than ~10% of words are bolded with no consistent rhetorical pattern.

---

## The "From X to Y" listicle structure

Used to introduce ranges. Often padding.

### Example

Before: "From the smallest startup to the largest enterprise, every organisation needs to understand FAPI."

After: "Every organisation that handles financial-grade API access needs to understand FAPI." (or just delete the sentence — usually the next one carries the point)

---

## Confidence inversions

Phrasing where the writer hedges, then walks the hedge back, then hedges again. LLMs do this when they're uncertain.

### Example

Before: "While it could be argued that PCI-DSS 4.0 is similar to PCI-DSS 3.2.1, the truth is that the new version introduces substantial changes, though many of these are evolutionary rather than revolutionary."

After: "PCI-DSS 4.0 introduces substantial changes from 3.2.1: [list the actual changes]."

---

## What NOT to flag as slop

A few patterns that look like slop but aren't, in this user's context:

- **Em-dashes** — Used deliberately in both sibling skills' output. Don't flag unless they're the only punctuation pattern in a section.
- **Semicolons in technical lists** — Fine. Not slop.
- **Passive voice in security writing** — "Credentials are rotated quarterly" is often correct. The agent doesn't matter; the policy does. Don't flag every passive.
- **Long sentences in protocol descriptions** — Protocol mechanics sometimes need long sentences with many clauses. Flag only when comprehension breaks down (re-read required).
- **British spelling** — User uses British spelling. Don't flag "organisation", "behaviour", "colour", "tokenisation".

---

## How findings should read in the report

Each AI-slop finding should:

1. Quote the exact text
2. Name the pattern (e.g., "tic word: leverage", "hedge phrase", "triplet padding")
3. Propose specific replacement text — not a vague "rewrite this"

Example:

```
[Prose / Minor] §Conceptual overview
Quote:    "We leverage modern tokenization to seamlessly secure cardholder data."
Pattern:  Tic words (leverage, seamlessly), marketing voice
Fix:      "Tokenization replaces stored card numbers with non-sensitive surrogates."
```

The user can compare the two and decide.
