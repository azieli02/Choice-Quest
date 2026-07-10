# Choice Quest v2.1.2B

- Increased displayed gem size by 15%.
- Lowered the treasure slots so gems sit deeper inside the chest.
- Rebuilt the treasure pile as twelve slightly irregular slots arranged in three rows: 3 back, 4 middle, and 5 front.
- Adjusted horizontal and vertical spacing so rows overlap intentionally without hiding most of neighboring gems.
- Preserved random available-slot selection and random gem colors; the daily pile remains stable after refreshes.
- Renamed the chest asset to `assets/treasure/Choice-Quest-Treasure-Chest.PNG` and kept all references consistent.
- Updated project version references to 2.1.2.
- No Apps Script/backend changes.
- Adjusted treasure pile upward ~1.5% and refined slot spacing.


# Choice Quest v2.1.2
- Increased displayed gem size by 15%.
- Lowered the treasure slots so gems sit deeper inside the chest.
- Rebuilt the treasure pile as twelve slightly irregular slots arranged in three rows: 3 back, 4 middle, and 5 front.
- Adjusted horizontal and vertical spacing so rows overlap intentionally without hiding most of neighboring gems.
- Preserved random available-slot selection and random gem colors; the daily pile remains stable after refreshes.
- Renamed the chest asset to `assets/treasure/Choice-Quest-Treasure-Chest.PNG` and kept all references consistent.
- Updated project version references to 2.1.2.
- No Apps Script/backend changes.


# Choice Quest v2.1.0
- Replaced the generated chest with the finished treasure-chest artwork.
- Added all six finished gem images.
- Added a dedicated `js/treasure.js` module.
- Added ten predefined gem slots, each with its own final position, drop point, rotation, and scale.
- Gem colors and available slots are selected deterministically from the child name and date, so the pile stays stable after refreshes but changes each day.
- New gems fall directly into their assigned slot without bouncing.
- Gems remain visible for the current day and clear when the spreadsheet resets the daily gem count.
- No Apps Script/backend changes.


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
