# Choice Quest v2.0.2
- Standardized frontend configuration on one global object: `window.CHOICE_QUEST_CONFIG`.
- Fixed the configuration naming collision that stopped the app from loading.
- Fixed remaining stale configuration references in `app.js`.
- Fixed the action lookup to use `APP_CONFIG.actions`.
- Loaded `constants.js` before `app.js`.
- Kept the Apps Script API URL, refresh interval, request timeout, and version in `js/config.js`.
- No backend, spreadsheet, CSS, or artwork changes.

 
# v2.0.1
- Added config.js
- Added constants.js
- Version bump


# Choice Quest v2.0
- Moved the kid-facing frontend to a GitHub Pages-compatible static site.
- Preserved the existing UI, buttons, saving behavior, and animations.
- Added an Apps Script JSONP API for cross-origin communication.
- Kept the legacy Apps Script UI available during migration.
- Bundled the pirate background locally.
- Staged the completed chest artwork for the upcoming visual integration.
- Removed all dependency on Apps Script HTML templating from the GitHub frontend.
