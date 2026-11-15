# Bida-Vibe security and legal audit (November 15, 2026)

Scope: the host app (`index.html`, `bida-app.js`), the guest page (`sing.html`), the phone remote (`remote.html`), Firestore rules, the payment Worker, and the whole git history (127 commits).

Bida-Vibe is a static site on GitHub Pages. It has no server pages, no SQL database, no cookies and no npm packages. It signs people in with Google (Firebase), stores temporary guest and remote data in Firestore, and handles payments through a Cloudflare Worker with PayMongo.

## Checklist results

| # | Item | Result |
|---|---|---|
| 1 | Real login, hashed passwords | **N/A, already safe.** Google sign-in only, so no passwords are stored anywhere. Admin is a SHA-256 fingerprint of a verified Google email, re-checked on the server. |
| 2 | API keys on the server, never in the browser | **Pass.** The PayMongo secret key and webhook secret live only as Cloudflare secrets. The Firebase web key is public by design: the database rules protect the data, not the key. The admin's GitHub token is stored in Firestore and only the admin can read it. |
| 3 | Database locked to each user's own data | **Fixed and improved.** Hosts can only change their own rooms and remotes, and lists are blocked. **New:** a closed or expired room or remote can now only be read by its host. **New:** closing a guest link or remote now deletes it, including guests' names and selfies. Before, it was only marked closed and stayed readable by anyone who had the link. |
| 4 | HTTPS everywhere | **Pass, plus a setting for you.** GitHub Pages serves HTTPS. All pages now add `upgrade-insecure-requests`. Turn on "Enforce HTTPS" in GitHub Pages settings (see SECURITY.md). |
| 5 | Check every form on the server | **Pass.** Firestore rules check every field guests and the remote send. The TV app re-checks every remote command. The Worker checks tokens, the price and payments. |
| 6 | Block XSS | **Pass, one item hardened.** All user and YouTube text is escaped before it's shown. Saved data is re-validated on load. Inline handlers only use numbers or validated ids. **New:** the remote's Henyo buttons no longer put text inside inline JavaScript. **New:** every page sets a security header (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`). |
| 7 | SQL injection | **N/A.** No SQL anywhere. Firestore is queried by document id only. |
| 8 | Rate-limit logins | **N/A for logins** (Google handles that). **New:** one checkout per account per minute on the payment server. |
| 9 | CSRF protection | **N/A.** No cookies. The Worker needs a Google sign-in token in a header and only answers the app's own website (CORS allowlist). |
| 10 | Secure session cookies | **N/A.** No cookies. Firebase keeps its own sign-in token. |
| 11 | Expiring password-reset links | **N/A.** No passwords (Google sign-in). |
| 12 | Limit file uploads | **Pass, one limit added.** Sound pads: real audio only, 3 seconds, 500 KB, checked on the server. Card background: images only, 25 MB, device only. Selfies: camera only, max 16,000 characters, enforced by the rules. **New:** own music files are audio only, max 50 MB each, device only. |
| 13 | Lock admin pages | **Pass.** Admin needs a verified Google sign-in matching the fingerprint, checked by the rules and the Worker. Library saves go through a token only the admin can read. |
| 14 | Recheck prices on the server | **Pass, improved.** The price is set on the server and the browser never sends an amount. **New:** payments must be in PHP. **New:** signed payment notices older than 3 days are refused as replays. **New:** processed payments are remembered permanently, so none can ever count twice. |
| 15 | Debug mode off | **Pass.** No debug logging. The test unlock code only works on `localhost`, never on the live site. |
| 16 | Update risky packages, delete unused | **Pass.** No npm. Firebase 10.7.1 and qrcode-generator 1.4.4 are pinned with integrity hashes. Every file in the repo is used. **New:** `.gitignore` blocks secret files (`.env`, keys) from ever being committed. |
| 17 | Scan git history for leaked keys | **Pass.** All 127 commits searched for GitHub tokens, PayMongo keys and webhook secrets, private keys, AWS and Slack keys, and Google keys. The only match is the public Firebase web key. Nothing to replace. |

## Tests run

- **Worker, payments:** 21 existing checks pass. They include forged webhooks, underpayment, double charges, tampered and wrong-project tokens, admin rules and old passes. Plus 6 new checks, all passing:
  - A 5-day-old signed webhook is refused.
  - A USD payment doesn't unlock.
  - A PHP ₱150 payment does unlock.
  - A 2nd checkout within a minute gets "slow down" and nothing is sent to PayMongo.
  - Processed payments are kept.
  - Replies carry `nosniff` and `no-store`.
- **Worker, sound pads:** 25/25 pass.
- **Remote state:** checked against Firestore's rules for data shape (no arrays inside arrays, no undefined) after last week's bug.
- **Browser:**
  - The host app, guest page and legal page load with the new security header. Nothing is blocked, and Firebase loads with its integrity check.
  - The legal page fits a 375 px phone with no sideways scroll, and all section links work.
  - The legal links appear on the landing page, in the sign-in, checkout and account sheets, and on the guest page.
  - The YouTube tip no longer suggests ad-blocking.
- **Not testable here:** the updated Firestore rules (they must be published in the Firebase console), and a real PayMongo payment.

## Legal pages added (`legal.html`)

- **Terms of Use:**
  - Age rules.
  - Premium (₱150 one-time, tied to the Google account).
  - Content you add.
  - Acceptable use.
  - Music licensing at public or business events (for example FILSCAP).
  - Disclaimers.
  - A liability cap of ₱150.
  - Indemnity.
  - Philippine law.
- **Privacy Policy (Data Privacy Act, RA 10173):**
  - A table of exactly what's collected, where, why and for how long.
  - What's never collected (microphone audio, camera, payment details).
  - The services used.
  - Rights.
  - The National Privacy Commission.
  - A contact.
- **Refund Policy:** only for charge errors (double charge, paid but not unlocked, wrong amount), within 30 days. Consumer-law rights are kept.
- **YouTube and music:** YouTube Terms of Service, Google Privacy Policy, Google permissions page, and "not affiliated / we don't host or copy videos". Required by YouTube's API terms.
- **Copyright takedowns (RA 8293)** and **Game safety** (supervision, allergies, balloons).
- **Consent shown where it matters:** before sign-in, before paying, and to guests before they send a name or selfie.

## Things you need to do (outside the code)

1. **Publish the new `firestore.rules`** (Firebase → Firestore → Rules → paste → Publish). Without this, closed guest links are deleted by the app, but the "only while open" read rule isn't active.
2. **Turn on auto-delete (Firestore TTL)** for `vk_rooms` and `vk_remotes` on the `expires` field, so links nobody closed are deleted too. Steps are in SECURITY.md.
3. **When the Worker is deployed**, use this version (it has the new payment checks).
4. **GitHub Pages → Enforce HTTPS**; **GitHub → secret scanning + push protection**; **restrict the Firebase web key** to your site. Steps are in SECURITY.md.

## Known limits (honest)

- **YouTube music player size:** YouTube's API rules say the player must be visible (at least 200×200) and not used for audio only. The music player sits in the music bar's preview, which can be collapsed while music keeps playing. Keeping a visible video preview while music plays would be safest. This is a product decision, so it's flagged here rather than changed silently.
- **Client-side free limits** (5 music songs, 5 files, uploads, Talk/Fade) run on the visitor's own device and can't be made hack-proof. Payments, Premium sounds, admin and library changes are all server-enforced.
- **Not legal advice:** these pages follow common practice and Philippine law as I understand it, but a Philippine lawyer should review them before you rely on them, especially once you register a business for PayMongo live payments.
