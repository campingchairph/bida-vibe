# Bida-Vibe security notes

Bida-Vibe is a static site (GitHub Pages). Anything that runs in the browser can be changed by the person using it, so **the browser is never the lock**. The locks are:

- **Firestore rules** (`firestore.rules`) for who is an admin.
- **The Cloudflare Worker** (`worker/bida-pay-worker.js`) for who has paid, and until when.

## What protects what

| Area | How |
|---|---|
| Admin test accounts | A SHA-256 fingerprint of the admin's Google email is in the code, never the email itself. Admin is given only after a Google sign-in whose email Google has **verified** hashes to that fingerprint, so knowing or guessing the email isn't enough: you need the actual Google account. The Worker repeats the same check server-side. Optional extra admins via Firestore `admins/{email}`: the rules let a verified user read **only their own** doc. |
| Premium (₱150 one-time) | Decided by the Worker only. The price is set server-side (`PRICE_CENTAVOS`); the browser never sends an amount. Payments below the price don't unlock, and an account that already paid can't open a second checkout. |
| Payments | PayMongo hosted checkout. The PayMongo secret key lives only in the Worker as a Cloudflare secret. |
| Payment confirmations | Webhook HMAC signature checked (constant-time compare), and the signed timestamp must be recent (older deliveries are refused as replays). The amount must be at least the price **in PHP**. Each checkout session is recorded for good, so retries and replays can never count twice. |
| Checkout abuse | One new checkout per account per minute (KV rate limit); signed-in users only. |
| Sign-in tokens | The Worker verifies Firebase ID tokens itself: RS256 signature against Google's keys, expiry, audience and issuer = project `bidavibe`. |
| Cross-site calls | The Worker only answers browsers from `ALLOWED_ORIGINS` (CORS). |
| Passwords, sessions, throttling | Firebase Auth (Google sign-in). No passwords or cookies of our own. |
| Output escaping | Everything typed by a user (event name, activity titles, sound names) is escaped before it's shown. Stored data is re-validated on load: activity ids/minutes must be numbers, kinds/games must be known, sound ids must match a strict pattern. |
| Third-party scripts | Firebase (`10.7.1`) and the QR library (`qrcode-generator 1.4.4`) are pinned with SRI `integrity` hashes. In the host app, Firebase loads in the background after the page is usable (`FB_SDK` in `bida-app.js`). YouTube and Spotify players load only when used (their official loaders can't be pinned). No npm packages. |
| Browser security headers | Every page sets a CSP meta (`object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`), a referrer policy and the anti-framing script. |
| Clickjacking | The page blanks itself if another site loads it inside a frame. |
| Secrets in code | Only public-by-design values (Firebase web config). Nothing else. |
| Offline use | A cached Premium pass still ends on its end date, even with no internet. It only counts while the same Google account that paid is signed in. |
| Admin sound upload (GitHub mode) | Same model as Morphii. The GitHub token lives in Firestore `bida_secrets/github`. The rules allow read/write **only** for a Google sign-in with a verified email whose SHA-256 matches the admin fingerprint (no email in the rules file). The token is held in memory only, never in browser storage, and is forgotten on sign-out. Scope it to *this repo, Contents read/write, 90-day expiry*. Files are checked to be real audio, names are cleaned, and the extension is forced to audio. |
| Sound pads | (Worker mode) Stored on the Worker (KV), not in the public repo. Free pads: anyone. Premium pads: the server sends the audio only to a verified Google sign-in with an active pass, or admin. Upload / rename / re-tier / delete: admin only, re-verified on every request (signature, project, expiry, Google provider, verified email, fingerprint). Uploads are checked by their bytes (must really be mp3/wav/ogg/m4a/webm, max 500 KB and 3 seconds), names are cleaned, and audio is served with `nosniff` + a locked-down CSP. Tested: no sign-in, normal user, paying user, unverified admin email, non-Google sign-in, tampered token, HTML disguised as audio, oversize file, 9th free pad, expired pass — all refused. |
| Videoke guest link (`sing.html`) | Each link is a Firestore room `vk_rooms/{24 random characters}` owned by the signed-in host, open for 48 hours (rules cap it at 3 days). Guests don't sign in and can do only two things: read that one room's queue (names, avatars, song titles) and **add** a song request with strictly checked fields to an open, unexpired room. Rooms can't be listed, so links can't be guessed or browsed. Only the host can read or delete requests and change the room. **Closing the link deletes the room and any unread requests**, and the rules only show a room to guests while it's open and unexpired (the host can always read their own). The host app accepts a request only if its code **and** YouTube ID match a song in the library, so a guest can't push their own video onto the TV. The guest page has a per-device cooldown and cap; that part is client-side only. |
| Host remote (`remote.html`) | A Firestore doc `vk_remotes/{24 random characters}` owned by the signed-in host, open for 24 hours (rules cap it at 2 days). The phone can read that one doc (plan titles, pad names, videoke queue, music title) and **add** small commands in a fixed shape (`pad`, `stop`, `music`, `plan`, `vk`). The TV app reads each command, checks it against what the host's own buttons allow (premium pads stay locked, songs must be in the library, old commands are ignored), runs it and deletes it. Docs can't be listed, so the link can't be guessed. **Closing the remote deletes it**, and the rules only show it while it's open and unexpired. New controls (TV screen, game settings, music) all ride the existing `show` / `music` command shapes, and the TV re-checks every value. The link is the key: anyone holding it can control the TV until it expires or the host closes it, so it's for co-hosts only. |
| Singer selfies | Taken with the camera only (no file picker), cropped to 160×160 and sent as a small JPEG (rules: max 16,000 characters, `data:image/jpeg;base64` only). The photo travels with the song request and is shown in the queue on the TV, the guest page and the remote. It's removed from the room's queue once the song is done, and the request itself is deleted as soon as the TV picks it up. Anyone with the singers' link can see the queue photos while the link is open. |
| Card background photo | Kept only on the host's device (IndexedDB), resized to 1920px. Never uploaded. Images only, 25 MB max. |
| Own music files | Kept only on the host's device (IndexedDB). Audio only, 50 MB max per file. Never uploaded. |
| YouTube terms | YouTube Terms of Service and Google Privacy Policy are linked wherever videos play. Owner's choice: the music video sits in the music bar (hidden while collapsed), and hosts on non-Brave browsers see a one-time Brave suggestion. Both are noted as a YouTube-terms risk in SECURITY-AUDIT.md. |
| Legal | `legal.html`: Terms of Use, Privacy Policy (RA 10173), Refund Policy, YouTube and music notice, copyright takedowns (RA 8293), game safety. Linked from the landing page, sign-in, checkout, account and the guest page. |
| Tampering with saved data | Nothing in browser storage can grant access by itself. Admin comes only from this session's verified Google sign-in (Google provider, verified email, fingerprint match), never from storage. Editing local storage to say "admin" or "premium" does nothing (tested). |

Not applicable here: SQL injection, CSRF, session cookies, password hashing, server debug mode, npm packages (no server pages, no cookies, no npm).

**What can't be hack-proof (any website):** features that run entirely on the visitor's own phone, such as the Talk/Fade volume control, the 5 free music files and the 2 personal uploads. The phone runs that code, so someone who rewrites the app's JavaScript could change them on their own device. Editing saved data or clicking around in Inspect Element doesn't unlock them, but a determined programmer could. What they can never do: get Premium sounds, upload or change sounds, fake a payment, or become admin. All of that is decided by the server.

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
9. **Auto-delete forgotten links (Firestore TTL)**: Firebase Console → Firestore → **Time-to-live** → *Create policy*: collection group `vk_rooms`, timestamp field `expires`. Repeat for `vk_remotes`. Expired guest links and remotes (with singer names/selfies) are then deleted automatically even if the host never closed them.

10. **Google sign-in on iPhone/iPad/Safari** (needed because Safari blocks Firebase's cross-site sign-in helper for github.io sites):
   - Open a **private/incognito window** (so only one Google account is signed in), go to **console.cloud.google.com** and sign in with the Gmail that owns the Bida-Vibe Firebase project.
   - Top bar: project picker → choose **bidavibe**. Then the search bar at the top → type **Clients** → open **Clients (Google Auth Platform)**.
   - Click the client named **Web client (auto created by Google Service)**.
   - Under **Authorized JavaScript origins** add `https://campingchairph.github.io` (and `http://localhost:8102` for testing).
   - Under **Authorized redirect URIs** add `https://campingchairph.github.io/bida-vibe/` (and `http://localhost:8102/`). Save. Google says changes can take 5 minutes to a few hours.
   - Copy its **Client ID** (ends in `.apps.googleusercontent.com`; it's public, not a secret) into `BIDA_CONFIG.googleClientId` in bida-app.js.
   - How it works: on Apple browsers the app goes to Google itself (full page, `response_type=id_token`), comes back to this page, checks its own random `state` and `nonce`, removes the token from the address bar, then signs in to Firebase with `signInWithCredential`. Other browsers keep the popup and fall back to this if it fails. In-app browsers (Messenger, Facebook, TikTok) are asked to open Safari/Chrome, because Google blocks sign-in there.

11. **Custom domain `bida.vows-and-petals.com`** (do these in this order, or the site goes down while DNS catches up):
   1. **Cloudflare** (the DNS for vows-and-petals.com) → the domain → **DNS → Records → Add record**: Type `CNAME`, Name `bida`, Target `campingchairph.github.io`, Proxy status **DNS only** (grey cloud, so GitHub can issue the HTTPS certificate). Save.
   2. **Google Cloud → Credentials → Browser key** (step 3): add the referrer `https://bida.vows-and-petals.com/*`. Without it, sign-in and the remote stop working on the new address.
   3. **Firebase Auth → Settings → Authorized domains**: add `bida.vows-and-petals.com`.
   4. **Google Auth Platform → Clients → Web client** (step 10): add the origin `https://bida.vows-and-petals.com` and the redirect URI `https://bida.vows-and-petals.com/`.
   5. Only then add the file `CNAME` (one line: `bida.vows-and-petals.com`) to this repo and push. GitHub then sends the old github.io address to the new one automatically.
   6. **GitHub → bida-vibe → Settings → Pages**: wait for the DNS check to pass, then tick **Enforce HTTPS**.
   - Keep the old `campingchairph.github.io` entries for a while; they are harmless.
   - Browser data (playlists, scores, settings) is saved per address, so hosts start fresh on the new address. Premium comes back on sign-in because it belongs to the Gmail.

## When something changes
- **Rules change**: edit `firestore.rules`, paste it into the Console, Publish, and re-run the Playground checks above.
- **Price change**: Worker variable `PRICE_CENTAVOS` **and** `price` in `BIDA_CONFIG` (display only).
- **Firebase scripts upgraded**: recompute the SRI hashes in `FB_SDK` (bida-app.js), `sing.html` and `remote.html`.
- **Contact email or refund rule changes**: update `legal.html` (and the effective date).
