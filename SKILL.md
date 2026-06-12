---
name: skill-improve-quality
description: >-
  Audit and improve the quality of a single-file HTML explainer page (typically `index.html`) in the current repo without changing its purpose. Use whenever the user wants to QA, audit, fact-check, polish, sharpen, review, critique, validate, tighten, or improve an explainer, primer, one-pager, landing page, deep-dive, or single-file HTML — even when they don't use the exact phrase "improve quality". Triggers include "check this page", "is this accurate", "review the prose", "polish this", "audit this index.html", "fact-check this", "is the content correct", "is this clear enough", "sharpen this writing", "tighten this page", "QA the page", "is this professional", "is this any good", and "/skill-improve-quality". Skip when there is no HTML file to audit, when the user wants new content written rather than checked, or when they want visual-only feedback.
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

Follow these phases in order. Each phase has a clear exit condition. Phases 2 and 3 deliberately overlap: dimensions 2–4 run in the background while the web research for dimension 1 happens — only the factual subagent needs the dossier.

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

Write a one-paragraph "topic frame" to your working notes: what is this page about, who is it for, what regulatory framing (if any) is in scope. Also list the page's **load-bearing claims** — clause IDs, version numbers, dates, statistics. You'll use both for Phases 2 and 3.

### Phase 2 — Kick off: deterministic pre-passes, then background analysis

**Step 1 — Deterministic pre-passes.** Run the cheap deterministic checks first. They produce structured findings the subagents build on instead of rediscover, and they cannot hallucinate.

- **Vale (prose pre-pass).** If `vale` is on `PATH`, run it against the HTML using the bundled config:

  ```bash
  vale --config="$HOME/.claude/skills/skill-improve-quality/references/vale/.vale.ini" \
       --no-exit --output=JSON \
       <abs-path-to-index.html> > /tmp/improve-quality-vale.json
  ```

  Use `$HOME`, not `~` — the shell does not tilde-expand after `--config=`, and Vale treats the literal `~` path as missing. `--no-exit` matters too: without it Vale exits non-zero whenever it finds error-level issues, which looks like a failed command when the pre-pass actually worked. The config in `references/vale/` ships rules for tic words, marketing voice, hedge phrases, transition-adverb overuse, triplet padding, marketing prologues, and the "not only X but also Y" pattern. Each rule links back to the canonical `ai-slop.md` entry so the subagent can cite the rationale. If `vale` is not installed, skip — the prose subagent runs unaided. The skill never blocks on optional tooling.

- **Link reachability (citation pre-pass).** Run the bundled checker:

  ```bash
  ~/.claude/skills/skill-improve-quality/scripts/check-links.sh \
      <abs-path-to-index.html> /tmp/improve-quality-links.json
  ```

  It HEAD/GET-requests every external URL and reports status, final URL after redirects, and bot-wall notes. Reachability comes from this report — never from an LLM's guess. Policy judgements (no Wikipedia, primary sources only, redirect landed on a marketing page) stay with the factual subagent, which reads this JSON.

**Step 2 — Spawn dimensions 2–4 in the background.** None of these need the research dossier, so spawn them now with `run_in_background: true` on the `Agent` tool and collect their results in Phase 4:

- Dimension 2 (clarity): `subagent_type=Explore` — read-only over the HTML.
- Dimension 3 (prose): `subagent_type=Explore` — read-only; pass `/tmp/improve-quality-vale.json` (if present) as input so it builds on Vale's findings instead of rediscovering tic words.
- Dimension 4 (structural): `subagent_type=general-purpose` — needs the Playwright MCP browser tools for rendered-DOM checks. The audit scripts live in `scripts/audits/` (single source of truth, covered by the eval harness); `references/browser-structural-checks.md` has the subagent prompt, how to pass the scripts to `browser_evaluate`, and how to interpret each result. The source-level structural check list is in `references/checks.md` Dimension 4.

Pattern for each subagent prompt:

> Read `<absolute-path-to-index.html>`. Your job is to identify findings in dimension `<X>`. Return a list of findings, each with: severity (critical/major/minor), location (section heading + a short quote of the offending text), problem (one sentence), suggested fix (concrete replacement text or specific change), rationale (why this is a problem — reference the pattern, the source, or the comprehension issue), and source (URL if web-verifiable). Be specific. Don't return findings you can't quote.

The dimension-specific check lists live in `references/checks.md` — don't restate them in the prompts; tell each subagent to read its dimension's section.

### Phase 3 — Research (deep topic expansion), then the factual subagent

The goal is to build a knowledge base of what a complete, current treatment of this topic should include — then compare the page against it. The dossier is the ground truth the factual checks compare against.

**Step 0 — Check the cache.** Research is the most expensive step. Before searching:

```bash
~/.claude/skills/skill-improve-quality/scripts/dossier-cache.sh get <abs-path-to-index.html>
```

The script keys by the page's `<title>` + `<h1>`, hashes the pair to 16 hex chars, and stores entries at `~/.cache/improve-quality/dossiers/<hash>.json`. Entries younger than 14 days return the JSON; older or missing entries return `CACHE_MISS`. Override the TTL with `IMPROVE_QUALITY_TTL_DAYS`; override the location with `IMPROVE_QUALITY_CACHE_DIR`.

