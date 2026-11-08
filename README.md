# Bida-Vibe

Host buddy for Filipino family events and any group gathering — reunions, Christmas parties, birthdays, barkada nights, office parties, binyag, despedida, fiesta.

No build step, no npm. Open `index.html` or push to GitHub Pages.

## Files

| File | Purpose |
|---|---|
| `index.html` | Landing, app shell, Live mode, sheet, icon sprite |
| `bida.css` | Flat fiesta styles (no gradients), mobile + desktop (≥900px sidebar) |
| `bida-content.js` | Event types → suggested programs, Taglish host scripts by tone, 14 games |
| `worker/bida-pay-worker.js` | Cloudflare Worker: PayMongo checkout, webhook verification, Premium records (KV) |
| `bida-app.js` | State (`BIDA`, localStorage `bidavibe_data`), rendering, game animations, Sound Lab, music + talk fader, Live mode |

Custom sounds are stored in IndexedDB (`bidavibe_media`).

## Features

- **Event setup** — pick a type, get a timed program; add, edit, reorder segments.
- **Host script** — Formal / Serious / Friendly / Jolly checkboxes generate Taglish lines per segment; every line is editable.
- **Games** — animated SVG how-to, players, materials checklist, steps (with "Play steps"), host script, add to program.
- **Sound Lab** *(premium)* — 19 synthesized sounds (Web Audio, no copyrighted clips), upload, record your own. Keys 1–0, Q–P.
- **Music** *(premium)* — YouTube / YouTube Music, Spotify, local files, or link-out for other apps.
- **Talk fader** *(premium)* — quick fade down while you speak, fade back in after. Hold or toggle, duck level + fade speed sliders, optional mic auto-fade. Space bar works too.
- **Live Host Mode** — current segment, countdown, script, next up, music console, sound pads. Arrow keys to move.

## Before launch — `BIDA_CONFIG` in `bida-app.js`

- **Premium payments** — ₱149 one-time via PayMongo (GCash · Maya · Card), unlocked automatically on the buyer's Google account. Fill in `workerUrl` and `firebase` after following [PAYMENTS.md](PAYMENTS.md). Until then the upgrade button says payments are coming soon.
- `devUnlockCode` — `BIDATEST`, works on localhost only.
- `spotifyClientId` — create an app at developer.spotify.com, add the page URL as a Redirect URI. Spotify notes:
  - Listeners need **Spotify Premium**.
  - Desktop browsers play inside the page (Web Playback SDK). Phones control the Spotify app that's already open (Spotify Connect); some devices ignore remote volume.
  - New Spotify apps start in development mode (allow-listed users only) until you apply for extended quota.

Apple Music, Deezer, SoundCloud etc. don't give other websites volume control, so they're link-out only (no fade).
