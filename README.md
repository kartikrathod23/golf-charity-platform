# Golf Charity Platform

A small Next.js app for tracking golf Stableford scores, entering monthly prize draws, and routing a share of subscription revenue to chosen charities.

## Features

- Authentication (signup/login/logout via JWT cookie)
- Charity catalog (list + detail page)
- Dashboard (scores entry, summary, subscription & winnings overview)
- Admin panels (draws, winners, users, payouts, charity management)
- Supabase Postgres backend (profiles, user_scores, draws, etc.)

## Setup

1. Clone repo

```bash
git clone <repo-url>
cd golf-charity-platform
```

2. Install dependencies

```bash
npm install
# or pnpm install
# or yarn install
```

3. Create `.env` from `.env.example` and set required values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

Optional for full features:
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY_ID`, `STRIPE_PRICE_YEARLY_ID`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `CRON_SECRET`

4. Ensure database schema is created (via Supabase migrations or SQL):

- `supabase/migrations/001_init.sql` includes table schema + initial charity seeds.

5. Start dev server

```bash
npm run dev
```

6. Open browser

- `http://localhost:3000`

7. Run through workflow

- Admin > create charity (if no charities exist)
- Auth > Signup (email/password, choose charity)
- Auth > Login
- Dashboard > enter scores

## Troubleshooting

- `Missing environment variable: SUPABASE_URL` → can't reach database; set it and restart
- `No charities available` → add one in Admin or verify `charities` row data in DB
- `GET /api/auth/me 401` → session cookie missing; login first

## Useful commands

- `npm run lint`
- `npm run build`
- `npm start`

---

This README is intentionally small and practical; extend it with deployment instructions and environment-specific values as needed.

