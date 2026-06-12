# Running the evals

Three harnesses live here. None load at runtime — they're for editing and validating this skill.

## Browser-audit harness

Verifies the audit scripts in `scripts/audits/` against the planted-issues fixture (S1–S6, N4 in `answer-key.json`):

```bash
PLAYWRIGHT_PKG=<dir-with-playwright-in-node_modules> node evals/run-browser-audits.mjs
```

Needs the `playwright` npm package resolvable (any project that has it installed works) and a Chromium under `~/.cache/ms-playwright/` or `PLAYWRIGHT_CHROMIUM`.

## Fixture eval (detection quality)

Eval 4 in `evals.json` runs the full skill against `fixtures/index.html` and scores the report against `answer-key.json` (target: recall ≥ 0.80 on 25 planted issues, zero negative-control violations). Two isolation steps are mandatory — both are in the `evals.json` notes:

1. Strip the `PLANTED` comments from the fixture copy so the agent can't read the answers.
2. `export IMPROVE_QUALITY_CACHE_DIR=$(mktemp -d)` — the dossier cache keys on `<title>+<h1>`, so a dossier from any earlier run on this fixture already contains the corrections.

## Trigger evals (description optimization)

`trigger-evals.json` holds 10 should-trigger and 10 near-miss should-not-trigger queries in skill-creator `run_loop` format:

```bash
cd <skill-creator-plugin-dir>
env -u ANTHROPIC_API_KEY -u CLAUDECODE python3 -m scripts.run_loop \
  --eval-set <this-repo>/evals/trigger-evals.json \
  --skill-path <this-repo> \
  --model <session-model-id> \
  --max-iterations 5 --verbose
```

Hard-won setup requirements:

- **Strip auth env vars.** If the shell exports a stale or placeholder `ANTHROPIC_API_KEY`, every nested `claude -p` fails with "Invalid API key · Fix external API key" — printed on **stdout**, with empty stderr and exit 1. The harness ignores exit codes, so failed calls silently score as "didn't trigger".
- **Hide the installed skill for the run.** The harness tests a hash-renamed copy (`skill-improve-quality-skill-<hash>`), but if the real skill is also installed in `~/.claude/skills`, the model invokes the canonical name and every positive scores as a miss. Remove the symlink before the run and recreate it after: `ln -s <this-repo> ~/.claude/skills/skill-improve-quality`.
- **Read the failure signature.** Uniform 0% recall with 100% precision across all queries is not a bad description — it's broken plumbing. A real description problem produces a spread (1/3s and 2/3s), not a perfect zero. Probe `claude -p` auth manually before trusting the numbers.
- **Budget for it.** Each iteration is ~60 Claude sessions (20 queries × 3 runs); a 5-iteration run can trip account rate limits, and rate-limited calls are scored as misses (same silent-failure path as auth). For a cheaper pass use `--max-iterations 2 --runs-per-query 2`.
- **Expect underestimation.** Even a clean run measures triggering of an artifact-looking renamed copy, which models treat more warily than the real skill name. Treat the scores as a lower bound; a direct probe against the installed skill is the ground truth for production behaviour.
