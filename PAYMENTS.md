# Premium setup — PayMongo (GCash · Maya · Card)

**Price:** ₱50 for 30 days, tied to the buyer's Google account. There's no auto-charge: paying again adds another 30 days (from the end date if still active). Users **must sign in with Google** to subscribe. It works on every device they sign in on, and offline at the venue until the end date.

```
Buyer signs in with Google → taps "Bayaran · ₱50"
  → app asks the Worker for a checkout
  → Worker creates a PayMongo Checkout Session (price + secret key stay on the Worker)
  → buyer pays with GCash / Maya / card on PayMongo's page
  → PayMongo sends "checkout_session.payment.paid" to the Worker's /webhook
  → Worker checks the signature + amount, adds 30 days to that Google account (once per payment)
  → buyer lands back on the app (?paid=1), app polls /status and unlocks until the end date
```

All three services have free tiers that cover this. PayMongo charges a per-transaction fee on each sale; check their pricing page.

---

## 1. Firebase (done ✓) + admin test account
Google sign-in is connected (project `bidavibe`). Two more steps in the Firebase Console:

1. **Firestore Database → Rules**: paste [`firestore.rules`](firestore.rules) → **Publish**.
2. **Firestore Database → Data → Start collection** `admins` → **Document ID** = the Google email in lowercase, e.g. `morphiicreate@gmail.com`. Add any field (e.g. `note` = `test account`) → Save.

That account now gets everything free, even before PayMongo is set up. To add another tester, add another document; to remove one, delete it.

## 2. PayMongo
1. Sign up at **dashboard.paymongo.com**. Test mode works right away. Live payments need account activation (they'll ask for ID and business details).
2. **Developers → API Keys**: copy the **test secret key** (`sk_test_…`). Never put it in the app's code.

## 3. Cloudflare Worker (free plan, no card needed)
1. dash.cloudflare.com → **Workers & Pages → Create → Create Worker** → name it `bida-pay` → Deploy → **Edit code**.
2. Replace everything with the contents of [`worker/bida-pay-worker.js`](worker/bida-pay-worker.js) → **Deploy**. Note the URL, e.g. `https://bida-pay.<you>.workers.dev`.
3. **Storage & Databases → KV → Create** a namespace called `bida-premium`.
4. Worker → **Settings → Bindings → Add → KV namespace**: variable name **`PREMIUM`**, namespace `bida-premium`.
5. Worker → **Settings → Variables and Secrets** (add as *Text*):

   | Name | Value |
   |---|---|
   | `FIREBASE_PROJECT_ID` | `bidavibe` |
   | `APP_URL` | `https://campingchairph.github.io/bida-vibe/` (keep the trailing `/`) |
   | `ALLOWED_ORIGINS` | `https://campingchairph.github.io,http://localhost:8102` |
   | `PRICE_CENTAVOS` | `5000` (₱50.00) |
   | `PASS_DAYS` | `30` |

   And as *Secret*: `PAYMONGO_SECRET_KEY` = your `sk_test_…` key.

## 4. PayMongo webhook
PayMongo creates webhooks through its API. Run this once in Git Bash, with your secret key and Worker URL filled in:

```bash
curl https://api.paymongo.com/v1/webhooks -u "sk_test_YOURKEY:" -H "Content-Type: application/json" -d '{"data":{"attributes":{"url":"https://bida-pay.YOU.workers.dev/webhook","events":["checkout_session.payment.paid"]}}}'
```

The response contains `"secret_key": "whsk_…"`. Add it to the Worker as a *Secret* named **`PAYMONGO_WEBHOOK_SECRET`**.

## 5. Connect the app
In `bida-app.js`, set `BIDA_CONFIG.workerUrl: 'https://bida-pay.YOU.workers.dev'` and push.

## 6. Test, then go live
1. On the live site: sign in with a **non-admin** Google account → Sounds → I-unlock lahat → **Bayaran · ₱50** → on PayMongo's test checkout pick GCash and authorize → you're sent back and Premium shows "Hanggang <date 30 days from now>".
2. When PayMongo activates your account:
   - Swap `PAYMONGO_SECRET_KEY` to `sk_live_…`.
   - Run the webhook command again with the live key.
   - Replace `PAYMONGO_WEBHOOK_SECRET` with the new `whsk_…`.

   The Worker picks the live or test signature automatically based on the key.

## Notes
- **Who's paid:** Cloudflare → KV → `bida-premium`. Each `pro:<uid>` entry has `until` (end date in ms), last payment, amount, method and email. To refund/revoke, delete it or set `until` to 0.
- **Free without an account:** activities, all games, Live mode, the first 4 sound pads, 2 uploads and 2 recordings.
- **Test code:** `BIDATEST` only works on `localhost`.
- Security details and console settings: [SECURITY.md](SECURITY.md).
