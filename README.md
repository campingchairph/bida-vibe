# Bida-Vibe

Simple but powerful host buddy for Filipino family events and any group gathering — reunions, Christmas parties, birthdays, barkada nights, office parties, binyag, despedida, fiesta.

No build step, no npm. Open `index.html` or push to GitHub Pages.

## Files

| File | Purpose |
|---|---|
| `index.html` | Landing, app shell, music bar, Live mode, sheet, icon sprite |
| `bida.css` | Flat fiesta styles (no gradients). Phone < 600px · tablet 600–1099px (touch-first, bottom tabs) · desktop ≥ 1100px (sidebar) |
| `bida-content.js` | Event types → suggested activities, 40 party games (26 credited to Dig the Games) |
| `bida-app.js` | State (`BIDA`, localStorage `bidavibe_data`), Plan, game animations, sound pads, music + fades, accounts, Live mode |
| `sounds/free/` | Temporary free pads until the Worker is set up — see [sounds/README.md](sounds/README.md) |
| `worker/bida-pay-worker.js` | Cloudflare Worker: PayMongo checkout, webhook verification, Premium + admin check, sound-pad storage (admin-only upload) |

Custom sounds are stored in IndexedDB (`bidavibe_media`).

## Features

- **Plan** — pick the event type, get a timed activity list. Notes on each activity, check them off as done; the next one is bigger and highlighted. Tap to edit, arrows to reorder.
- **Games** — 40 party games with animated how-to, materials checklist and steps. 26 come from [Dig the Games](https://digthegames.com) (@digthegames), rewritten in Taglish and credited with a link.
- **Sound pads** — uploaded by the admin in the app (Sounds → Admin: Sound manager), stored on the Worker: up to 8 **free** pads for everyone + **Premium** pads the server only sends to pass holders/admin. Pad name = file name. Users can also add 2 sounds of their own on their device. Keys 1–0, Q–P. (Before the Worker is set up, free pads can come from `sounds/free/`.)
- **Music bar (always on screen)** — play / pause, previous / next, **Fade out / Fade in**, volume, **Talk** (hold to lower the music while you speak), and an expandable panel with the YouTube preview and what's up next. Space bar = Talk. Sound pads play on top of the music (no ducking), and the music only stops when the host presses Pause or Fade out.
- **Talk settings (only three)** — how low the volume goes, how fast (same speed down and back up), and a checkbox "music returns after talking" (checked = hold Talk, music comes back when released; unchecked = tap Talk to lower, tap again to bring it back).
- **YouTube links** — save several links (5 free, more with Premium); titles and thumbnails load automatically. With 2+ links a floating **Playlist** button lets the host jump to any of them. A single video that ends moves on to the next saved link; Next/Previous also move between links.
- **Music tab** — setup: YouTube / YouTube Music, Spotify, local files, link-out; Talk settings; mic auto-fade. Includes a tip to use Brave, whose Shields usually block YouTube ads.
- **Mic help** — if the mic is blocked, the app shows how to allow it for that phone/browser (iPhone Safari, iPhone Chrome/Brave, Android Chrome/Brave, desktop, and in-app browsers like Facebook/Messenger/TikTok), with a "Try again" button.
- **Live mode** — current activity + timer, game materials and steps, what's next, sound pads, with the music bar underneath.

## Free vs Premium

| | Free | Premium (₱50 / 30 days, sign-in required, no auto-charge) |
|---|---|---|
| Plan, games, Live mode | ✓ | ✓ |
| Free pads (admin uploads, max 8) | ✓ | ✓ |
| Premium pads (admin uploads) — sent only by the server | — | ✓ |
| Own uploads | 2 | unlimited |
| YouTube links in the music bar | 5 | unlimited |
| Spotify, own music files | — | ✓ |
| Talk, Fade in/out, mic auto-fade | — | ✓ |

**Admin test account:** set by a SHA-256 fingerprint of its Google email in `BIDA_CONFIG.adminHashes` (the email itself is never in the code). Signing in with that verified Google account unlocks everything free; the Worker re-checks it. See [SECURITY.md](SECURITY.md).

## Before launch — `BIDA_CONFIG` in `bida-app.js`

- `firebase` — Google sign-in config (needed for **admin login** and for buyers). See PAYMENTS.md step 2.
- `workerUrl` — the payments Worker. See [PAYMENTS.md](PAYMENTS.md).
- `price` / `passDays` (display only — the Worker sets the real price), `freeSounds` (4), `freeUploads` (2), `freeRecordings` (2), `recordMaxSec` (3).
- `firestore.rules` — publish in the Firebase Console.
- `devUnlockCode` — `BIDATEST`, works on localhost only.
- `spotifyClientId` — create an app at developer.spotify.com, add the page URL as a Redirect URI. Listeners need Spotify Premium; phones control the Spotify app that's already open.

Apple Music, Deezer, SoundCloud etc. don't give other websites volume control, so they're link-out only (no fade).
