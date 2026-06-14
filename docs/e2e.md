# AuHub Frontend E2E

## Default Smoke

Default Playwright smoke tests are self-contained and do not require AuHub backend services.

They start:
- `e2e/mock-api.mjs` on `127.0.0.1:59999`;
- Next.js dev server on `127.0.0.1:3000`;
- Chromium tests for public app shell/navigation and login/register client validation.

Run:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Expected current result:
- 4 passed smoke tests;
- 1 skipped full-stack marketplace test.

## Full-Stack Marketplace Smoke

The full-stack spec is opt-in and should run only when AuHub backend/Gateway services are available.

Required services:
- Gateway: `http://127.0.0.1:5000`
- Identity
- Auctions
- Payment
- Notifications
- PostgreSQL databases
- RabbitMQ
- MinIO

Required environment values:
- `INTERNAL_API_KEY`
- `JWT_SECRET`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`
- optionally `ADMIN_BOOTSTRAP_NAME`

The admin account must exist before the spec runs. The easiest path is to start Identity with `ADMIN_BOOTSTRAP_*` set.

Run:

```powershell
$env:E2E_FULL_STACK = "true"
$env:E2E_GATEWAY_URL = "http://127.0.0.1:5000"
$env:E2E_ADMIN_EMAIL = "<seeded-admin-email>"
$env:E2E_ADMIN_PASSWORD = "<seeded-admin-password>"
npm.cmd run test:e2e -- e2e/full-stack-marketplace.spec.ts
```

Current full-stack spec flow:
1. Check Gateway `/health`.
2. Register a unique seller.
3. Register a unique buyer.
4. Login seeded admin.
5. Seller creates a draft lot through Gateway API.
6. Seller submits lot for moderation.
7. Admin approves lot.
8. Buyer tops up demo wallet.
9. Browser opens the real lot detail page.
10. Buyer places a bid through the UI.
11. API verifies the lot is still `Active` and `currentPrice` is updated.

## Manual Demo Fallback

Use this when full-stack E2E cannot run because Docker or admin bootstrap is not ready.

1. Start backend stack with valid `.env`.
2. Open `http://localhost:3000`.
3. Register seller.
4. Create lot with at least one delivery provider.
5. Open lot detail and submit it for moderation.
6. Login as admin.
7. Approve the pending lot.
8. Register buyer.
9. Top up buyer wallet in profile/balance.
10. Open approved lot detail.
11. Place a bid higher than current price.
12. Confirm lot page shows the new current price and bid history.

Do not mark Session 13 full-stack verification as done until the Playwright full-stack spec passes against the real stack.
