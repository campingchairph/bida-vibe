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

*(Menu names checked against Cloudflare's and PayMongo's docs on 2026-11-15. If a label looks different, the screenshot tells me where things moved.)*

## 2. PayMongo
1. Sign up at **dashboard.paymongo.com**. Test keys work right away, before any approval.
2. **Settings → Product Settings → Developers**: copy the **test secret key** (`sk_test_…`). Never put it in the app's code.
3. **For real money (live keys):** PayMongo only gives live keys to a **registered business type**: Sole Proprietor (DTI), Partnership, One Person Corporation or Corporation. An *Individual* account only sees test keys ("Live keys need a registered business type"). Upgrade under **Settings → Business information**; live keys appear once PayMongo approves it.

## 3. Cloudflare Worker (free plan, no card needed)
1. dash.cloudflare.com → **Workers & Pages → Create application → Start with Hello World! → Get started** → name it `bida-pay` → **Deploy**.
2. Open the Worker → **Edit Code** → replace everything in `worker.js` with the contents of [`worker/bida-pay-worker.js`](worker/bida-pay-worker.js) → **Deploy**. Note the URL, e.g. `https://bida-pay.<you>.workers.dev`.
3. **Workers KV → Create instance** → name it `bida-premium` → **Create**.
4. Back to the Worker → **Bindings** tab → **Add binding → KV namespace → Add binding**: Variable name **`PREMIUM`**, namespace `bida-premium` → **Add binding**.
5. Worker → **Settings → Variables and Secrets → Add** (Type: *Text*), then **Deploy**:

   | Name | Value |
   |---|---|
   | `FIREBASE_PROJECT_ID` | `bidavibe` |
   | `APP_URL` | `https://campingchairph.github.io/bida-vibe/` (keep the trailing `/`) |
   | `ALLOWED_ORIGINS` | `https://campingchairph.github.io,http://localhost:8102` |
   | `PRICE_CENTAVOS` | `15000` (₱150.00) |

   If you had added `PASS_DAYS` before, you can delete it: it isn't used anymore.

   And as Type *Secret*: `PAYMONGO_SECRET_KEY` = your `sk_test_…` key.

## 4. PayMongo webhook (tells the Worker "this person paid")
1. In the PayMongo dashboard open **Webhooks → Create Webhook**. Make sure the top bar says **Test Mode**.
2. **URL endpoint:** `https://bida-pay.<you>.workers.dev/webhook` · **Event:** `checkout_session.payment.paid` → **Create**.
3. Copy the webhook's secret key (starts with `whsk_`) and add it to the Worker as a *Secret* named **`PAYMONGO_WEBHOOK_SECRET`** → **Deploy**.

If the dashboard doesn't show a `whsk_` key, create the webhook with this one command in Git Bash instead; the reply contains `"secret_key": "whsk_…"`:

```bash
curl https://api.paymongo.com/v1/webhooks -u "sk_test_YOURKEY:" -H "Content-Type: application/json" -d '{"data":{"attributes":{"url":"https://bida-pay.YOU.workers.dev/webhook","events":["checkout_session.payment.paid"]}}}'
```

## 5. Connect the app
In `bida-app.js`, set `BIDA_CONFIG.workerUrl: 'https://bida-pay.YOU.workers.dev'` and push.

## 6. Test, then go live
1. On the live site: sign in with a **non-admin** Google account → Account → **Unlock Premium · ₱150 one-time** → **Bayaran · ₱150** → on PayMongo's test checkout pick GCash and authorize → you're sent back and Premium shows "Bayad na. Sa'yo na 'to for good."
2. When PayMongo approves your business and live keys appear:
   - Swap `PAYMONGO_SECRET_KEY` to `sk_live_…`.
   - Create the webhook again with the top bar on **Live Mode** (same URL and event).
   - Replace `PAYMONGO_WEBHOOK_SECRET` with the new live `whsk_…`.

   The Worker picks the live or test signature automatically based on the key.

## Notes
- **Who's paid:** Cloudflare → KV → `bida-premium`. Each `pro:<uid>` entry has `lifetime: true`, `until` (9999-12-31 for one-time buyers), the payment date, amount, method and email. To refund/revoke, delete the entry or set `until` to 0.
- **Free without an account:** activities, all games and game tools, the first sound pads, 2 sound uploads, 5 songs from the music library, 5 own music files (saved on the device only) and 20 videoke songs (unlimited plays). The app never shows these numbers; it only asks for Premium when someone reaches a limit. Everything else unlocks with the one-time ₱150.
- **Test code:** `BIDATEST` only works on `localhost`.
- Security details and console settings: [SECURITY.md](SECURITY.md).
