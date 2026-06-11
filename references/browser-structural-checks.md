# Browser-based structural checks (Dimension 4)

This reference describes the rendered-DOM checks the Dimension 4 subagent runs via the Playwright MCP browser tools. They complement — but do not replace — the source-level checks in `checks.md`.

Source-level checks (CSS grep, HTML parsing) and rendered checks each catch failure modes the other misses. Use both.

| Failure mode | Stronger from | Why |
|---|---|---|
| Single accent color | rendered DOM | Computed-style sampling catches accents set via JS, `<style>` blocks far from `:root`, or inline `style=""` attributes that source grep misses. |
| No emoji | rendered DOM | Emoji injected via `innerHTML`, `content:` pseudo-elements, or pasted Unicode in attributes don't always show up in a naive source grep. |
| Audience switcher actually toggles content | rendered DOM | Confirms the switcher fires a JS handler that changes element visibility — not just that the button exists. |
| Dark-mode toggle actually flips theme | rendered DOM | Confirms `data-theme` flips on `<html>` AND that at least one computed colour changes. Catches "toggle present, never wired" failure. |
| Console errors after authoring | rendered DOM | Surfaces JS errors that broke the page silently. |
| Spacing tokens used (no ad-hoc px) | source | Token discipline lives in the CSS, not the rendered output. |
| Hex codes outside `:root` | source | Same — source-level concern. |
| TL;DR section leads | source | Structural ordering check on the DOM tree. |
| Glossary covers terms | source | Requires reading prose and comparing to term list. |
| Primary sources only | source | Requires URL inspection, not rendering. |

## Subagent prompt template

The Dimension 4 subagent must be spawned with `subagent_type=general-purpose` (not `Explore`) so it has access to the Playwright MCP browser tools.

> Read `<absolute-path-to-index.html>`. You will also use Playwright MCP browser tools to render the page and inspect the DOM. Your job is to identify structural-quality findings against the `skill-style-guide` and `skill-build-educational-site` patterns.
>
> Phase A — source-level checks. Read the file once end to end. Run the source-level checks listed in `references/checks.md` Dimension 4 (TL;DR position, glossary contents, primary-source URLs, regulatory callout shape, comparison-table-as-single-table, section ordering, spacing tokens, hex codes outside `:root`).
>
> Phase B — rendered checks. Run these Playwright MCP actions in order:
>
> 1. `browser_navigate` to `file://<absolute-path-to-index.html>`.
> 2. `browser_resize` to 1440×900 (desktop).
> 3. `browser_take_screenshot` → save path noted for any visual finding.
> 4. `browser_evaluate` with the script in **Accent-colour audit** (below). Capture the returned list.
> 5. `browser_evaluate` with the script in **Emoji audit** (below). Capture the returned list.
> 6. If the page has an audience switcher (look for a button or toggle with text matching `/exec|practitioner|technical|expand/i`), use `browser_click` on it, then `browser_evaluate` the **Audience switcher audit** script to verify visibility actually changed.
> 7. If the page has a dark-mode toggle (button with `aria-label` containing "theme" or "dark", or an icon-only toggle in the header), use `browser_click` on it, then `browser_evaluate` the **Dark-mode audit** script to verify `data-theme` flipped AND background-color changed.
> 8. `browser_resize` to 375×800 (mobile) and `browser_take_screenshot` for the mobile view.
> 9. `browser_console_messages` to capture any JS errors during the run.
> 10. `browser_close` when done.
>
> Return findings combining Phase A and Phase B. Each finding has: severity, location, problem, suggested fix, rationale, source (URL or "rendered DOM at <breakpoint>"). For rendered findings, include the screenshot path the user can reference.

## Audit scripts

The audit scripts live in `scripts/audits/` — one file per check, each a single arrow-function expression with a header comment explaining its interpretation. They are the single source of truth: the eval harness (`evals/run-browser-audits.mjs`) runs the same files against the planted-issues fixture, so editing a script here is automatically covered by the eval.

**How to pass one to `browser_evaluate`:** Read the file, strip the leading `//` comment lines, and pass everything from `() =>` onward as the `function` argument. (Evaluators treat a string with leading comments as a plain expression and silently return `undefined` instead of calling the function.)

| Script | Detects | Interpretation |
|---|---|---|
| `scripts/audits/accent-audit.js` | Two-accent violations | Clusters computed colours by hue (30° tolerance), so an accent plus its tints/hover states/alpha washes counts as ONE accent, and neutrals (text, background, greys — saturation < 15% or near-black/near-white) are excluded entirely. Returns `accentClusters`: 1 is correct, ≥ 2 is a finding. Do not use a flat frequency ranking — the real accent often outranks the background, and white button text ties with genuine second accents. |
| `scripts/audits/emoji-audit.js` | Emoji anywhere in rendered output | Scans `document.body.innerText` AND every element's `::before`/`::after` computed `content` — innerText does not include pseudo-element content, so a text-only scan misses emoji injected via CSS. Any non-empty array is a finding; each entry says whether it came from text or a pseudo-element and on which selector. |
| `scripts/audits/visibility-snapshot.js` | Audience switcher that toggles nothing | Run twice — before and after `browser_click` on the switcher — and diff. If no count changed, the switcher toggles nothing: the named failure mode. |
| `scripts/audits/theme-snapshot.js` | Dark-mode toggle that doesn't restyle | Run twice — before and after clicking the theme toggle. Finding fires if `htmlDataTheme` did not change (toggle not wired) or `bodyBg` did not change (theme variable not applied — e.g. hard-coded hex outside `:root`). |

To verify the scripts themselves after editing them, run the eval harness from a directory with `playwright` installed:

```bash
node <skill-dir>/evals/run-browser-audits.mjs
```

## What to do when Playwright isn't installed

If the Playwright MCP browser tools aren't available (rare — they're a standard Claude Code MCP), the subagent falls back to source-level checks only and notes the gap in its return. The subagent's prompt should say so explicitly so the user knows the rendered checks were skipped.

The skill does not block on missing browser tools — the structural dimension is still useful from source alone, just weaker on the rendered-only checks.
