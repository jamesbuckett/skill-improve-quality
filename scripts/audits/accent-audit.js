// Accent-colour audit — pass verbatim to browser_evaluate (or page.evaluate).
// Clusters computed colours by hue so an accent and its tints (hover states,
// alpha washes) count as ONE accent, while neutrals (text, backgrounds, greys)
// are excluded entirely. A flat frequency ranking cannot do either — the page's
// real accent often outranks its background, and white button text ties with
// genuine second accents.
// Interpretation: accentClusters === 1 is correct; >= 2 is a finding.
() => {
  const PROPS = ['color', 'background-color', 'border-top-color', 'border-right-color',
                 'border-bottom-color', 'border-left-color', 'outline-color', 'fill', 'stroke'];
  const parse = (v) => {
    const m = v.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const toHsl = ({ r, g, b }) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return { h: h * 60, s, l };
  };
  const counts = new Map();
  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    for (const prop of PROPS) {
      const value = style.getPropertyValue(prop);
      if (!value || value === 'none' || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') continue;
      const c = parse(value);
      if (!c || c.a === 0) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  const chromatic = [];
  let neutralsIgnored = 0;
  for (const [value, count] of counts) {
    const { h, s, l } = toHsl(parse(value));
    if (s < 0.15 || l < 0.08 || l > 0.92) neutralsIgnored += 1;
    else chromatic.push({ value, count, hue: h });
  }
  chromatic.sort((a, b) => a.hue - b.hue);
  const HUE_TOLERANCE = 30;
  const clusters = [];
  for (const c of chromatic) {
    const last = clusters[clusters.length - 1];
    if (last && c.hue - last.maxHue <= HUE_TOLERANCE) {
      last.members.push(c); last.maxHue = c.hue; last.total += c.count;
    } else {
      clusters.push({ members: [c], minHue: c.hue, maxHue: c.hue, total: c.count });
    }
  }
  if (clusters.length > 1) {
    const first = clusters[0], last = clusters[clusters.length - 1];
    if (first.minHue + 360 - last.maxHue <= HUE_TOLERANCE) {
      first.members.push(...last.members); first.total += last.total;
      first.minHue = last.minHue - 360;
      clusters.pop();
    }
  }
  const accents = clusters
    .filter(cl => cl.total >= 5)
    .map(cl => ({
      hueRange: [Math.round(cl.minHue), Math.round(cl.maxHue)],
      totalUses: cl.total,
      examples: cl.members.sort((a, b) => b.count - a.count).slice(0, 3).map(m => m.value),
    }))
    .sort((a, b) => b.totalUses - a.totalUses);
  return { accentClusters: accents.length, accents, neutralsIgnored };
}
