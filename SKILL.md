---
name: skill-improve-quality
description: >-
  Audit and improve the quality of a single-file HTML explainer page (typically `index.html`) in the current repo. Checks four dimensions — factual correctness against authoritative web sources, clarity and comprehension, professional prose (AI-slop detection), and structural quality against James's `skill-style-guide` + `skill-build-educational-site` pattern — then produces an inline summary and offers to apply approved edits. Use this skill whenever the user wants to QA, audit, fact-check, polish, sharpen, review, critique, validate, tighten, or improve the quality of an explainer page, primer, one-pager, landing page, deep-dive, or single-file HTML — even when they don't use the exact phrase "improve quality". Triggers include "check this page", "is this accurate", "review the prose", "polish this", "audit this index.html", "fact-check this", "is the content correct", "is this clear enough", "sharpen this writing", "tighten this page", "QA the page", "is this professional", "/skill-improve-quality", or any request that boils down to "make this page better without changing its purpose". Uses the Exa MCP server for web search and the Firecrawl plugin for extracting web resources (with WebSearch/WebFetch as fallback) to ground findings in authoritative primary sources, not blog posts or vendor marketing.
---

# skill-improve-quality

## What this skill does

Takes a finished `index.html` page in the current repo and improves its quality across four dimensions:

1. **Factual correctness** — every load-bearing claim (regulatory clause, version number, date, statistic, named entity) is verified against authoritative web sources.
2. **Clarity & comprehension** — undefined jargon, ambiguous pronouns, runaway sentences, dense paragraphs the reader can't parse on first pass.
3. **Professional prose** — AI-slop tells, marketing voice, tense and voice inconsistency, hedge phrases, tic words.
4. **Structural quality** — adherence to the `skill-style-guide` (visual chassis) and `skill-build-educational-site` (content architecture) patterns; failure modes those skills are explicitly trying to prevent.

The output is a single inline report grouped by severity, then an interactive pass where you approve or reject each fix. Approved fixes are applied via `Edit` to `index.html`. Nothing is changed without consent.

## When to use this skill

This skill exists because the user produces educational pages with two sibling skills (`skill-style-guide` and `skill-build-educational-site`) and wants a deliberate QA pass afterwards — separate from authoring, with its own discipline. Don't fold the checks into authoring; the page is too close to the author at that point. Treat this skill as a fresh pair of eyes.

Use it when:
- The user just finished a page and wants to ship it.
- The user inherited an `index.html` and wants to know what's wrong with it.
- The user wants to verify regulatory or version-number claims after time has passed.
- The user asks any variant of "is this any good".

