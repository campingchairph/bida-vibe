# Bida-Vibe

Simple but powerful host buddy for Filipino family events and any group gathering — reunions, Christmas parties, birthdays, barkada nights, office parties, binyag, despedida, fiesta.

No build step, no npm. Open `index.html` or push to GitHub Pages.

## Files

| File | Purpose |
|---|---|
| `index.html` | Landing, app shell, music bar, Live mode, sheet, icon sprite |
| `bida.css` | Flat fiesta styles (no gradients). Phone < 600px · tablet 600–1099px (touch-first, bottom tabs) · desktop ≥ 1100px (sidebar) |
| `bida-content.js` | Event types → suggested activities, 26 party games (12 credited to Dig the Games) |
| `bida-app.js` | State (`BIDA`, localStorage `bidavibe_data`), Plan, game animations, sound pads, music + fades, accounts, Live mode |
| `sounds/` | The 20 default sound pad files — see [sounds/README.md](sounds/README.md) for exact names |
| `worker/bida-pay-worker.js` | Cloudflare Worker: PayMongo checkout, webhook verification, Premium + admin check |

Custom sounds are stored in IndexedDB (`bidavibe_media`).

## Features

- **Plan** — pick the event type, get a timed activity list. Notes on each activity, check them off as done; the next one is bigger and highlighted. Tap to edit, arrows to reorder.
- **Games** — 26 party games with animated how-to, materials checklist and steps. 12 come from [Dig the Games](https://digthegames.com) (@digthegames), rewritten in Taglish and credited with a link.
- **Sound pads** — 20 default sounds from `sounds/` + upload or record your own (recordings stop at 3 seconds). Keys 1–0, Q–P.
- **Music bar (always on screen)** — play / pause, previous / next, **Fade out / Fade in**, volume, **Talk** (hold to lower the music while you speak), and an expandable panel with the YouTube preview and what's up next. Space bar = Talk. Talk timing: how fast it drops, optional wait, how fast it comes back; Fade button length. Sound pads play on top of the music (no ducking), and the music only stops when the host presses Pause or Fade out.
- **Music tab** — setup only: YouTube / YouTube Music, Spotify, local files, link-out; talk mode, how low Talk goes, fade speed, mic auto-fade.
- **Live mode** — current activity + timer, game materials and steps, what's next, sound pads, with the music bar underneath.

## Free vs Premium

| | Free | Premium (₱50 / 30 days, sign-in required, no auto-charge) |
|---|---|---|
| Plan, games, Live mode | ✓ | ✓ |
| Default sound pads | first 4 | all 20 |
| Own uploads | 2 | unlimited |
| Recordings (max 3s each) | 2 | unlimited |
| Music bar, Talk, Fade | — | ✓ |

**Admin test account:** set by a SHA-256 fingerprint of its Google email in `BIDA_CONFIG.adminHashes` (the email itself is never in the code). Signing in with that verified Google account unlocks everything free; the Worker re-checks it. See [SECURITY.md](SECURITY.md).

## Before launch — `BIDA_CONFIG` in `bida-app.js`

- `firebase` — Google sign-in config (needed for **admin login** and for buyers). See PAYMENTS.md step 2.
- `workerUrl` — the payments Worker. See [PAYMENTS.md](PAYMENTS.md).
- `price` / `passDays` (display only — the Worker sets the real price), `freeSounds` (4), `freeUploads` (2), `freeRecordings` (2), `recordMaxSec` (3).
- `firestore.rules` — publish in the Firebase Console.
- `devUnlockCode` — `BIDATEST`, works on localhost only.
- `spotifyClientId` — create an app at developer.spotify.com, add the page URL as a Redirect URI. Listeners need Spotify Premium; phones control the Spotify app that's already open.

Apple Music, Deezer, SoundCloud etc. don't give other websites volume control, so they're link-out only (no fade).
