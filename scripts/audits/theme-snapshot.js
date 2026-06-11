// Dark-mode audit — pass verbatim to browser_evaluate (or page.evaluate).
// Run TWICE: once before and once after clicking the theme toggle. Finding fires if
// either htmlDataTheme did not change (toggle not wired) or bodyBg did not change
// (theme variable not applied — e.g. hard-coded hex outside :root).
() => {
  const html = document.documentElement;
  const body = document.body;
  return {
    htmlDataTheme: html.dataset.theme || null,
    htmlClass: html.className,
    bodyBg: getComputedStyle(body).backgroundColor,
    bodyColor: getComputedStyle(body).color,
  };
}
