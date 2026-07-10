# Choice Quest v2.0

Choice Quest v2.0 moves the kid-facing interface to **GitHub Pages** while keeping Google Sheets and Apps Script as the data backend.

## Project layout

- `index.html` — GitHub Pages entry point
- `css/styles.css` — game styling
- `js/app.js` — rendering, optimistic updates, and animations
- `js/config.js` — Apps Script API URL and refresh timing
- `assets/` — background, chest, and gem artwork
- `backend/` — Apps Script files

## 1. Update the Apps Script backend

In the existing Apps Script project:

1. Replace `Code.gs` with `backend/Code.gs`.
2. The other files in `backend/` are included so the previous Apps Script page remains available during migration; they do not need replacement if unchanged.
3. Save.
4. Deploy → Manage deployments → Edit.
5. Select **New version** and deploy.
6. Keep access set to **Anyone** and execute as **Me**.

The existing `/exec` URL remains the API URL already entered in `js/config.js`.

## 2. Upload the GitHub frontend

Upload everything in this folder **except `backend/`** to the root of:

`https://github.com/azieli02/Choice-Quest`

GitHub can safely contain `backend/` too, but it is not served or required by the frontend.

## 3. Enable GitHub Pages

In the repository:

1. Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: **main**
4. Folder: **/ (root)**
5. Save

The expected site address is:

`https://azieli02.github.io/Choice-Quest/`

## 4. Test

Open the GitHub Pages address in a browser. Confirm:

- both kid cards load
- Good Choice, Bonus Gem, Oops, and Undo save to Google Sheets
- Refresh works
- the background and animations load

Then replace the Apps Script URL in the DakBoard widget with the GitHub Pages address.

## Artwork status

- Current pirate background is included locally.
- The completed chest is staged at `assets/treasure/Choice-Quest-Treasure-Chest.PNG` and is used by the live treasure display.
- Add the six final gems to `assets/gems/`; they can be integrated with the chest in the next visual release.

## Important implementation note

The frontend communicates with Apps Script through a JSONP API. This avoids iframe and cross-origin request issues while preserving the existing Google Sheets backend.
