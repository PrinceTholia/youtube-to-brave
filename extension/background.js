// Background: two paths hand YouTube URLs to the containing app (which
// opens Brave): (1) runtime messages from content.js same-tab clicks,
// (2) webNavigation.onBeforeNavigate for main_frame YouTube navigations
//     (new tabs, target=_blank links, address bar) — opens in Brave and
//     bounces the tab to a 'Playing in Brave' page.
// A per-tab lock stops the same URL handing off twice (a click and its
// resulting navigation both firing).

const NATIVE_APP = "com.ytobrave.app";
const lastHandoff = new Map(); // tabId → URL just handed off

function isYouTube(hostname) {
  const h = hostname.replace(/^www\./, "");
  return h === "youtube.com" || h === "youtu.be" || h.endsWith(".youtube.com");
}

function handOff(raw, tabId = -1) {
  if (!raw || !raw.startsWith("http")) return false;
  if (tabId >= 0 && lastHandoff.get(tabId) === raw) return false; // dedupe
  if (tabId >= 0) lastHandoff.set(tabId, raw);
  try {
    browser.runtime.sendNativeMessage(NATIVE_APP, { url: raw }).catch(() => {});
    return true;
  } catch (e) { return false; }
}

// Path 1: content script click (same tab)
browser.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.url) handOff(msg.url, sender.tab ? sender.tab.id : -1);
});

// Path 2: any main_frame YouTube navigation (covers new tabs from Google etc.)
browser.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  let u;
  try { u = new URL(details.url); } catch { return; }
  if (!isYouTube(u.hostname)) return;
  if (handOff(details.url, details.tabId) && details.tabId >= 0) {
    // Bounce the tab so the browser doesn't load YouTube
    browser.tabs.update(details.tabId, { url: browser.runtime.getURL("handoff.html") }).catch(() => {});
  }
});
