# CLAUDE.md — CIP (Campus Information Portal)

This file provides guidance for AI assistants working in this repository.

## Project Overview

**CIP** (Campus Information Portal) is a Chrome Extension named **WCAG 2.1 Compliance Checker**. It allows users to inspect the currently active browser tab for accessibility violations — specifically, images that are missing or have empty `alt` text attributes, as required by WCAG 2.1 Success Criterion 1.1.1.

- **Extension type:** Chrome Extension, Manifest V3
- **Languages:** JavaScript (ES6), HTML5
- **Dependencies:** None (no npm, no build tools)
- **Load method:** Unpacked extension, loaded directly in Chrome — no compilation step

## Repository Structure

```
CIP/
├── README.md          # Minimal project description
├── CLAUDE.md          # This file
├── manifest.json      # Chrome extension manifest (Manifest V3)
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic and message handling
└── content.js         # Content script injected into web pages
```

> Note: The implementation files (`manifest.json`, `popup.html`, `popup.js`, `content.js`) exist on the `origin/jules_wip_1685166045295298647` branch and are expected to be merged or cherry-picked into the main branch as work continues.

## Branch Structure

| Branch | Description |
|--------|-------------|
| `master` | Initial commit; contains only `README.md` |
| `claude/add-claude-documentation-OEp0g` | Documentation branch (current) |
| `origin/jules_wip_1685166045295298647` | WIP implementation; contains all extension source files |

When working on new features, branch off from the most complete state (the WIP branch or its successor once merged).

## Key Files

### `manifest.json`
Chrome Extension Manifest V3 configuration.
- **Permissions:** `activeTab` (read the current tab), `scripting` (inject scripts)
- **Action:** Defines `popup.html` as the default popup
- **Icons:** Expects `icon16.png`, `icon48.png`, `icon128.png` in root (not yet added)

### `popup.html`
The extension's popup UI rendered when the toolbar icon is clicked.
- Contains a `<button id="checkPageButton">` to trigger the check
- Contains a `<div id="resultsArea">` where results are rendered
- Loads `popup.js` as a `<script>`

### `popup.js`
Handles all popup-side logic.
- On `DOMContentLoaded`, attaches a click listener to `#checkPageButton`
- On click: queries the active tab, sends `{ action: "checkPage" }` via `chrome.tabs.sendMessage`
- Listens for `{ action: "results", data: [...] }` from the content script
- Renders failing images as a `<ul>` list in `#resultsArea`, or a "no issues" message

### `content.js`
Content script automatically injected into web pages.
- `checkImageAltText()`: Queries all `<img>` elements in the DOM, returns those missing `alt` or with an empty `alt` attribute
- Listens for `{ action: "checkPage" }` messages from `popup.js`
- Responds with `{ action: "results", data: failingImages }` via `sendResponse`
- Returns `true` from the message listener to support asynchronous `sendResponse`

## Architecture: Message Passing

The extension uses Chrome's message-passing API to communicate between the popup and the content script:

```
User clicks button
      |
  popup.js
  chrome.tabs.sendMessage(tabId, { action: "checkPage" })
      |
  content.js (injected in active tab)
  checkImageAltText() → returns failingImages[]
  sendResponse({ action: "results", data: failingImages })
      |
  popup.js
  chrome.runtime.onMessage → renders results in #resultsArea
```

Key constraint: `content.js` must `return true` from its `onMessage` listener to keep the message channel open for async `sendResponse`.

## Development Workflow

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the repository root directory (or the branch checkout containing the source files)
5. The extension icon will appear in the toolbar

### Testing

1. Navigate to any web page
2. Click the extension icon to open the popup
3. Click **Check Current Page**
4. Results will show any `<img>` elements missing or with empty `alt` text

There is no automated test suite. Manual testing in Chrome is the current approach.

### Reloading After Changes

After editing any source file:
1. Go to `chrome://extensions/`
2. Click the reload icon on the extension card
3. Refresh the target page if testing the content script

## Code Conventions

- **JavaScript style:** Plain ES6, no transpilation, no bundler
- **DOM queries:** `document.getElementById` and `document.querySelectorAll`
- **Error handling:** `console.error` for missing elements or invalid tab states
- **Message format:** Plain objects with an `action` string field and optional `data` payload
- **No frameworks:** Vanilla JS only — do not introduce React, Vue, or similar
- **No build tools:** Do not add webpack, Vite, or any bundler without explicit agreement

## Known State & TODOs

The `jules_wip_1685166045295298647` branch represents an incomplete implementation. Known gaps:

- [ ] Extension icons (`icon16.png`, `icon48.png`, `icon128.png`) are referenced in `manifest.json` but not yet created
- [ ] Only image alt text is checked; other WCAG 2.1 criteria are not yet implemented
- [ ] `popup.js` uses `chrome.tabs.sendMessage` but does not handle the case where the content script is not yet injected (e.g., on chrome:// pages)
- [ ] No error feedback shown to the user in the popup when a check fails
- [ ] No automated tests

## Git Workflow

- Feature branches follow the pattern: `<author>/<description>-<id>`
- Commit messages should be descriptive and in the imperative mood (e.g., "Add alt text check for background images")
- Do not force-push to `master`
- When implementation is complete, open a PR from the feature branch into `master`
