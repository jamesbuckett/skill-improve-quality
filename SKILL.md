---
name: improve-quality
description: >-
  Audit and improve the quality of a single-file HTML explainer page (typically `index.html`) in the current repo. Checks four dimensions — factual correctness against authoritative web sources, clarity and comprehension, professional prose (AI-slop detection), and structural quality against James's `style-guide` + `build-educational-site` pattern — then produces an inline summary and offers to apply approved edits. Use this skill whenever the user wants to QA, audit, fact-check, polish, sharpen, review, critique, validate, tighten, or improve the quality of an explainer page, primer, one-pager, landing page, deep-dive, or single-file HTML — even when they don't use the exact phrase "improve quality". Triggers include "check this page", "is this accurate", "review the prose", "polish this", "audit this index.html", "fact-check this", "is the content correct", "is this clear enough", "sharpen this writing", "tighten this page", "QA the page", "is this professional", "/improve-quality", or any request that boils down to "make this page better without changing its purpose". Uses the Exa MCP server for web search and the Firecrawl plugin for extracting web resources (with WebSearch/WebFetch as fallback) to ground findings in authoritative primary sources, not blog posts or vendor marketing.
---

# improve-quality

## What this skill does

Takes a finished `index.html` page in the current repo and improves its quality across four dimensions:

1. **Factual correctness** — every load-bearing claim (regulatory clause, version number, date, statistic, named entity) is verified against authoritative web sources.
2. **Clarity & comprehension** — undefined jargon, ambiguous pronouns, runaway sentences, dense paragraphs the reader can't parse on first pass.
3. **Professional prose** — AI-slop tells, marketing voice, tense and voice inconsistency, hedge phrases, tic words.
4. **Structural quality** — adherence to the `style-guide` (visual chassis) and `build-educational-site` (content architecture) patterns; failure modes those skills are explicitly trying to prevent.

The output is a single inline report grouped by severity, then an interactive pass where you approve or reject each fix. Approved fixes are applied via `Edit` to `index.html`. Nothing is changed without consent.

## When to use this skill

This skill exists because the user produces educational pages with two sibling skills (`style-guide` and `build-educational-site`) and wants a deliberate QA pass afterwards — separate from authoring, with its own discipline. Don't fold the checks into authoring; the page is too close to the author at that point. Treat this skill as a fresh pair of eyes.

Use it when:
- The user just finished a page and wants to ship it.
- The user inherited an `index.html` and wants to know what's wrong with it.
- The user wants to verify regulatory or version-number claims after time has passed.
- The user asks any variant of "is this any good".

