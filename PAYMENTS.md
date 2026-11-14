# Premium setup — PayMongo (GCash · Maya · Card)

**Price:** ₱150 one-time, tied to the buyer's Google account. Pay once and Premium stays unlocked for good: no monthly fee, no auto-charge, no expiry. Users **must sign in with Google** to pay. It works on every device they sign in on, and offline at the venue. Someone who already paid can't be charged again (the Worker refuses a second checkout).

```
Buyer signs in with Google → taps "Bayaran · ₱150"
  → app asks the Worker for a checkout
  → Worker creates a PayMongo Checkout Session (price + secret key stay on the Worker)
  → buyer pays with GCash / Maya / card on PayMongo's page
  → PayMongo sends "checkout_session.payment.paid" to the Worker's /webhook
  → Worker checks the signature + amount (at least ₱150), unlocks that Google account for good (once per payment)
  → buyer lands back on the app (?paid=1), app polls /status and unlocks
```

All three services have free tiers that cover this. PayMongo charges a per-transaction fee on each sale; check their pricing page.

---

## 1. Firebase (done ✓) + admin test account
Google sign-in is connected (project `bidavibe`). The admin test account is set by fingerprint in `BIDA_CONFIG.adminHashes` — nothing to do in Firebase for it. It gets everything free, even before PayMongo is set up.

To change the admin: hash the new Gmail (lowercase) with SHA-256 and replace the value in `adminHashes` (and `DEFAULT_ADMIN_HASHES` in the Worker), or just ask for it to be updated.

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
   | `PRICE_CENTAVOS` | `15000` (₱150.00) |

   If you had added `PASS_DAYS` before, you can delete it: it isn't used anymore.

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
1. On the live site: sign in with a **non-admin** Google account → Account → **I-unlock ang Premium · ₱150 one-time** → **Bayaran · ₱150** → on PayMongo's test checkout pick GCash and authorize → you're sent back and Premium shows "Bayad na. Sa'yo na 'to for good."
2. When PayMongo activates your account:
   - Swap `PAYMONGO_SECRET_KEY` to `sk_live_…`.
   - Run the webhook command again with the live key.
   - Replace `PAYMONGO_WEBHOOK_SECRET` with the new `whsk_…`.

   The Worker picks the live or test signature automatically based on the key.

## Notes
- **Who's paid:** Cloudflare → KV → `bida-premium`. Each `pro:<uid>` entry has `lifetime: true`, `until` (9999-12-31 for one-time buyers), the payment date, amount, method and email. To refund/revoke, delete the entry or set `until` to 0.
- **Free without an account:** activities, all games, Live mode, the first 4 sound pads, 2 uploads and 2 recordings.
- **Test code:** `BIDATEST` only works on `localhost`.
- Security details and console settings: [SECURITY.md](SECURITY.md).
