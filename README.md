# Bida-Vibe

Simple but powerful host buddy for Filipino family events and any group gathering â€” reunions, Christmas parties, birthdays, barkada nights, office parties, binyag, despedida, fiesta.

No build step, no npm. Open `index.html` or push to GitHub Pages.

## Files

| File | Purpose |
|---|---|
| `index.html` | Landing, app shell, music bar, Live mode, sheet, icon sprite |
| `bida.css` | Flat fiesta styles (no gradients). Phone < 600px Â· tablet 600â€“1099px (touch-first, bottom tabs) Â· desktop â‰¥ 1100px (sidebar) |
| `bida-content.js` | Event types â†’ suggested activities, 14 party games |
| `bida-app.js` | State (`BIDA`, localStorage `bidavibe_data`), Plan, game animations, sound pads, music + fades, accounts, Live mode |
| `sounds/` | The 20 default sound pad files â€” see [sounds/README.md](sounds/README.md) for exact names |
| `worker/bida-pay-worker.js` | Cloudflare Worker: PayMongo checkout, webhook verification, Premium + admin check |

Custom sounds are stored in IndexedDB (`bidavibe_media`).

## Features

- **Plan** â€” pick the event type, get a timed activity list. Tap to edit, arrows to reorder, quick-add common activities or a game.
- **Games** â€” 14 Pinoy party games with animated how-to, materials checklist and steps.
- **Sound pads** â€” 20 default sounds from `sounds/` + upload or record your own. Keys 1â€“0, Qâ€“P.
- **Music bar (always on screen)** â€” play / pause, previous / next, **Fade out / Fade in**, volume, **Talk** (hold to lower the music while you speak), and an expandable panel with the YouTube preview and what's up next. Space bar = Talk.
- **Music tab** â€” setup only: YouTube / YouTube Music, Spotify, local files, link-out; talk mode, how low Talk goes, fade speed, mic auto-fade.
- **Live mode** â€” current activity + timer, game materials and steps, what's next, sound pads, with the music bar underneath.

## Free vs Premium

| | Free | Premium (â‚±149 one-time) |
|---|---|---|
| Plan, games, Live mode | âœ“ | âœ“ |
| Default sound pads | first 4 | all 20 |
| Own uploads | 2 | unlimited |
| Recordings (max 3s each) | 2 | unlimited |
| Music bar, Talk, Fade | â€” | âœ“ |

**Admin:** `morphiicreate@gmail.com` gets everything free after signing in with Google (account button in the header). The app checks the Google-verified email, and the Worker checks it again server-side against `ADMIN_EMAILS`, so nobody can claim admin by editing the browser.

## Before launch â€” `BIDA_CONFIG` in `bida-app.js`

- `firebase` â€” Google sign-in config (needed for **admin login** and for buyers). See PAYMENTS.md step 2.
- `workerUrl` â€” the payments Worker. See [PAYMENTS.md](PAYMENTS.md).
- `adminEmails`, `freeSounds` (4), `freeUploads` (2), `priceLabel`.
- `devUnlockCode` â€” `BIDATEST`, works on localhost only.
- `spotifyClientId` â€” create an app at developer.spotify.com, add the page URL as a Redirect URI. Listeners need Spotify Premium; phones control the Spotify app that's already open.

Apple Music, Deezer, SoundCloud etc. don't give other websites volume control, so they're link-out only (no fade).
