# Skill: Improve Quality

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/jamesbuckett/skill-improve-quality?style=social)](https://github.com/jamesbuckett/skill-improve-quality/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/jamesbuckett/skill-improve-quality)](https://github.com/jamesbuckett/skill-improve-quality/commits)
[![Open issues](https://img.shields.io/github/issues/jamesbuckett/skill-improve-quality)](https://github.com/jamesbuckett/skill-improve-quality/issues)

> Audit and improve the quality of a single-file HTML explainer page in the current repo.

## About

Audits a finished `index.html` across four dimensions: factual correctness against authoritative web sources, clarity and comprehension, professional prose (AI-slop detection), and structural quality against the `skill-style-guide` + `skill-build-educational-site` pattern. Produces a severity-ranked report, then walks through each finding interactively — approved fixes land in `index.html` via `Edit`, nothing else is touched. Built as a fresh-eyes QA pass after authoring is done, not a linter that fires during writing.

## Quick Start

```bash
# Direct install (recommended)
git clone https://github.com/jamesbuckett/skill-improve-quality.git ~/.claude/skills/skill-improve-quality

# Or: symlink from a working copy (for active development)
git clone https://github.com/jamesbuckett/skill-improve-quality.git ~/projects/skill-improve-quality
ln -s ~/projects/skill-improve-quality ~/.claude/skills/skill-improve-quality
```

Then, inside any GitHub-backed repo, ask Claude to invoke the skill by its trigger phrase.

## Usage

The skill triggers on natural-language requests inside a repo that contains an `index.html`. Examples:

```text
Audit this page for accuracy and prose.
Fact-check this index.html before I ship it.
QA the explainer — is it accurate, clear, and professional?
/skill-improve-quality
```

The skill returns a single inline report grouped by severity, then walks through findings one by one. Approved fixes are applied via `Edit`; nothing else is modified.

## Project Structure

```
.
├── SKILL.md         # Skill metadata and execution flow
├── evals/           # Evaluation cases
├── references/      # AI-slop checks, structural checks, Vale config
└── scripts/         # Dossier cache helper
```

## Contributing

Issues and pull requests welcome. Please open an issue first to discuss substantial changes.

## License

[MIT](LICENSE) © 2026 James Buckett
