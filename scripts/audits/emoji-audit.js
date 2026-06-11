// Emoji audit — pass verbatim to browser_evaluate (or page.evaluate).
// Scans BOTH visible text and CSS ::before/::after pseudo-elements:
// innerText does not include pseudo-element content, so a text-only scan
// misses emoji injected via `content:`.
// Returns [] when clean; any entry is a finding.
() => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F0FF}\u{1F100}-\u{1F2FF}\u{2300}-\u{23FF}\u{1FA70}-\u{1FAFF}]/gu;
  const findings = [];
  for (const m of document.body.innerText.matchAll(emojiRegex)) {
    findings.push({ char: m[0], codepoint: m[0].codePointAt(0).toString(16), via: 'text' });
  }
  for (const el of document.querySelectorAll('body *')) {
    for (const pseudo of ['::before', '::after']) {
      const content = getComputedStyle(el, pseudo).content;
      if (!content || content === 'none' || content === 'normal') continue;
      for (const m of content.matchAll(emojiRegex)) {
        const cls = typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '';
        findings.push({
          char: m[0],
          codepoint: m[0].codePointAt(0).toString(16),
          via: pseudo,
          selector: el.tagName.toLowerCase() + cls,
        });
      }
    }
  }
  return findings;
}
