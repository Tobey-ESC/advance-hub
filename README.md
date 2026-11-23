# Advanced Hub

Internal, static knowledge tracker for advanced support conversations (Inbox Advanced and Automation Advanced). No Node, npm, build step or server. **Double-click `index.html`.**

## Add a conversation

Open `js/conversations.js`, copy any object, paste it into the array, change the fields, save, refresh. Field reference and text-formatting tips are at the top of that file. The page shows a "Data check" banner if a record has a typo (bad category, duplicate ID, bad date, etc.).

## Change topics or statuses

Edit `js/config.js`. Filters, dashboard bars and validation update automatically.

## Files

```
index.html            page shell (loads everything with plain <script> tags; no modules, no fetch)
css/styles.css        tokens (palette, shadows, fonts), reset
css/layout.css        app shell, sidebar, topbar, page grids
css/components.css    buttons, badges, cards, toolbar, modal, empty states
css/responsive.css    laptop / tablet / mobile
js/config.js          categories, topics, statuses
js/icons.js           inline Lucide SVG icons
js/conversations.js   THE data (single source of truth)
js/search.js          Fuse.js (CDN) with built-in fuzzy fallback
js/filters.js         combined filtering, sorting, tag facets
js/navigation.js      #/hash routing + mobile menu
js/app.js             dashboard, library, detail panel, events

```

## Notes

* Fonts (Google Fonts) and Fuse.js load from CDNs. Offline, the app still works with system fonts and the built-in fuzzy search.
* Deep links: `index.html#/inbox/ADV-014` opens that case. Keyboard: `/` focuses search, `Esc` closes a case, arrow keys move between cases.