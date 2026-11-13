# Bida-Vibe security notes

Bida-Vibe is a static site (GitHub Pages). Anything that runs in the browser can be changed by the person using it, so **the browser is never the lock**. The locks are:

- **Firestore rules** (`firestore.rules`) for who is an admin.
- **The Cloudflare Worker** (`worker/bida-pay-worker.js`) for who has paid, and until when.

## What protects what

| Area | How |
|---|---|
| Admin test accounts | A SHA-256 fingerprint of the admin's Google email is in the code, never the email itself. Admin is given only after a Google sign-in whose email Google has **verified** hashes to that fingerprint, so knowing or guessing the email isn't enough: you need the actual Google account. The Worker repeats the same check server-side. Optional extra admins via Firestore `admins/{email}`: the rules let a verified user read **only their own** doc. |
| Premium (₱50 / 30 days) | Decided by the Worker only. Price and days are set server-side (`PRICE_CENTAVOS`, `PASS_DAYS`); the browser never sends an amount. |
| Payments | PayMongo hosted checkout. The PayMongo secret key lives only in the Worker as a Cloudflare secret. |
| Payment confirmations | Webhook HMAC signature checked (constant-time compare). The amount must be at least the price. Each checkout session can add days only once, so retries and replays don't stack. |
| Sign-in tokens | The Worker verifies Firebase ID tokens itself: RS256 signature against Google's keys, expiry, audience and issuer = project `bidavibe`. |
| Cross-site calls | The Worker only answers browsers from `ALLOWED_ORIGINS` (CORS). |
| Passwords, sessions, throttling | Firebase Auth (Google sign-in). No passwords or cookies of our own. |
| Output escaping | Everything typed by a user (event name, activity titles, sound names) is escaped before it's shown. Stored data is re-validated on load: activity ids/minutes must be numbers, kinds/games must be known, sound ids must match a strict pattern. |
| Third-party scripts | Firebase scripts are pinned to `10.7.1` with SRI `integrity` hashes. YouTube and Spotify players load only when the user picks that source. |
| Clickjacking | The page blanks itself if another site loads it inside a frame. |
| Secrets in code | Only public-by-design values (Firebase web config). Nothing else. |
| Offline use | A cached Premium pass still ends on its end date, even with no internet. It only counts while the same Google account that paid is signed in. |
| Admin sound upload (GitHub mode) | Same model as Morphii. The GitHub token lives in Firestore `bida_secrets/github`. The rules allow read/write **only** for a Google sign-in with a verified email whose SHA-256 matches the admin fingerprint (no email in the rules file). The token is held in memory only, never in browser storage, and is forgotten on sign-out. Scope it to *this repo, Contents read/write, 90-day expiry*. Files are checked to be real audio, names are cleaned, and the extension is forced to audio. |
| Sound pads | (Worker mode) Stored on the Worker (KV), not in the public repo. Free pads: anyone. Premium pads: the server sends the audio only to a verified Google sign-in with an active pass, or admin. Upload / rename / re-tier / delete: admin only, re-verified on every request (signature, project, expiry, Google provider, verified email, fingerprint). Uploads are checked by their bytes (must really be mp3/wav/ogg/m4a/webm, max 500 KB and 3 seconds), names are cleaned, and audio is served with `nosniff` + a locked-down CSP. Tested: no sign-in, normal user, paying user, unverified admin email, non-Google sign-in, tampered token, HTML disguised as audio, oversize file, 9th free pad, expired pass — all refused. |
| Videoke guest link (`sing.html`) | Each link is a Firestore room `vk_rooms/{24 random characters}` owned by the signed-in host, open for 48 hours (rules cap it at 3 days). Guests don't sign in and can do only two things: read that one room's queue (names, avatars, song titles) and **add** a song request with strictly checked fields to an open, unexpired room. Rooms can't be listed, so links can't be guessed or browsed. Only the host can read or delete requests and change the room; closing the link stops new requests at once. The host app accepts a request only if its code **and** YouTube ID match a song in the library, so a guest can't push their own video onto the TV. The guest page has a per-device cooldown and cap; that part is client-side only. |
| Tampering with saved data | Nothing in browser storage can grant access by itself. Admin comes only from this session's verified Google sign-in (Google provider, verified email, fingerprint match), never from storage. Editing local storage to say "admin" or "premium" does nothing (tested). |

Not applicable here: SQL injection, CSRF, session cookies, password hashing, server debug mode, npm packages (no server pages, no cookies, no npm).

**What can't be hack-proof (any website):** features that run entirely on the visitor's own phone, such as the Talk/Fade volume control, the 5-link YouTube limit and the 2 personal uploads. The phone runs that code, so someone who rewrites the app's JavaScript could change them on their own device. Editing saved data or clicking around in Inspect Element doesn't unlock them, but a determined programmer could. What they can never do: get Premium sounds, upload or change sounds, fake a payment, or become admin. All of that is decided by the server.

## Console-side settings (can't be done from code)

1. **Firestore rules**: Firebase Console → Firestore Database → Rules → paste `firestore.rules` → **Publish**.
   - In the Rules Playground, **ALLOW** a `get` of `admins/<your email>` while signed in as you.
   - **DENY** a `get` of someone else's doc, any `list`, and any write.
2. **Admin accounts**: the main admin is a SHA-256 fingerprint of the Google email in `BIDA_CONFIG.adminHashes` (and the Worker's `DEFAULT_ADMIN_HASHES` / `ADMIN_EMAIL_HASHES`). The email itself is never in the code. Optional extra admins: Firestore → `admins` collection → document ID = the Google email in lowercase.
3. **Restrict the Firebase API key**: Google Cloud Console → APIs & Services → Credentials → the "Browser key" → HTTP referrers:
   - `https://campingchairph.github.io/*`
   - `http://localhost:*` for testing
   - API restrictions: Identity Toolkit API, Token Service API, Cloud Firestore API.
4. **Firebase Auth → Settings → Authorized domains**: keep only `campingchairph.github.io` and `localhost`.
5. **App Check** (optional, reCAPTCHA v3): turn on *monitoring* for Firestore first, then enforce.
6. **GitHub Pages**: Settings → Pages → **Enforce HTTPS**.
7. **GitHub**: Settings → Code security → enable **secret scanning** and **push protection**.
8. **Cloudflare**: keep `PAYMONGO_SECRET_KEY` and `PAYMONGO_WEBHOOK_SECRET` as *Secrets* (encrypted), never as plain variables.

## When something changes
- **Rules change**: edit `firestore.rules`, paste it into the Console, Publish, and re-run the Playground checks above.
- **Price or pass length change**: Worker variables `PRICE_CENTAVOS` / `PASS_DAYS` **and** `price` / `passDays` in `BIDA_CONFIG` (display only).
- **Firebase scripts upgraded**: recompute the SRI hashes in `index.html`.
