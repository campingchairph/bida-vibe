# Bida-Vibe security notes

Bida-Vibe is a static site (GitHub Pages). Anything that runs in the browser can be changed by the person using it, so **the browser is never the lock**. The locks are:

- **Firestore rules** (`firestore.rules`) for who is an admin.
- **The Cloudflare Worker** (`worker/bida-pay-worker.js`) for who has paid, and until when.

## What protects what

| Area | How |
|---|---|
| Admin test accounts | Firestore `admins/{email}` (doc ID = Google email, lowercase). Rules let a signed-in user with a **Google-verified** email read **only their own** doc; nobody can list or write. The app and the Worker both ask Firestore *as that user*. No admin emails are written in the site's code. |
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
| Offline use | A cached Premium pass still ends on its end date, even with no internet. A different Google account on the same device does not inherit the last user's unlock. |

Not applicable here: SQL injection, CSRF, session cookies, password hashing, server debug mode, npm packages (no server pages, no cookies, no npm).

Known limit: Premium features run in the browser, so a technical user could unlock them on their own device by editing local storage. That's normal for a static app. Payment records and admin status can't be faked.

## Console-side settings (can't be done from code)

1. **Firestore rules**: Firebase Console → Firestore Database → Rules → paste `firestore.rules` → **Publish**.
   - In the Rules Playground, **ALLOW** a `get` of `admins/<your email>` while signed in as you.
   - **DENY** a `get` of someone else's doc, any `list`, and any write.
2. **Admin docs**: Firestore → `admins` collection → document ID = the exact Google email in lowercase (e.g. `morphiicreate@gmail.com`). Fields don't matter (e.g. `note: "test account"`).
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
