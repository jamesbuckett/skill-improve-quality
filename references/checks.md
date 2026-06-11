# Quality checks by dimension

This is the canonical check list the four subagents work from. Each dimension has its own check categories, with an example of how a finding should read in the report.

Use this as a reference, not a checklist to mechanically tick through. The goal is to surface real quality issues a careful human reader would catch — not to satisfy every check.

---

## Dimension 1 — Factual correctness

The research dossier (Phase 3) is the ground truth. Findings here name a claim in the page, contrast it with what an authoritative source says, and propose a concrete reconciliation.

### Categories

**Version and date claims**
- Spec version numbers (e.g., "FAPI 2.0", "PCI-DSS 4.0.1", "OAuth 2.1")
- Effective dates and deadlines (e.g., DORA's January 2025 enforcement)
- Last-revision dates of regulations

**Clause and article IDs**
- Specific clause numbers, article numbers, requirement IDs
- Article 28 of DORA, Req 8.3.6 of PCI-DSS 4.0, Section 314.4 of GLBA — these get renumbered between revisions, verify every time
- Has the cited clause survived the latest revision? If renumbered, what's the new ID?

**Named entities**
- Standards bodies and working groups (W3C, IETF, FINOS, OpenID Foundation)
- Maintainers and committee chairs (these change; flag stale attributions)
- Product or company names with specific spelling/branding (e.g., "Cloudflare" not "CloudFlare")

**Quantitative claims**
- Statistics in the page body (qubit counts, breach numbers, market share)
- Thresholds in regulations (e.g., "≥ €1B revenue triggers DORA")
- Performance claims (latency, throughput, accuracy figures)

**Primary-source URLs**
- Every URL in "Further reading" actually resolves
- Each URL points to the primary source named, not a redirect to a marketing page
- No Wikipedia, no vendor blogs, no archived versions of pages that have a current canonical URL

### Example finding

```
[Factual / Critical] §Regulatory framing
Page says: "DORA Article 28 mandates incident reporting within 4 hours."
Source:    "DORA Article 17 covers ICT-related incident reporting (initial within 4 hours of classification as major)."
URL:       https://eur-lex.europa.eu/eli/reg/2022/2554/oj
Fix:       Change "Article 28" to "Article 17". Article 28 covers ICT third-party risk, not incident reporting.
```

---

## Dimension 2 — Clarity & comprehension

Targets the moments a reader has to stop, re-read, or guess. Each finding quotes the offending text.

### Categories

**Undefined acronyms on first use**
- First occurrence of an ALL-CAPS letter sequence (3+ letters) that isn't expanded inline or defined in the glossary
- Don't flag the universally known ones (URL, HTML, API, JSON, HTTP)
- Do flag domain-specific ones (PDP, PEP, CDE, SAD, PAN, HSM, mTLS, SPIFFE, JWT, SVID, FAPI)
- The glossary should expand on first occurrence — either via `<details>` inline or via a definition-list at the bottom

**Multi-word terms of art**
- Multi-word phrases the page leans on heavily (e.g., "tokenization", "trust domain", "sender-constrained token", "workload identity") that aren't defined in the glossary
- This is a specific failure mode `skill-build-educational-site` calls out — glossary is acronym-only and skips the load-bearing multi-word concepts

**Runaway sentences**
- Sentences > 30 words that would benefit from being split
- Sentences with > 2 nested clauses
- Compound sentences with 3+ independent ideas glued together

**Ambiguous pronouns**
- "This", "it", "which", "they" without a clear antecedent — especially at paragraph boundaries
- The classic LLM failure: "This is important because..." (this what?)

**Stacked nominalizations**
- "The implementation of the verification of the configuration..." — three abstract nouns in a row
- Usually rewrites to "verifying the configuration"

**Dense paragraphs**
- Paragraphs > 6 sentences without internal structure
- Walls of text where bullets or a sub-heading would help the reader navigate

### Example finding

```
[Clarity / Major] §Mechanics
Quote:    "PDP evaluates the request against the policy bundle and emits a decision."
Problem:  PDP not defined on first use; the term doesn't appear in the glossary.
Fix:      Either expand on first use ("Policy Decision Point (PDP)") or add a glossary entry. The glossary already defines PEP and CDE; PDP is conspicuously absent.
```

---

## Dimension 3 — Professional prose

The bar is "this could have been written by a careful human technical writer, not by an LLM with no editor."

See `ai-slop.md` for specific phrases. The categories here are the higher-level patterns.

### Categories

**Marketing voice in technical writing**
- "Cutting-edge", "game-changing", "revolutionary", "innovative", "robust", "seamless", "vibrant", "comprehensive"
- "In today's fast-paced world", "in the modern landscape", "as organisations navigate"
- Triplet padding: "clear, concise, and comprehensive" (pick the best one)

**Hedge phrases**
- "It's worth noting that…"
- "It's important to remember that…"
- "It bears mentioning…"
- "One could argue…"
- These soften load-bearing statements without adding information. Cut.

**Transition adverbs used as filler**
- "Moreover", "furthermore", "additionally", "consequently" used at the start of sentences that don't actually require that transition
- One per page is fine; one per paragraph is slop

**Voice and tense drift**
- The page switches between first-person ("we"), second-person ("you"), and third-person mid-section
- Tense drift: past/present/future inconsistency in the same section

**Random bolding**
- Bold sprinkled on words for emphasis with no rhetorical purpose
- Bold should mark either (a) terms being defined or (b) the single most important phrase in a paragraph — not every fourth word

**Padding adverbs and intensifiers**
- "Very", "really", "extremely", "quite", "fairly" — almost always cuttable
- "Critically important", "highly significant" — the noun usually carries the meaning alone

**Bullet mania**
- Every paragraph turned into bullets when prose would flow
- Bullets are for parallel items, not as a default render mode

### Example finding

```
[Prose / Major] §Conceptual overview
Quote:    "This is a robust, comprehensive, and seamless approach to leveraging modern tokenization patterns."
Problem:  Marketing voice — "robust", "comprehensive", "seamless", "leveraging" all in one sentence. Triplet adjective stack. Doesn't say what the approach is.
Fix:      "This approach uses tokenization to replace stored card numbers with non-sensitive surrogates."
```

---

## Dimension 4 — Structural quality

Pattern compliance against `skill-style-guide` (visual chassis) and `skill-build-educational-site` (content architecture). Findings here name the rule and the deviation.

The check list below is the union of both sibling skills' "Failure modes to avoid" sections. Read those files for the canonical phrasing if installed.

> **Rendered-DOM pass.** Several checks here (single accent colour, no emoji, audience switcher actually toggles content, dark-mode toggle actually flips theme, no JS console errors) are stronger when run against the rendered page rather than the HTML source. The Dimension 4 subagent uses Playwright MCP to drive a real browser; see `browser-structural-checks.md` for the audit-script library and subagent prompt. Source-level checks (spacing tokens, TL;DR ordering, glossary contents, comparison-table consolidation, primary sources) still run from the file.

### Categories

**Visual chassis (skill-style-guide)**
- **Single accent color** — Count distinct accent uses. The page should have exactly one brand accent. State colors (success/warn/danger) are separate and only appear when content conveys actual state.
- **Spacing tokens** — Spot-check CSS for ad-hoc values like `padding: 17px`, `margin-top: 30px`. Should use `--space-1` through `--space-9`.
- **No emoji** — Search the rendered output for any Unicode emoji codepoints. Replace with Lucide SVG.
- **Personal branding row** — Check the header includes the three links (GitHub, Twitter/X, LinkedIn) with Lucide icons.
- **Hex codes outside `:root`** — Hard-coded hex values in component CSS instead of variables break dark mode silently.
- **Dark-mode toggle present and working** — A theme toggle exists in the header; clicking it flips `data-theme` on `<html>`.
- **Marketing-page bloat on long-form pages** — A three-card feature grid or testimonial section on a page whose job is dense technical explanation.

**Content architecture (skill-build-educational-site)**
- **TL;DR section leads** — The first content section is a TL;DR, not six paragraphs of intro. Failure mode: content padding.
- **Audience switcher present AND wired** — If the page has practitioner-depth content, the switcher exists and toggles it. If the page has no practitioner-depth content, the switcher should NOT be shipped — a control that does nothing is the failure mode.
- **Glossary covers acronyms AND multi-word terms** — Page uses "tokenization" or "trust domain" or "sender-constrained token" heavily? Each should be defined. Acronym-only glossaries are the named failure mode.
- **Comparisons in a single table** — If the page compares two named variants (FAPI 1 vs FAPI 2, old PCI scope vs new), the comparison lives in a single side-by-side table, not split across prose sections.
- **Regulatory callouts have regime + clause + citation** — Each callout names the regime, the specific clause(s), and links to a primary source.
- **Primary sources only in Further reading** — No Wikipedia, no vendor marketing, no blog posts. Standards bodies and regulators.
- **Diagram earns its place** — Each diagram answers a specific question the prose can't. No diagram-as-decoration.
- **Section ordering** — Header → TL;DR → Conceptual overview → Diagram → Mechanics → Comparison → Regulatory callouts → Glossary → Further reading. Major deviations get flagged.

### Example findings

```
[Structural / Critical] §Header
Problem:  Audience switcher present but no `.practitioner-only` divs in the document. The switcher toggles nothing.
Fix:      Either remove the switcher OR wrap the protocol-detail blocks (lines ~210–280) in <div class="practitioner-only"> so the switcher has something to toggle.

[Structural / Major] §Glossary
Problem:  Glossary defines PDP, PEP, CDE, SAD, PAN, HSM, mTLS. Page also uses "tokenization", "sender-constrained token", and "trust domain" heavily — none are defined.
Fix:      Add definition-list entries for each. "Tokenization" and "trust domain" each appear 6+ times; readers unfamiliar will stumble.

[Structural / Critical] §Comparison
Problem:  FAPI 1 vs FAPI 2 comparison is split — FAPI 1 details in §"Background", FAPI 2 details in §"What changed". Reader has to scroll between them.
Fix:      Consolidate into a single <table> in §"What changed" with FAPI 1 and FAPI 2 as adjacent columns and the comparison rows in between.
```

---

## What NOT to flag

A few things this skill should leave alone:

- **Em-dashes** — The user uses them deliberately, and they're not banned by either sibling skill. Don't flag them as slop unless they're the only punctuation pattern in a section (which is a real tic).
- **British vs American spelling** — Doesn't matter unless the page mixes them.
- **Single instances of mildly weak adverbs** — One "very" in five thousand words is not a finding. Patterns are findings; individual word choices usually aren't.
- **The accent color choice itself** — Whether the page uses blue, emerald, or warm orange isn't this skill's call. Two accents is. One accent is fine regardless of which one.
- **Diagram type choices** — Mermaid vs inline SVG is the author's call per page. Don't flag the choice unless the page needs a diagram and doesn't have one.
- **Spelling and grammar of the user's name in personal branding** — Always "James Buckett", linked to the canonical handles. Don't "improve" this.
