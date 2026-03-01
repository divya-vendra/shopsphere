# Stripe Integration Setup Guide

## Test Mode (Development)

### 1. Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (winget)
winget install Stripe.StripeCLI

# Linux
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe
```

### 2. Authenticate CLI
```bash
stripe login
```

### 3. Forward webhooks to your local server
```bash
# In a separate terminal — keep this running while developing
stripe listen --forward-to localhost:5000/api/v1/payments/webhook
```
The CLI outputs a webhook signing secret like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxx
```
Copy this to your `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

### 4. Test card numbers
| Scenario         | Card Number         | Exp   | CVC  |
|------------------|---------------------|-------|------|
| Success          | 4242 4242 4242 4242 | Any   | Any  |
| Auth required    | 4000 0025 0000 3155 | Any   | Any  |
| Insufficient     | 4000 0000 0000 9995 | Any   | Any  |
| Declined         | 4000 0000 0000 0002 | Any   | Any  |
| Dispute/Fraud    | 4000 0000 0000 0259 | Any   | Any  |

### 5. Trigger webhook events manually
```bash
# Simulate a successful payment
stripe trigger checkout.session.completed

# Simulate a failed payment
stripe trigger payment_intent.payment_failed

# Simulate a refund
stripe trigger charge.refunded
```

### 6. Replay a specific event
```bash
stripe events resend evt_xxxxxxxxxxxxxxxxx
```

---

## Production Mode

### 1. Dashboard setup
1. Go to https://dashboard.stripe.com
2. Switch to **Live mode** (toggle top-left)
3. **API Keys** → copy Secret Key → set `STRIPE_SECRET_KEY=sk_live_...`
4. **Webhooks** → Add endpoint:
   - URL: `https://your-api-domain.com/api/v1/payments/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `payment_intent.payment_failed`
     - `charge.refunded`
5. Copy **Signing secret** → set `STRIPE_WEBHOOK_SECRET=whsec_live_...`

### 2. Environment variables for production
```env
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_REPLACE_WITH_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET
```

### 3. Security checklist for production
- [ ] Never log raw card data (Stripe handles this — we never see it)
- [ ] Webhook endpoint returns 200 quickly (< 30s) — offload slow work to queue
- [ ] Idempotency keys used on all Stripe API calls (already implemented)
- [ ] HTTPS enforced on webhook endpoint (required by Stripe)
- [ ] `STRIPE_WEBHOOK_SECRET` stored in environment, never in code
- [ ] Alert on `payment_intent.payment_failed` events (add to monitoring)

### 4. Refund flow (Admin)
```
POST /api/v1/payments/refund
Authorization: Bearer <admin_token>
{
  "orderId": "6xxxxxxxxxxxxxxxxxxxx",
  "reason": "requested_by_customer"     // optional; omit amountCents for full refund
}
```

Partial refund:
```json
{
  "orderId": "6xxxxxxxxxxxxxxxxxxxx",
  "amountCents": 1999,                  // $19.99
  "reason": "requested_by_customer"
}
```

---

## Webhook Event Lifecycle

```
Stripe → POST /api/v1/payments/webhook
           │
           ├─ stripe.webhooks.constructEvent()  ← verifies signature
           │
           ├─ WebhookEvent.create({ stripeEventId })  ← idempotency guard
           │       └─ 11000 duplicate? → return 200, skip
           │
           ├─ switch (event.type)
           │       ├─ checkout.session.completed  → mark order paid, clear cart, email
           │       ├─ payment_intent.payment_failed → mark order failed
           │       ├─ checkout.session.expired     → cancel pending order
           │       └─ charge.refunded              → mark order refunded
           │
           └─ return 200 to Stripe
```
