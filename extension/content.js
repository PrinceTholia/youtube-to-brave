// Content script: catch plain same-tab clicks on YouTube links and route them
// to the background script for handoff to Brave. Modifier clicks (cmd/ctrl/
// shift/middle/right) and target=_blank are left alone — the background
// webNavigation listener intercepts those navigations instead, so "open in
// new tab" keeps working.

document.addEventListener("click", (e) => {
  if (e.defaultPrevented) return;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest("a[href]");
  if (!a) return;
  if (a.target && a.target !== "_self") return;
  const href = a.href;
  if (!href) return;
  let u;
  try { u = new URL(href); } catch { return; }
  const h = u.hostname.replace(/^www\./, "");
  const isYT = h === "youtube.com" || h === "youtu.be" || h.endsWith(".youtube.com");
  if (!isYT) return;
  e.preventDefault();
  e.stopPropagation();
  // Single handoff path: message the background (native messaging → Brave).
  // No local navigation — the webNavigation listener only sees modifier/new-tab
  // opens, so a plain click can't double-fire.
  browser.runtime.sendMessage({ url: href }).catch(() => {});
}, true);