Skip when:
- There's no HTML file to audit (this is not a generic prose-improvement skill).
- The user wants you to write new content, not check existing content (use `build-educational-site` instead).
- The user wants visual-only feedback (use `style-guide`'s screenshot loop).

## Composition with sibling skills

The two sibling skills define the pattern; this skill checks compliance with it.

- `style-guide` (~/.claude/skills/style-guide/SKILL.md) — visual chassis, palette, spacing, components, screenshot harness, accent-color discipline.
- `build-educational-site` (~/.claude/skills/build-educational-site/SKILL.md) — section sequence, audience switcher, glossary discipline, comparison-table-as-single-table rule, regulatory callout shape.

If those skills are installed (the user has both), read their "Failure modes to avoid" sections to ground the structural checks in the canonical list. Both files are short and explicit. If they're not installed, the checks in `references/checks.md` are self-contained.

## Workflow

Follow these phases in order. Each phase has a clear exit condition.

### Phase 1 — Discover

1. Find the HTML file. Default to `./index.html` in the current working directory. If absent, glob for `*.html` in the repo root. If multiple matches, ask the user which one. If zero matches, stop and tell the user.
2. Read the file once, end to end. Note:
   - The topic (from `<title>`, `<h1>`, and the first `<p>` or TL;DR block)
   - The primary audience tilt (does the prose lean exec, practitioner, or learner?)
   - Whether the audience switcher is present and wired
   - Whether the glossary exists and what terms it covers
   - Whether regulatory callouts are present (regime + clause + citation)
   - Whether comparisons live in a single table or are split across sections
   - The accent color in use (one count, not two)
   - Any visible emoji
   - Any obvious AI-slop tells on a first read

Write a one-paragraph "topic frame" to your working notes: what is this page about, who is it for, what regulatory framing (if any) is in scope. You'll use this for Phase 2.

### Phase 2 — Research (deep topic expansion via Exa + Firecrawl)

The user has chosen deep topic expansion. The goal is to build a knowledge base of what a complete, current treatment of this topic should include — then compare the page against it.

Split the work across two tools by their strength:
- **Exa MCP Server** finds the right sources (neural search ranks authoritative pages well and surfaces primary specs over vendor blogs).
- **Firecrawl plugin for Claude Code** extracts clean markdown from those sources (handles JS-rendered specs, regulator portals, and complex page layouts other extractors miss).

Use them as a pipeline: Exa surfaces URLs → Firecrawl extracts markdown → dossier. Do not extract every Exa result; triage to the 3–5 most authoritative URLs first, then extract those.

1. **Search — Exa MCP Server.** Use Exa's `web_search_exa` tool to run 3–5 targeted queries:
   - The topic name + "specification" (find the primary spec)
   - The topic name + the regulator's name (find the authoritative regulatory page)
   - The topic name + "current version" or "latest" (find what's current as of today)
   - Any specific clause IDs or version numbers from the page (verify each)
   - The topic name + "comparison" or "vs" (find the typical points of contrast)

   Exa-specific tips: request `numResults: 5–10` per query; prefer `type: "neural"` for conceptual queries ("what is X spec"), `type: "keyword"` for exact-string queries (clause IDs, version numbers); set `livecrawl: "always"` when verifying current-as-of-today claims. If the topic is academic, also call `research_paper_search`; if it concerns named vendors, also call `company_research`.

2. **Extract — Firecrawl plugin.** Once Exa has surfaced 3–5 authoritative URLs, use **`firecrawl:firecrawl-scrape`** to pull full markdown from each. Extract the URLs Exa returned — don't swap in URLs you remembered from prior sessions. Memorized "authoritative hubs" go stale, get archived, or land on the wrong edition; treating Exa as the arbiter is the point of running the search step. Authoritative means: standards bodies, regulators, primary spec maintainers, official documentation. Not blog posts, not Wikipedia, not vendor marketing pages. If a source requires interaction (login wall, click-through, paginated docs), use **`firecrawl:firecrawl-instruct`** instead. If you need to traverse an entire docs section, use **`firecrawl:firecrawl-crawl`** with a tight path filter.

**Fallback (neither tool installed).** Use `WebSearch` to find sources and `WebFetch` to extract markdown. Run the same 3–5 query templates. The quality bar does not move: only primary sources land in the dossier regardless of which tool you used to find them.

**Build a research dossier in working memory** with these slots:
- Current version of the spec / regulation (with effective date)
- Authoritative clause IDs and what each covers
- Named working groups, maintainers, or governing bodies (current as of today)
- Quantitative claims load-bearing to the topic (qubit counts, regulatory thresholds, deadlines)
- The 2–4 points of comparison the page would need to cover for a complete treatment
- Primary-source URLs that should appear in "Further reading"

The dossier is the ground truth Phase 3's factual checks compare against.

### Phase 3 — Analyze the four dimensions

This phase benefits from parallelism — the four dimensions are independent and each takes time. **Spawn four subagents in parallel** (one per dimension) using the `Agent` tool with `subagent_type=Explore` for the read-heavy dimensions and `subagent_type=general-purpose` for the research-comparison dimension. Each subagent reads the file plus your dossier (pass the dossier as context in the prompt), returns its findings in a structured list.

Pattern for each subagent prompt:

> Read `<absolute-path-to-index.html>`. Your job is to identify findings in dimension `<X>`. Return a list of findings, each with: severity (critical/major/minor), location (section heading + a short quote of the offending text), problem (one sentence), suggested fix (concrete replacement text or specific change), rationale (why this is a problem — reference the pattern, the source, or the comprehension issue), and source (URL if web-verifiable). Be specific. Don't return findings you can't quote.

Pass the relevant slice of the dossier to subagent 1 (factual). Subagents 2–4 don't need the dossier.

The four prompts vary by dimension. See `references/checks.md` for the dimension-specific check list. The high-level shape:

1. **Factual correctness** — Compare every numeric, regulatory, named-entity, or quantitative claim in the page against the dossier from Phase 2. Findings name what the page says, what the dossier says, and how to reconcile.
2. **Clarity & comprehension** — Undefined acronyms on first use; sentences > 30 words; pronouns without clear antecedents; stacked nominalizations; paragraphs that need to be split; jargon the glossary doesn't define.
3. **Professional prose** — AI-slop tells (see `references/ai-slop.md`); marketing voice ("leverage", "robust", "seamless", "cutting-edge"); tense/voice inconsistency; hedge phrases ("it's worth noting"); excessive transition adverbs ("moreover", "furthermore"); random bolding; triplet padding ("clear, concise, and comprehensive").
4. **Structural quality** — Pattern compliance against `style-guide` + `build-educational-site`:
   - Single accent color (no second brand accent introduced)
   - Spacing uses `--space-*` tokens, not ad-hoc px values
   - No emoji anywhere
   - Personal branding row present
   - TL;DR section leads, not buried
   - Audience switcher present AND has practitioner-only content to switch to
   - Glossary covers acronyms AND multi-word terms of art (not acronym-only)
   - Comparisons live in a single side-by-side table, not split across sections
   - Regulatory callouts have regime + clause + citation
   - Primary-source URLs in "Further reading" (no Wikipedia, no vendor blogs)
   - No marketing patterns (CTAs, hero animations, testimonial sections)

Collect all four returns into one unified findings list.

### Phase 4 — Report inline

Print the report directly in the chat. Group by severity, then by dimension. Format each finding so the user can scan and decide quickly:

```
## Quality report

Topic: <one-line>
Audience: <one-line>
Findings: <total count> (<critical>, <major>, <minor>)

---

### CRITICAL — must fix before shipping (<count>)

1. [Factual] §<section-heading>
   Page says: "<quoted text>"
   Reality:   "<what the source says>"
   Source:    <URL>
   Fix:       "<concrete replacement text>"

2. [Structural] §<section-heading>
   Problem:   <one sentence>
   Fix:       <concrete change>

### MAJOR — should fix (<count>)

...

### MINOR — consider (<count>)

...
```

Severity rules:
- **Critical** — Factual errors, broken citations, missing regulatory callouts when the topic warrants them, two-accent violations, emoji in output, AI-slop tells that scream "LLM wrote this" to a careful reader.
- **Major** — Undefined acronyms, runaway sentences, marketing voice in technical writing, comparison split across sections instead of in a single table, glossary missing multi-word terms.
- **Minor** — Tic words used once, slightly long sentences, single nominalization stack, low-stakes polish.

Order within each severity bucket: factual first (highest stakes), then structural, then clarity, then prose.

Do not save the report to a file unless the user explicitly asks — the user chose inline summary only.

### Phase 5 — Apply approved edits

Walk through findings interactively. Use `AskUserQuestion` with `multiSelect: true` to let the user approve a batch in one go. Two patterns work:

- **Batch by severity** — "Which CRITICAL findings should I apply?" with each finding as an option labelled by its index.
- **All-or-each** — "Apply all critical, review major and minor individually?" then walk through the rest.

Default to batch-by-severity for the first pass — it's the quickest path through a long report. For findings the user wants to discuss before applying, switch to one-at-a-time.

When applying:
- Use `Edit` with the exact quoted text as `old_string` and the suggested fix as `new_string`. If the quoted text isn't unique enough in the file, expand the quote until it is.
- Apply edits in a single batch where possible. Independent edits can be in parallel `Edit` calls in one message.
- After applying, re-run a quick read-only sanity check on the affected sections — make sure the edit landed where intended and didn't introduce a new issue.

If any structural fix changes visual layout (e.g., adding a missing glossary section, restructuring a comparison into a single table), tell the user the page should be re-screenshot via `style-guide`'s harness. Don't re-screenshot automatically — that's a separate verification step the user runs.

## Tips and guardrails

- **The dossier is the contract.** Every factual finding traces to the dossier built in Phase 2. If you can't cite a source, don't claim a factual error — downgrade to "ambiguous" and ask the user.
- **Quote, don't paraphrase, the offending text.** Findings without exact quotes are hard to act on. If you can't quote it, you don't have a finding.
- **Don't invent failure modes.** The check list lives in `references/checks.md` and the sibling skills. Don't add new checks for hypothetical issues just because they sound clever.
- **Lean on the user's judgement on minor findings.** Style is partly personal. Tic words used once aren't a fire; tic words on every page are. Flag, don't enforce.
- **Don't refactor.** The skill's job is improving content quality, not restructuring the page. If a section needs a wholesale rewrite, say so as a finding and let the user decide whether to invoke `build-educational-site` instead.
- **Web research is the differentiator.** Skipping Phase 2 reduces this skill to a stylistic linter. The deep topic expansion is the reason this skill exists — don't shortcut it.

## Failure modes to avoid

- **Drive-by stylistic preferences** — "I prefer shorter sentences" is not a finding. The page either has a clarity problem (a sentence that takes two reads to parse) or it doesn't. Don't flag your own taste.
- **Fact-check theater** — Searching for sources and not actually comparing what they say. Every factual finding must include a side-by-side: what the page says vs. what the source says.
- **AI-slop over-detection** — Em-dashes are not always slop; the user's other skills use them deliberately. Flag patterns, not single instances. Three "leverages" in one section is a finding; one "leverage" in five thousand words is not.
- **Structural nit-picking** — If `build-educational-site` says "no marketing CTAs" and the page has no CTAs, that's not a finding. Findings name actual deviations, not hypothetical compliance.
- **Reporting without applying** — The user chose "report + propose edits". Stopping after Phase 4 leaves the work undone. Always run Phase 5 unless the user opts out.
- **Applying without quoting** — Edits without exact-text matches break files. If `Edit` fails because `old_string` isn't unique, fix the quote — don't `replace_all` blindly.

## Bundled resources

- `references/checks.md` — Full dimension-by-dimension check list with examples of each pattern and example finding text.
- `references/ai-slop.md` — Specific tic words, phrase patterns, and structural slop signals — with corpus-grounded examples and recommended replacements.
- `evals/evals.json` — Test prompts used during skill development. Not loaded at runtime.
