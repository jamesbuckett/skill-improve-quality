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

These are the JS snippets the subagent passes to `browser_evaluate`. Each returns a JSON-serialisable value the subagent reads back.

### Accent-colour audit

```javascript
() => {
  const KEEP = new Set(['color', 'background-color', 'border-color', 'outline-color', 'fill', 'stroke']);
  const counts = new Map();
  const elements = document.querySelectorAll('body *');
  for (const el of elements) {
    const style = getComputedStyle(el);
    for (const prop of KEEP) {
      const value = style.getPropertyValue(prop);
      if (!value) continue;
      // Skip transparent, currentColor, and the default text/background colours.
      if (value === 'rgba(0, 0, 0, 0)' || value === 'transparent') continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  // Sort by frequency; the top 1-2 are usually text + background.
  // Anything below that with >5 uses is a candidate "accent".
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    totalDistinctColours: ranked.length,
    topTen: ranked.slice(0, 10),
  };
};
```

The subagent interprets the result: the top 1–2 most-frequent values are usually `body` text and background. After those, count distinct values with ≥5 uses — that's the rough number of "accents in play". One is correct; two or more is a finding.

### Emoji audit

```javascript
() => {
  // Match Unicode emoji ranges. Lucide SVGs are NOT in document.body.innerText.
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F0FF}\u{1F100}-\u{1F2FF}\u{2300}-\u{23FF}\u{1FA70}-\u{1FAFF}]/gu;
  const text = document.body.innerText;
  const matches = [...text.matchAll(emojiRegex)];
  return matches.map(m => ({ char: m[0], codepoint: m[0].codePointAt(0).toString(16) }));
};
```

Any non-empty array is a finding.

### Audience switcher audit

```javascript
(initialSnapshot) => {
  // Compare visible practitioner-only / exec-only content before and after the click.
  // Pass the pre-click snapshot in as `initialSnapshot`; the subagent should call this
  // function twice — once before and once after the click — and diff.
  const counts = {};
  for (const cls of ['practitioner-only', 'exec-only', 'expanded-only', 'details-only']) {
    const visible = [...document.querySelectorAll('.' + cls)]
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }).length;
    counts[cls] = visible;
  }
  return counts;
};
```

The subagent calls it twice (before and after the click). If no count changed, the switcher toggles nothing — that's the named failure mode.

### Dark-mode audit

```javascript
() => {
  const html = document.documentElement;
  const body = document.body;
  return {
    htmlDataTheme: html.dataset.theme || null,
    htmlClass: html.className,
    bodyBg: getComputedStyle(body).backgroundColor,
    bodyColor: getComputedStyle(body).color,
  };
};
```

Snapshot before and after clicking the toggle. Finding fires if either:
- `htmlDataTheme` did not change (toggle isn't wired)
- `bodyBg` did not change (theme variable not applied)

## What to do when Playwright isn't installed

If the Playwright MCP browser tools aren't available (rare — they're a standard Claude Code MCP), the subagent falls back to source-level checks only and notes the gap in its return. The subagent's prompt should say so explicitly so the user knows the rendered checks were skipped.

The skill does not block on missing browser tools — the structural dimension is still useful from source alone, just weaker on the rendered-only checks.
