// Audience-switcher audit — pass verbatim to browser_evaluate (or page.evaluate).
// Run TWICE: once before and once after clicking the switcher, then diff the
// two snapshots. If no count changed, the switcher toggles nothing — the named
// failure mode from skill-build-educational-site.
() => {
  const counts = {};
  for (const cls of ['practitioner-only', 'exec-only', 'expanded-only', 'details-only']) {
    counts[cls] = [...document.querySelectorAll('.' + cls)].filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }).length;
  }
  return counts;
}
