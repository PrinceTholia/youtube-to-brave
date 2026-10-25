# YT → Brave (2026-10-25)

**What:** Click a YouTube link inside Safari (or any app) → opens in Brave. Everything else stays where it is.

**How it works (3 pieces):**
1. Safari Web Extension (`~/Developer/yt-to-brave/extension/`) — DNR rule redirects `youtube.com|youtu.be` main-frame navigations to `https://yt-to-brave.local/<real-url>`; background.js catches that, sends the real URL via native messaging, cancels the fake navigation (no error page).
2. Containing app `/Applications/YTToBrave.app` — `SafariWebExtensionHandler.swift` receives the message and `NSWorkspace.open([url], withApplicationAt: Brave)`.
3. Finicky (already installed) — keeps handling links from non-browser apps (Slack etc.).

**Tests passed:** regex 8/8, URL extraction 2/2 (incl. query-string bug fix), Swift build OK, scheme handoff to Brave verified live, extension registered with Safari (`pluginkit`).

**Prince's one-time step:** Safari → Settings → Extensions → "YouTube → Brave" → Enable (+ allow youtube.com). Then click a YouTube link in Safari → Brave.

**Rebuild:** `cd ~/Developer/yt-to-brave/YTToBrave && xcodebuild -scheme YTToBrave -configuration Debug build`, then copy from DerivedData Debug products to /Applications (rm -rf first — cp -R over existing app doesn't replace).

**Gotchas hit:** webRequestBlocking not supported in Safari (drop permission, blocking webRequest still works); onRuleMatchedDebug is Chrome-only; extension bundle ID must be prefixed by parent app ID; `cp -R` over existing app keeps stale files; DNR regexSubstitution `\0` → use capture group `\1`.

**2026-10-25 later:** Found why Safari didn't show the extension: my `codesign --deep --force` re-sign stripped the appex's sandbox entitlements → pkd silently rejected it. Fix: install Xcode's build output directly (never --deep re-sign an extension app). Extension now registered. Also: Finicky uninstalled (brew), Safari set as default http/https handler. Old debug copies deleted.

**Root cause 2 (Safari list empty):** Debug builds carry get-task-allow entitlement → macOS treats extension as development-signed and Safari Settings hides it. Fix: Release build with CODE_SIGN_INJECT_BASE_ENTITLEMENTS=NO + explicit appex entitlements (sandbox, no get-task-allow). Installed Release to /Applications.

**Final fix:** signed with his real Apple Development cert (team WS67S93AUU, automatic signing, -allowProvisioningUpdates). Dev-signed extensions with get-task-allow are exactly what Safari lists for local dev builds.
**Name in Safari's list:** look for "YTToBrave" / "YouTube → Brave" from app YTToBrave.

**Interception upgrade:** DNR/webRequest path didn't fire in Safari (no logs, no redirect). Added content.js click interceptor (capture-phase, <all_urls>) + runtime.onMessage in background — two independent paths to the native handoff. NOTE: every reinstall changes the extension UUID → Safari's Enable toggle resets to OFF. Prince must re-enable after each install.

**Error he saw ("content.js invalid path"):** Xcode's Resources build phase lists files explicitly; new files must be added to project.pbxproj (4 sections) — plain cp into Resources/ is not enough. Fixed; also purged sample Script.js/Style.css.

**Duplicate extensions root cause:** (1) stray /Applications/Contents/ folder from an earlier bad `cp -R "$APP" /Applications/` (no trailing cleanup) — macOS scanned it as an app; (2) DerivedData products get recreated on every xcodebuild → always delete after install, or build to a fixed dir. Rule: ONE copy of the app on disk, ever.

**Google-result clicks (new tab, target=_blank):** click interception only catches same-tab clicks; new tabs do main_frame navigations → added webNavigation.onBeforeNavigate path (Safari 14+): YouTube main_frame → native handoff to Brave + tab bounced to about:blank. Manifest perms += webNavigation, tabs.

**Polish:** about:blank bounce → bundled handoff.html ("Playing in Brave" + Brave flame logo, light/dark aware). Added to pbxproj resources phase (content.js lesson applied).

**2026-10-26 App Store prep:** Requirements audit found missing: app icons (10 sizes generated from real Brave logo), sandbox entitlements (added to both targets), category/copyright/display name (added to Info.plist). Archive + export VALIDATED (App Store .pkg at release/YTToBrave-1.0.pkg). Next: App Store Connect record + upload (needs his 2FA login or API key), privacy answers, 1-2 screenshots.