- **Cache hit:** save the returned JSON to `/tmp/improve-quality-dossier.json`, then run a **claims-coverage check before trusting it**: compare the load-bearing claims you listed in Phase 1 against the dossier's slots. Claims the dossier doesn't cover are exactly what was added or edited since the dossier was built — the cache key only sees the title, not the body. Run step 1's targeted queries for just the uncovered claims, merge the results into the dossier JSON, and re-`put` it. If everything is covered, skip directly to spawning the factual subagent.
- **Cache miss:** continue with step 1.

**Step 1 — Search.** Use the Exa MCP server's `web_search_exa` tool to run 3–5 targeted queries:
   - The topic name + "specification" (find the primary spec)
   - The topic name + the regulator's name (find the authoritative regulatory page)
   - The topic name + "current version" or "latest" (find what's current as of today)
   - Any specific clause IDs or version numbers from the page (verify each)
   - The topic name + "comparison" or "vs" (find the typical points of contrast)

   Exa-specific tips: request `numResults: 5–10` per query; prefer `type: "neural"` for conceptual queries ("what is X spec"), `type: "keyword"` for exact-string queries (clause IDs, version numbers); set `livecrawl: "always"` when verifying current-as-of-today claims. If the topic is academic, also call `research_paper_search`; if it concerns named vendors, also call `company_research`.

**Step 2 — Extract.** Once 3–5 authoritative URLs are surfaced, use **`firecrawl:firecrawl-scrape`** to pull full markdown from each. Extract the URLs the search returned — don't swap in URLs you remembered from prior sessions. Memorized "authoritative hubs" go stale, get archived, or land on the wrong edition; treating the search as the arbiter is the point of running it. Authoritative means: standards bodies, regulators, primary spec maintainers, official documentation. Not blog posts, not Wikipedia, not vendor marketing pages. If a source requires interaction (login wall, click-through, paginated docs), use **`firecrawl:firecrawl-interact`** instead. If you need to traverse an entire docs section, use **`firecrawl:firecrawl-crawl`** with a tight path filter.

**Fallback chain.** If the Exa MCP server isn't connected, run the same query templates through **`firecrawl:firecrawl-search`** (real search results with full page content). If Firecrawl isn't installed either, use `WebSearch` to find sources and `WebFetch` to extract. The quality bar does not move: only primary sources land in the dossier regardless of which tool found them.

**Build the research dossier** with these slots:
- Current version of the spec / regulation (with effective date)
- Authoritative clause IDs and what each covers
- Named working groups, maintainers, or governing bodies (current as of today)
- Quantitative claims load-bearing to the topic (qubit counts, regulatory thresholds, deadlines)
- The 2–4 points of comparison the page would need to cover for a complete treatment
- Primary-source URLs that should appear in "Further reading"

**Step 3 — Store.** Serialise the dossier to JSON in this shape, write it to `/tmp/improve-quality-dossier.json`, and cache it so the next run on this topic is fast:

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

**Step 4 — Spawn dimension 1 (factual).** `subagent_type=general-purpose` — may need follow-up web searches. It reads `/tmp/improve-quality-dossier.json` (ground truth) and `/tmp/improve-quality-links.json` (reachability evidence) instead of receiving them inline. Findings compare every numeric, regulatory, named-entity, or quantitative claim in the page against the dossier: what the page says, what the source says, how to reconcile.

### Phase 4 — Collect and merge

Collect the three background returns plus the factual return into one findings list, then **dedupe before reporting**:

- Findings that quote the same or overlapping text collapse into one finding. Keep the higher severity, tag both dimensions (e.g. `[Clarity+Prose]`), and merge the rationales.
- Common overlaps to expect: hedge phrases (clarity and prose both flag them), glossary gaps (clarity and structural), marketing prologue (prose and structural TL;DR check).
- Without this step the user gets asked twice about the same sentence in Phase 6.

### Phase 5 — Report inline

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

**Log the audit.** Append one line to the audit log so recurring patterns surface across runs:

```bash
mkdir -p ~/.cache/improve-quality
jq -nc --arg date "$(date +%F)" --arg topic "<topic>" --arg file "<abs-path>" \
   --argjson counts '{"critical": <n>, "major": <n>, "minor": <n>}' \
   --argjson prose_patterns '["<pattern name>", ...]' \
   '{date: $date, topic: $topic, file: $file, counts: $counts, prose_patterns: $prose_patterns}' \
   >> ~/.cache/improve-quality/audit-log.jsonl
```

Then check the log: if the same prose pattern (`prose_patterns` name) has appeared in 3 or more audits, tell the user and offer to promote it to a Vale rule in `references/vale/styles/AISlop/` — that moves the pattern from LLM detection to deterministic detection for every future run.

### Phase 6 — Apply approved edits

Walk through findings interactively. Use `AskUserQuestion` with `multiSelect: true` to let the user approve a batch in one go. Two patterns work:

- **Batch by severity** — "Which CRITICAL findings should I apply?" with each finding as an option labelled by its index. `AskUserQuestion` allows at most 4 options per question (and 4 questions per call), so chunk a longer bucket into consecutive questions — findings 1–4, then 5–8 — instead of one oversized list.
- **All-or-each** — "Apply all critical, review major and minor individually?" then walk through the rest. Prefer this when a bucket is large (more than ~8 findings); chunked multi-select gets tedious at that size.

Default to batch-by-severity for the first pass — it's the quickest path through a long report. For findings the user wants to discuss before applying, switch to one-at-a-time.

When applying **prose, clarity, and factual fixes**:
- Use `Edit` with the exact quoted text as `old_string` and the suggested fix as `new_string`. If the quoted text isn't unique enough in the file, expand the quote until it is.
- Apply edits in a single batch where possible. Independent edits can be in parallel `Edit` calls in one message.
- After applying, re-run a quick read-only sanity check on the affected sections — make sure the edit landed where intended and didn't introduce a new issue.

When applying **structural fixes** (which often have no quotable `old_string` — "the switcher toggles nothing" points at behaviour, not text):
- Describe the change, apply it, then **verify by re-running the specific audit script** from `scripts/audits/` that flagged it. Fixed the dark-mode background? Re-run `theme-snapshot.js` before and after the toggle click and confirm `bodyBg` now changes. Fixed the inert switcher? Re-run `visibility-snapshot.js` around a click. A structural fix without a re-run audit is unverified.
- If a structural fix changes visual layout (adding a missing glossary section, consolidating a comparison table), tell the user the page should be re-screenshot via `skill-style-guide`'s harness. Don't re-screenshot automatically — that's a separate verification step the user runs.

## Tips and guardrails

- **The dossier is the contract.** Every factual finding traces to the dossier built in Phase 3. If you can't cite a source, don't claim a factual error — downgrade to "ambiguous" and ask the user.
- **Quote, don't paraphrase, the offending text.** Findings without exact quotes are hard to act on. If you can't quote it, you don't have a finding.
- **Don't invent failure modes.** The check list lives in `references/checks.md` and the sibling skills. Don't add new checks for hypothetical issues just because they sound clever.
- **Lean on the user's judgement on minor findings.** Style is partly personal. Tic words used once aren't a fire; tic words on every page are. Flag, don't enforce.
- **Don't refactor.** The skill's job is improving content quality, not restructuring the page. If a section needs a wholesale rewrite, say so as a finding and let the user decide whether to invoke `skill-build-educational-site` instead.
- **Web research is the differentiator.** Skipping Phase 3 reduces this skill to a stylistic linter. The deep topic expansion is the reason this skill exists — don't shortcut it.

## Failure modes to avoid

- **Drive-by stylistic preferences** — "I prefer shorter sentences" is not a finding. The page either has a clarity problem (a sentence that takes two reads to parse) or it doesn't. Don't flag your own taste.
- **Fact-check theater** — Searching for sources and not actually comparing what they say. Every factual finding must include a side-by-side: what the page says vs. what the source says.
- **Stale-cache trust** — A dossier cache hit is not a license to skip verification: the cache key only sees `<title>` + `<h1>`, so claims edited into the body since the dossier was built are invisible to it. Always run the claims-coverage check on a hit.
- **AI-slop over-detection** — Em-dashes are not always slop; the user's other skills use them deliberately. Flag patterns, not single instances. Three "leverages" in one section is a finding; one "leverage" in five thousand words is not.
- **Structural nit-picking** — If `skill-build-educational-site` says "no marketing CTAs" and the page has no CTAs, that's not a finding. Findings name actual deviations, not hypothetical compliance.
- **Reporting without applying** — The user chose "report + propose edits". Stopping after Phase 5 leaves the work undone. Always run Phase 6 unless the user opts out.
- **Applying without quoting** — Edits without exact-text matches break files. If `Edit` fails because `old_string` isn't unique, fix the quote — don't `replace_all` blindly.
- **Skipping the rendered-DOM pass** — The pseudo-element emoji, the non-toggling switcher, and the inert dark-mode toggle are invisible to source-level checks. If Playwright isn't available, say so in the report; don't silently pretend the rendered checks ran.

## Bundled resources

- `references/checks.md` — Full dimension-by-dimension check list with examples of each pattern and example finding text.
- `references/ai-slop.md` — Specific tic words, phrase patterns, and structural slop signals — with corpus-grounded examples and recommended replacements.
- `references/browser-structural-checks.md` — Rendered-DOM pass: subagent prompt, how to drive the audit scripts, interpretation rules.
- `scripts/audits/` — The browser audit scripts (accent clustering, emoji incl. pseudo-elements, switcher and theme snapshots). Single source of truth, exercised by the eval harness.
- `scripts/check-links.sh` — Deterministic link-reachability report for every external URL.
- `scripts/dossier-cache.sh` — Get/put the Phase 3 research dossier, keyed by page topic, 14-day TTL.
- `evals/` — Test prompts (`evals.json`), a planted-issues fixture (`fixtures/index.html`), its answer key (`answer-key.json`), and the browser-audit harness (`run-browser-audits.mjs`). Not loaded at runtime; used when editing this skill.
