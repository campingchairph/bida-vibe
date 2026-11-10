# Sound pads — how the admin uploads them

Uploads happen **inside the app** (same idea as Morphii's admin page). The app saves each file into `sounds/free/` in this GitHub repo, and GitHub Pages publishes it within about 1–2 minutes.

## One-time setup (about 5 minutes)

**1. Publish the Firestore rules**
- Firebase Console → **bidavibe** → **Databases & Storage → Firestore → Rules**.
- Replace everything with the contents of [`firestore.rules`](../firestore.rules) → **Publish**.

**2. Make a GitHub token** (lets the app save files to this repo)
- github.com → your profile picture → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
- **Repository access:** *Only select repositories* → `bida-vibe`.
- **Permissions → Repository permissions → Contents:** *Read and write*.
- **Expiration:** 90 days (you'll paste a new one when it expires).
- Generate, then copy the token (starts with `github_pat_`).

**3. Paste it in the app, once**
- Open Bida-Vibe → account icon → sign in with the admin Google account.
- **Sounds** → **Admin: Sound manager** → paste the token → **I-save**.

The token is stored in Firestore `bida_secrets/github`, which the rules let **only the admin** read. It is never saved in the browser.

## Uploading
**Sounds → Admin: Sound manager → Mag-upload**, then pick files (several at once is fine).
- **Pad name:** taken from the file name. You can rename later.
- **Arrows:** change the order.
- **Trash icon:** deletes for everyone.
- **Limits:** max **8** pads and **1.5 MB** each. Files must really be audio (mp3, wav, ogg, m4a, webm); anything else is refused.
- These pads are **free for everyone**. Premium-only sounds need the Cloudflare Worker (PAYMENTS.md), because files in this repo are public.