Skip when:
- There's no HTML file to audit (this is not a generic prose-improvement skill).
- The user wants you to write new content, not check existing content (use `skill-build-educational-site` instead).
- The user wants visual-only feedback (use `skill-style-guide`'s screenshot loop).

## Composition with sibling skills

The two sibling skills define the pattern; this skill checks compliance with it.

- `skill-style-guide` (~/.claude/skills/skill-style-guide/SKILL.md) — visual chassis, palette, spacing, components, screenshot harness, accent-color discipline.
- `skill-build-educational-site` (~/.claude/skills/skill-build-educational-site/SKILL.md) — section sequence, audience switcher, glossary discipline, comparison-table-as-single-table rule, regulatory callout shape.

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

**Step 0 — Check the cache.** Phase 2 is the most expensive phase. Before searching, check whether a recent dossier already exists for this topic:

```bash
~/.claude/skills/skill-improve-quality/scripts/dossier-cache.sh get <abs-path-to-index.html>
```

The script keys by the page's `<title>` + `<h1>`, hashes the pair to 16 hex chars, and stores entries at `~/.cache/improve-quality/dossiers/<hash>.json`. Entries younger than 14 days return the JSON; older or missing entries return `CACHE_MISS`.

- **Cache hit:** save the returned JSON to `/tmp/improve-quality-dossier.json` (Phase 3 subagent 1 reads it from there), populate the dossier slots below from it, and skip directly to Phase 3.
- **Cache miss:** continue with step 1.

Override the TTL with `IMPROVE_QUALITY_TTL_DAYS`; override the cache location with `IMPROVE_QUALITY_CACHE_DIR`.

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

3. **Store — cache the dossier.** Serialise the dossier slots above to JSON in this shape, write it to a tempfile, and store it in the cache so the next run on this topic is fast:

```bash
cat > /tmp/improve-quality-dossier.json <<'EOF'
{
  "topic": "<short topic name, e.g. 'FAPI 2.0'>",
  "audience": "<exec | practitioner | learner>",
  "current_version": {"name": "...", "effective_date": "YYYY-MM-DD", "url": "..."},
  "clauses": [{"id": "...", "covers": "...", "url": "..."}],
  "governing_bodies": [{"name": "...", "role": "...", "url": "..."}],
  "quantitative_claims": [{"claim": "...", "value": "...", "url": "..."}],
  "comparison_points": [{"vs": "...", "points": ["..."]}],
  "primary_source_urls": ["..."]
}
EOF

~/.claude/skills/skill-improve-quality/scripts/dossier-cache.sh put <abs-path-to-index.html> /tmp/improve-quality-dossier.json
```

Keep `/tmp/improve-quality-dossier.json` available — Phase 3's factual subagent reads it as context instead of receiving a long inline dossier in its prompt.

### Phase 3 — Analyze the four dimensions

**Step 0 — Deterministic pre-passes.** Before spawning subagents, run the cheap deterministic checks. They produce structured findings the subagents can build on instead of rediscover.

- **Vale (prose pre-pass).** If `vale` is on `PATH`, run it against the HTML using the bundled config:

  ```bash
  vale --config=~/.claude/skills/skill-improve-quality/references/vale/.vale.ini \
       --output=JSON \
       <abs-path-to-index.html> > /tmp/improve-quality-vale.json
  ```

  The config in `references/vale/` ships rules for tic words, marketing voice, hedge phrases, transition-adverb overuse, triplet padding, marketing prologues, and the "not only X but also Y" pattern. Each rule links back to the canonical `ai-slop.md` entry so the subagent can cite the rationale.

  If `vale` is not installed (`command -v vale` returns nothing), skip — the prose subagent will run unaided. The skill never blocks on optional tooling; it degrades to the LLM-only path.

**Step 1 — Parallel analysis.** Spawn four subagents in parallel using the `Agent` tool. Different dimensions need different agent types:

- Dimension 1 (factual): `subagent_type=general-purpose` — may need follow-up web searches and reads `/tmp/improve-quality-dossier.json`.
- Dimension 2 (clarity): `subagent_type=Explore` — read-only over the HTML.
- Dimension 3 (prose): `subagent_type=Explore` — read-only, but pass `/tmp/improve-quality-vale.json` (if present) as input so it builds on Vale's findings instead of rediscovering tic words.
- Dimension 4 (structural): `subagent_type=general-purpose` — needs the Playwright MCP browser tools for rendered-DOM checks. See `references/browser-structural-checks.md` for the full subagent prompt and the JS audit scripts.

Each subagent reads the file plus its assigned context (dossier, Vale output, browser tools, or none), and returns its findings in a structured list.

Pattern for each subagent prompt:

> Read `<absolute-path-to-index.html>`. Your job is to identify findings in dimension `<X>`. Return a list of findings, each with: severity (critical/major/minor), location (section heading + a short quote of the offending text), problem (one sentence), suggested fix (concrete replacement text or specific change), rationale (why this is a problem — reference the pattern, the source, or the comprehension issue), and source (URL if web-verifiable). Be specific. Don't return findings you can't quote.

Pass `/tmp/improve-quality-dossier.json` to subagent 1 (factual). If Vale ran, pass `/tmp/improve-quality-vale.json` to subagent 3 (prose). Subagents 2 and 4 read the HTML directly; subagent 4 additionally drives the Playwright MCP browser.

The four prompts vary by dimension. See `references/checks.md` for the dimension-specific check list. The high-level shape:

1. **Factual correctness** — Compare every numeric, regulatory, named-entity, or quantitative claim in the page against the dossier from Phase 2. Findings name what the page says, what the dossier says, and how to reconcile.
2. **Clarity & comprehension** — Undefined acronyms on first use; sentences > 30 words; pronouns without clear antecedents; stacked nominalizations; paragraphs that need to be split; jargon the glossary doesn't define.
3. **Professional prose** — AI-slop tells (see `references/ai-slop.md`); marketing voice ("leverage", "robust", "seamless", "cutting-edge"); tense/voice inconsistency; hedge phrases ("it's worth noting"); excessive transition adverbs ("moreover", "furthermore"); random bolding; triplet padding ("clear, concise, and comprehensive").
4. **Structural quality** — Pattern compliance against `skill-style-guide` + `skill-build-educational-site`. This dimension runs two passes: source-level checks (CSS, HTML structure) and rendered-DOM checks via Playwright MCP (computed styles, switcher actually toggles, dark-mode actually flips). See `references/browser-structural-checks.md` for the rendered-pass prompt and JS audit scripts. The combined check list:
   - Single accent colour — computed-style sample beats CSS grep, since accents set via JS or far from `:root` slip past source inspection (rendered DOM)
   - Spacing uses `--space-*` tokens, not ad-hoc px values (source)
   - No emoji anywhere — scan `document.body.innerText` for Unicode emoji codepoints (rendered DOM)
   - Personal branding row present (source)
   - TL;DR section leads, not buried (source)
   - Audience switcher present AND actually toggles visible content when clicked (rendered DOM)
   - Dark-mode toggle actually flips `data-theme` AND changes the computed `background-color` (rendered DOM)
   - No JS console errors when the page loads (rendered DOM)
   - Glossary covers acronyms AND multi-word terms of art (source)
   - Comparisons live in a single side-by-side table, not split across sections (source)
   - Regulatory callouts have regime + clause + citation (source)
   - Primary-source URLs in "Further reading" — no Wikipedia, no vendor blogs (source)
   - No marketing patterns: CTAs, hero animations, testimonial sections (source)

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

If any structural fix changes visual layout (e.g., adding a missing glossary section, restructuring a comparison into a single table), tell the user the page should be re-screenshot via `skill-style-guide`'s harness. Don't re-screenshot automatically — that's a separate verification step the user runs.

## Tips and guardrails

- **The dossier is the contract.** Every factual finding traces to the dossier built in Phase 2. If you can't cite a source, don't claim a factual error — downgrade to "ambiguous" and ask the user.
- **Quote, don't paraphrase, the offending text.** Findings without exact quotes are hard to act on. If you can't quote it, you don't have a finding.
- **Don't invent failure modes.** The check list lives in `references/checks.md` and the sibling skills. Don't add new checks for hypothetical issues just because they sound clever.
- **Lean on the user's judgement on minor findings.** Style is partly personal. Tic words used once aren't a fire; tic words on every page are. Flag, don't enforce.
- **Don't refactor.** The skill's job is improving content quality, not restructuring the page. If a section needs a wholesale rewrite, say so as a finding and let the user decide whether to invoke `skill-build-educational-site` instead.
- **Web research is the differentiator.** Skipping Phase 2 reduces this skill to a stylistic linter. The deep topic expansion is the reason this skill exists — don't shortcut it.

## Failure modes to avoid

- **Drive-by stylistic preferences** — "I prefer shorter sentences" is not a finding. The page either has a clarity problem (a sentence that takes two reads to parse) or it doesn't. Don't flag your own taste.
- **Fact-check theater** — Searching for sources and not actually comparing what they say. Every factual finding must include a side-by-side: what the page says vs. what the source says.
- **AI-slop over-detection** — Em-dashes are not always slop; the user's other skills use them deliberately. Flag patterns, not single instances. Three "leverages" in one section is a finding; one "leverage" in five thousand words is not.
- **Structural nit-picking** — If `skill-build-educational-site` says "no marketing CTAs" and the page has no CTAs, that's not a finding. Findings name actual deviations, not hypothetical compliance.
- **Reporting without applying** — The user chose "report + propose edits". Stopping after Phase 4 leaves the work undone. Always run Phase 5 unless the user opts out.
- **Applying without quoting** — Edits without exact-text matches break files. If `Edit` fails because `old_string` isn't unique, fix the quote — don't `replace_all` blindly.

## Bundled resources

- `references/checks.md` — Full dimension-by-dimension check list with examples of each pattern and example finding text.
- `references/ai-slop.md` — Specific tic words, phrase patterns, and structural slop signals — with corpus-grounded examples and recommended replacements.
- `evals/evals.json` — Test prompts used during skill development. Not loaded at runtime.
