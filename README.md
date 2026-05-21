# skill-improve-quality

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jamesbuckett/skill-improve-quality?style=social)](https://github.com/jamesbuckett/skill-improve-quality/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/jamesbuckett/skill-improve-quality)](https://github.com/jamesbuckett/skill-improve-quality/commits)
[![Open issues](https://img.shields.io/github/issues/jamesbuckett/skill-improve-quality)](https://github.com/jamesbuckett/skill-improve-quality/issues)

> Audit and improve the quality of a single-file HTML explainer page in the current repo.

## About

A Claude Code skill that audits a single-file HTML explainer page (typically `index.html`) across four dimensions:

1. **Factual correctness** — every load-bearing claim (regulatory clause, version number, statistic, named entity) is verified against authoritative web sources.
2. **Clarity & comprehension** — undefined jargon, ambiguous pronouns, runaway sentences, paragraphs the reader can't parse on first pass.
3. **Professional prose** — AI-slop tells, marketing voice, tense and voice drift, hedge phrases, tic words.
4. **Structural quality** — adherence to the visual chassis (`skill-style-guide`) and content architecture (`skill-build-educational-site`) patterns.

The skill produces an inline, severity-ranked report, then walks through findings interactively. Approved fixes land in `index.html` via `Edit`; nothing else is touched. It runs as a fresh-eyes QA pass after authoring is done, not as a linter that fires during writing.

## Prerequisites

| Requirement | Why |
|---|---|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | The skill runs as a Claude Code personal skill. |
| `git` on `PATH` | For cloning the skill repo. |
| A target repo containing an `index.html` to audit | The skill operates on the current working directory. |

## Installation

### 1. Install the skill

Pick one of the two install paths below. The directory name under `~/.claude/skills/` must match the `name:` field in `SKILL.md` (`skill-improve-quality`) either way.

#### Option A — Clone directly (simplest)

Use this if you just want the skill installed and don't plan to edit it.

```bash
git clone https://github.com/jamesbuckett/skill-improve-quality.git \
  ~/.claude/skills/skill-improve-quality
```

To update later, `cd ~/.claude/skills/skill-improve-quality && git pull`.

#### Option B — Clone to a workspace and symlink (recommended for maintainers)

Use this if you want to edit the skill files in your normal development workspace and have Claude Code pick up changes immediately. Keeps a single source of truth at `~/projects/` (or wherever you keep code) and avoids two diverging copies.

```bash
# 1. Clone to your workspace
git clone https://github.com/jamesbuckett/skill-improve-quality.git \
  ~/projects/skill-improve-quality

# 2. Symlink it into Claude Code's skills directory
ln -s ~/projects/skill-improve-quality ~/.claude/skills/skill-improve-quality
```

If `~/.claude/skills/skill-improve-quality` already exists as a real directory (e.g., from a previous install), remove or rename it first — `ln -s` will not overwrite a directory.

```bash
rm -rf ~/.claude/skills/skill-improve-quality   # only if you're sure
ln -s  ~/projects/skill-improve-quality ~/.claude/skills/skill-improve-quality
```

Verify the link:

```bash
ls -la ~/.claude/skills/skill-improve-quality
# Should show: skill-improve-quality -> /home/<you>/projects/skill-improve-quality
```

To update later, pull in the workspace clone — the symlink reflects the change immediately:

```bash
cd ~/projects/skill-improve-quality && git pull
```

### 2. Verify the skill is loaded

Start Claude Code in any project, then ask:

```text
What skills are available?
```

`skill-improve-quality` should appear in the list. If it doesn't:

- Confirm `~/.claude/skills/skill-improve-quality/SKILL.md` exists.
- Confirm the frontmatter `name:` field reads `skill-improve-quality`.
- Restart Claude Code.

### 3. (Recommended) Install the optional dependencies

The skill grades best when it can ground findings in primary sources. Two optional tools sharpen Phase 2 (research) considerably:

| Tool | What it adds | How to install |
|---|---|---|
| Exa MCP server | Neural search that ranks primary specs and regulator pages over vendor blogs. | Configure as a Claude Code MCP server. See the [Exa MCP server docs](https://github.com/exa-labs/exa-mcp-server) for the API-key and registration steps. |
| Firecrawl Claude Code plugin | Clean markdown extraction from JS-rendered specs, regulator portals, and authenticated docs. The skill uses `firecrawl-scrape`, `firecrawl-instruct`, and `firecrawl-crawl`. | Install via Claude Code's `/plugin` command (`/plugin marketplace add`, then `/plugin install`). |

If neither is installed, the skill falls back to Claude Code's built-in `WebSearch` and `WebFetch`. The quality bar stays the same — primary sources only — but the surface area Claude can reach is smaller, especially on JS-rendered regulator pages.

### 4. (Optional) Install the sibling skills

`skill-improve-quality` works on its own. Findings are sharper when the two sibling authoring skills are also installed, because the skill can read their canonical "failure modes" lists. Use the same Option A (direct clone) or Option B (symlink) pattern from step 1:

```bash
# Option A — direct clone
git clone https://github.com/jamesbuckett/skill-style-guide.git \
  ~/.claude/skills/skill-style-guide

git clone https://github.com/jamesbuckett/skill-build-educational-site.git \
  ~/.claude/skills/skill-build-educational-site
```

```bash
# Option B — workspace + symlink
git clone https://github.com/jamesbuckett/skill-style-guide.git ~/projects/skill-style-guide
git clone https://github.com/jamesbuckett/skill-build-educational-site.git ~/projects/skill-build-educational-site
ln -s ~/projects/skill-style-guide            ~/.claude/skills/skill-style-guide
ln -s ~/projects/skill-build-educational-site ~/.claude/skills/skill-build-educational-site
```

## Usage

Inside any repo with an `index.html` you want to QA, ask Claude with any natural trigger phrase:

```text
audit this index.html
fact-check this page
sharpen this writing
is the content correct?
/skill-improve-quality
```

What the skill does:

1. Discovers the HTML file in the current working directory.
2. Builds a research dossier on the page's topic from authoritative sources.
3. Runs four parallel checks (factual, clarity, prose, structural).
4. Prints a report grouped by severity.
5. Walks through findings interactively. You approve fixes in batches; approved fixes are applied via `Edit`.

### Example report

```text
## Quality report

Topic:    FAPI 2.0 explainer
Audience: practitioner-leaning
Findings: 7 (2 critical, 3 major, 2 minor)

---

### CRITICAL — must fix before shipping (2)

1. [Factual] §Regulatory framing
   Page says: "DORA Article 28 mandates incident reporting within 4 hours."
   Reality:   "DORA Article 17 covers ICT-related incident reporting."
   Source:    https://eur-lex.europa.eu/eli/reg/2022/2554/oj
   Fix:       Change "Article 28" to "Article 17". Article 28 covers
              third-party risk, not incident reporting.

2. [Structural] §Header
   Problem:   Audience switcher present but no `.practitioner-only`
              divs in the document. The switcher toggles nothing.
   Fix:       Either remove the switcher OR wrap the protocol-detail
              blocks in <div class="practitioner-only">.
```

## Sibling skills

The skill cross-references two sibling skills that define the patterns being checked:

- [`skill-style-guide`](https://github.com/jamesbuckett/skill-style-guide) — visual chassis, palette, spacing tokens, screenshot harness.
- [`skill-build-educational-site`](https://github.com/jamesbuckett/skill-build-educational-site) — section sequence, audience switcher, glossary discipline, comparison-table-as-single-table rule.

`skill-improve-quality` is the audit pass; the siblings are the author passes.

## Project structure

```text
.
├── SKILL.md             # Skill frontmatter, four-phase workflow, guardrails
├── references/
│   ├── checks.md        # Per-dimension check list with example findings
│   └── ai-slop.md       # Tic words, hedge phrases, structural slop patterns
└── evals/
    └── evals.json       # Test prompts used during skill development
```

`SKILL.md` is loaded on every invocation. The files in `references/` are loaded on demand during Phase 3.

## Troubleshooting

**Claude doesn't recognise the skill.**
Check that `~/.claude/skills/skill-improve-quality/SKILL.md` exists and that the frontmatter `name:` field reads `skill-improve-quality`. Restart Claude Code after install.

**"No HTML file found in the current directory."**
The skill globs `*.html` in the repo root. If your page is in a subdirectory, `cd` into it before invoking, or pass the path explicitly when the skill asks.

**Web research returns nothing useful.**
Confirm the topic name in your page's `<title>` and `<h1>` is searchable. Generic titles ("Welcome", "Overview") give the dossier nothing to anchor on. Renaming the page to something searchable usually unblocks Phase 2.

**The skill suggests fixes I disagree with.**
Reject them in the approval step. Style is partly personal; the skill flags patterns, you decide. If a finding feels wrong, it usually is.

## Contributing

Issues and pull requests welcome. Please open an issue first to discuss substantial changes.

## License

[MIT](LICENSE) © 2026 James Buckett
