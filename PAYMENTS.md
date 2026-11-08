# Premium payments setup — PayMongo (GCash · Maya · Card)

**Price:** ₱149 one-time, tied to the buyer's Google account. It works on every device they sign in on, and offline at the venue once unlocked.

```
Buyer taps "Bayaran ₱149"
  → app (signed in with Google) asks the Worker for a checkout
  → Worker creates a PayMongo Checkout Session (secret key stays on the Worker)
  → buyer pays with GCash / Maya / card on PayMongo's page
  → PayMongo sends "checkout_session.payment.paid" to the Worker's /webhook
  → Worker checks the signature + amount, marks that Google account as Premium
  → buyer lands back on the app (?paid=1), app polls /status and unlocks
```

All three services have free tiers that cover this. PayMongo charges a per-transaction fee on each sale; check their pricing page.

---

## 1. PayMongo
1. Sign up at **dashboard.paymongo.com**. Test mode works right away. Live payments need account activation (they'll ask for ID and business details).
2. **Developers → API Keys**: copy the **test secret key** (`sk_test_…`). Never put it in the app's code.

## 2. Firebase (Google sign-in only, free Spark plan)
1. console.firebase.google.com → **Add project** → name it `bidavibe`. Analytics is optional.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
3. **Authentication → Settings → Authorized domains**: add `campingchairph.github.io`. `localhost` is already there.
4. **Project settings → Your apps → Web (`</>`)** → register the app → copy the `firebaseConfig` object.

## 3. Cloudflare Worker (free plan, no card needed)
1. dash.cloudflare.com → **Workers & Pages → Create → Create Worker** → name it `bida-pay` → Deploy → **Edit code**.
2. Replace everything with the contents of [`worker/bida-pay-worker.js`](worker/bida-pay-worker.js) → **Deploy**. Note the URL, e.g. `https://bida-pay.<you>.workers.dev`.
3. **Storage & Databases → KV → Create** a namespace called `bida-premium`.
4. Worker → **Settings → Bindings → Add → KV namespace**: variable name **`PREMIUM`**, namespace `bida-premium`.
5. Worker → **Settings → Variables and Secrets** (add as *Text*):

   | Name | Value |
   |---|---|
   | `FIREBASE_PROJECT_ID` | your Firebase project ID, e.g. `bidavibe-1a2b3` |
   | `APP_URL` | `https://campingchairph.github.io/bida-vibe/` (keep the trailing `/`) |
   | `ALLOWED_ORIGINS` | `https://campingchairph.github.io,http://localhost:8102` |
   | `PRICE_CENTAVOS` | `14900` |

   And as *Secret*: `PAYMONGO_SECRET_KEY` = your `sk_test_…` key.

## 4. PayMongo webhook
PayMongo creates webhooks through its API. Run this once in Git Bash, with your secret key and Worker URL filled in:

```bash
curl https://api.paymongo.com/v1/webhooks -u "sk_test_YOURKEY:" -H "Content-Type: application/json" -d '{"data":{"attributes":{"url":"https://bida-pay.YOU.workers.dev/webhook","events":["checkout_session.payment.paid"]}}}'
```

The response contains `"secret_key": "whsk_…"`. Add it to the Worker as a *Secret* named **`PAYMONGO_WEBHOOK_SECRET`**.

## 5. Connect the app
In `bida-app.js`, fill in `BIDA_CONFIG`:

```js
workerUrl: 'https://bida-pay.YOU.workers.dev',
firebase: { apiKey: '…', authDomain: '…', projectId: '…', appId: '…' },
```

Firebase web config is safe to publish; it only identifies the project. Push to GitHub.

## 6. Test, then go live
1. On the live site: Sound Lab → I-unlock → sign in with Google → **Bayaran ₱149** → on PayMongo's test checkout pick GCash and authorize the test payment → you're sent back and Premium unlocks within a few seconds.
2. When PayMongo activates your account:
   - Swap `PAYMONGO_SECRET_KEY` to `sk_live_…`.
   - Run the webhook command again with the live key.
   - Replace `PAYMONGO_WEBHOOK_SECRET` with the new `whsk_…`.

   The Worker picks the live or test signature automatically based on the key.

## Notes
- **Who's paid:** Cloudflare → KV → `bida-premium`. Each `pro:<uid>` entry stores the date, amount, method and email. To refund or revoke, delete the entry.
- **Free features stay free:** event setup, program, scripts and games need no account.
- **Test code:** `BIDATEST` only works on `localhost`.
- **Limits:** Premium features run in the browser, so a technical user could unlock them by editing their own browser storage. That's normal for a no-server app. What the server protects is the purchase record.
