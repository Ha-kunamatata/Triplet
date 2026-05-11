# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Triplet is a personal travel-itinerary planner built as a SPA. React 18 + Vite, Firebase (Auth + Firestore) for backend, deployed to GitHub Pages. UI strings, comments, and commit messages are written in Korean — keep new copy in Korean unless asked otherwise.

Live URL: `https://ha-kunamatata.github.io/Triplet/`

## Commands

```bash
npm install
npm run dev      # Vite dev server at http://localhost:5173/Triplet/  (base path matters)
npm run build    # Production build into dist/
npm run preview  # Preview the production build locally
npm run deploy   # Build then publish dist/ to gh-pages branch via gh-pages CLI
```

There are no tests, lint, or typecheck scripts configured.

Auto-deploy: `.github/workflows/deploy.yml` runs `npm run build` and publishes to GitHub Pages on every push to `main`. It injects `VITE_KAKAO_MAPS_API_KEY` from repo secrets at build time.

## Environment / API keys

Two distinct systems — don't confuse them:

- **Firebase config is hardcoded** in `src/firebase/config.js`. The `VITE_FIREBASE_*` vars listed in `.env.example` and the README are **not actually read by the code**. If you migrate Firebase to env vars, update `config.js`.
- **Kakao Maps keys are env-driven** via Vite:
  - `VITE_KAKAO_MAPS_API_KEY` — JS SDK key, used by `src/components/maps/PlaceSearch.jsx`
  - `VITE_KAKAO_REST_API_KEY` — REST key for Kakao Local API, used by `src/utils/placeSearch.js`
  - Without these keys, `placeSearch.js` falls back to Nominatim (OpenStreetMap) for foreign/English queries.

## Architecture

### Routing (`src/App.jsx`)

Uses **HashRouter** (not BrowserRouter) because GitHub Pages can't handle client-side routes otherwise. The `base: '/Triplet/'` in `vite.config.js` must stay in sync with the repo name.

Three route groups:
1. **Public** (`/login`, `/register`) wrapped in `PublicRoute` — redirects to `/` if already signed in.
2. **App shell** routes nested under `<ShellLayout />` (`/`, `/trips/:tripId`, `/saved-places`, `/profile`, diary list). These render inside `AppLayout`, which provides the sidebar (tablet+) and bottom nav (mobile).
3. **Full-screen forms** (`/trips/new`, schedule add/edit, item add/edit, diary new/edit) — `PrivateRoute` only, no shell chrome.

`AuthContext` uses the convention **`user === undefined` means loading**, `null` means signed out, an object means signed in. Both `PrivateRoute` and `PublicRoute` render `<LoadingSpinner fullScreen />` while undefined — preserve this tri-state when touching auth logic.

### Data layer (`src/firebase/`)

- `config.js` — initializes the Firebase app and exports `auth` and `db`.
- `auth.js` — email/password + Google sign-in; on signup or first Google login, creates a `users/{uid}` profile doc.
- `firestore.js` — **all Firestore reads/writes go through this module**. Don't call Firestore SDK functions directly from components/pages. Each collection has CRUD helpers grouped by section.

**Firestore collections** (matching `firestore.rules`):
- `trips/{tripId}` — owned by `userId`. Embeds `checklist`, `budget`, `expenses`, `categoryBudgets` as fields on the trip doc.
- `schedules/{id}` — legacy per-day schedule entries (linked via `tripId`, plus `date`, `startTime`, `order`).
- `tripItems/{id}` — **newer typed item system**: `FLIGHT | STAY | PLACE | TRANSPORT | MEMO` (see `ITEM_TYPES` in `src/constants/index.js`). Factory functions in `src/utils/tripItemUtils.js` produce the canonical shape per type. Both `schedules` and `tripItems` currently coexist — check which a given page uses before adding fields.
- `diary/{id}` — linked via `tripId` and `userId`.
- `savedPlaces/{id}` — user-scoped (not trip-scoped).
- `users/{uid}` — profile doc.

Authorization in `firestore.rules` is enforced server-side: trip-scoped collections use an `ownsTrip(tripId)` helper that reads the parent trip. Mirror this when adding new trip-scoped collections.

**Sorting is client-side**: most list queries (`getTrips`, `getSchedules`, `getDiaries`, `getSavedPlaces`) fetch with a single `where` and sort in JS, deliberately avoiding the need for composite indexes. The indexes in `firestore.indexes.json` exist but are not required by current queries — only add new indexes if you also add a Firestore `orderBy` in code.

**Cascade deletes**: `deleteTrip` deletes the trip's `schedules` and `diary` docs, but **not** its `tripItems`. If you add trip-scoped collections, extend `deleteTrip` accordingly.

### Pages and components

- `src/pages/` — one file per route. `TripDetailPage.jsx` (~107 KB) and `AddSchedulePage.jsx` (~34 KB) are large catch-all pages; understand the existing section structure before adding to them rather than threading new state through the whole file.
- `src/components/{common,layout,maps,schedule,trip}/` — shared UI. `common/` has `Modal`, `Toast`, `LoadingSpinner`, `EmptyState`. `layout/` has the shell pieces (`AppLayout`, `Sidebar`, `BottomNav`, `PageHeader`).
- `src/context/` — `AuthContext` (Firebase auth subscription) and `ThemeContext` (`light | dark | system`, persisted to `localStorage`; toggles `.dark`/`.light` classes on `<html>`).

### Styling

Single global stylesheet `src/styles/global.css` with CSS custom properties (`--c-surface`, `--r-lg`, `--shadow-sm`, `--t-fast`, etc.) for theming. Components use inline `style={{ ... }}` referencing these vars rather than CSS modules or Tailwind. Material Symbols Outlined icons are loaded via `<link>` in `index.html` — reference them with `<span className="material-symbols-outlined">icon_name</span>`.

### Constants and shared metadata

`src/constants/index.js` is the single source of truth for: schedule categories, trip emojis/styles, default checklist, diary moods/weathers, trip status labels, `ITEM_TYPES` + `ITEM_TYPE_META`, transport modes, `KAKAO_CATEGORY_MAP`, and `AIRPORTS` (with IANA timezones). Add new enum-like values here rather than inlining them.

### Place search and maps

`src/utils/placeSearch.js` is a hybrid search: Kakao Local for Korean queries (or when REST key is present), Nominatim for English/foreign queries, then merged and de-duplicated. `src/utils/kakaoMaps.js` lazy-loads the Kakao Maps JS SDK with `services` and `clusterer` libraries — call `loadKakaoMaps(apiKey)` and await before using `window.kakao.maps`.

### Time / timezone handling

Flight items store **local** datetime strings (`YYYY-MM-DDTHH:MM`) plus separate `departureTZ` / `arrivalTZ` IANA strings. `src/utils/timezoneUtils.js` converts these to UTC for duration math. Don't treat `departureTime`/`arrivalTime` as ISO instants — they're naive local times.

## Conventions

- Use the helpers in `src/firebase/firestore.js` and `src/utils/tripItemUtils.js` instead of constructing Firestore docs or item shapes by hand.
- Korean comments and UI strings are the norm; match the surrounding style.
- When adding a new trip-scoped collection: (1) helper in `firestore.js`, (2) `firestore.rules` block using `ownsTrip`, (3) cascade in `deleteTrip`, (4) index in `firestore.indexes.json` only if you need server-side ordering.
- Keep `vite.config.js` `base` and the GitHub Pages repo name in sync — changing one without the other breaks asset paths in production.
