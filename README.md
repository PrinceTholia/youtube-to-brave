# YouTube → Brave (Safari extension)

Click any YouTube link **inside Safari** → it opens in **Brave**. Everything else stays in Safari.

Works for links on any page (Google results, Reddit, chat apps...) and for typed/pasted YouTube URLs in new tabs.

## How it works

```
YouTube link in Safari
   → extension catches the click / navigation
   → native messaging → tiny macOS app
   → opens the video in Brave (Safari tab shows a "Playing in Brave" page)
```

Two interception paths in the extension:
1. **Click path** — a content script catches same-tab clicks on YouTube links (cmd/ctrl/middle-click untouched, so "open in new tab" keeps working)
2. **Navigation path** — `webNavigation.onBeforeNavigate` catches main-frame YouTube loads (new tabs, `target=_blank`, pasted URLs) and bounces the tab to a "Playing in Brave" page

A per-tab lock prevents the same URL from being handed off twice.

## Build

Requirements: macOS 14+, Xcode with a (free) Apple ID signing team, Brave installed.

```bash
cd YTToBrave
xcodebuild -project YTToBrave.xcodeproj -scheme YTToBrave -configuration Release \
  DEVELOPMENT_TEAM=YOUR_TEAM_ID build
# app lands in ~/Library/Developer/Xcode/DerivedData/YTToBrave-*/Build/Products/Release/
```

Or open `YTToBrave.xcodeproj` in Xcode, set your team on both targets, and ⌘R.

Install the built app to `/Applications` and launch it once.

## Enable in Safari (one-time)

1. Safari → Settings → Extensions → **YTToBrave**
2. Enable it, allow youtube.com when asked

**Note:** re-install the app (any update) and Safari resets the Enable toggle — macOS quirk, just re-enable.

## Customizing

- **Another browser?** Change `braveBundleID` in `SafariWebExtensionHandler.swift` (e.g. `"com.google.Chrome"`), and the app name if you like.
- **Another site?** Edit `isYouTube()` in `background.js`, `content.js` and `SafariWebExtensionHandler.swift`.

## Permissions (why)

- `nativeMessaging` — hand URLs to the containing app, which opens Brave
- `webNavigation` + `tabs` — catch YouTube navigations in new tabs and bounce them
- content script on `<all_urls>` — it must see link clicks on every page to know which point to YouTube. It reads nothing; it only watches clicks.

## Privacy

Nothing leaves your Mac. No analytics, no servers, no browsing history stored. The only log entry is a Safari extension error message if Brave can't be opened.

## License

MIT — see [LICENSE](LICENSE).
