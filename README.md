# Improve Quality

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jamesbuckett/improve-quality?style=social)](https://github.com/jamesbuckett/improve-quality/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/jamesbuckett/improve-quality)](https://github.com/jamesbuckett/improve-quality/commits)
[![Open issues](https://img.shields.io/github/issues/jamesbuckett/improve-quality)](https://github.com/jamesbuckett/improve-quality/issues)

> Audit and improve the quality of a single-file HTML explainer page in the current repo

## About

Audits a single-file HTML explainer page (typically `index.html`) across four dimensions: factual correctness against authoritative web sources, clarity and comprehension, professional prose (AI-slop detection), and structural quality against the `style-guide` and `build-educational-site` patterns. Produces an inline, severity-ranked report and walks through findings interactively — approved fixes land in `index.html` via `Edit` and nothing else is touched. Designed as a fresh-eyes QA pass after authoring is finished, not a linter that runs during writing.

## Quick Start

```bash
git clone https://github.com/jamesbuckett/improve-quality.git ~/.claude/skills/improve-quality
# Then, inside any GitHub-backed repo, ask Claude to invoke the skill by its trigger phrase.
```

## Usage

Inside any repo with an `index.html` you want to QA, ask Claude to invoke the skill with any of the natural trigger phrases:

```text
audit this index.html
fact-check this page
sharpen this writing
/improve-quality
```

The skill discovers the HTML file, builds a research dossier from authoritative sources (via Firecrawl or WebSearch fallback), runs four parallel checks, and prints a report grouped by severity. You approve fixes in batches and the skill applies them.

## Project Structure

```text
.
├── SKILL.md          # Skill frontmatter and workflow
├── references/       # Check lists and AI-slop patterns loaded on demand
└── evals/            # Test prompts used during skill development
```

## Contributing

Issues and pull requests welcome. Please open an issue first to discuss substantial changes.

## License

[MIT](LICENSE) © 2026 James Buckett
