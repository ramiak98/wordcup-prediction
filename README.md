# World Cup Predictions

A mobile-first Next.js app for collecting one World Cup 2026 group-stage prediction per browser/device and managing scoring from an admin dashboard. Knockout rounds are intentionally locked for a later prediction phase.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- Supabase Postgres with server-side Supabase client
- Recharts dashboard charts
- Vercel-ready deployment

## Features

- `/` landing page with `Start Prediction`
- `/predict` multistep group-stage prediction flow with local draft saving
- `/prediction/[id]` public thank-you summary, share link, and downloadable image card
- `/admin` password-gated dashboard
- `/admin/votes` search, team filter, full prediction view, delete, CSV export
- `/admin/results` group-stage actual results entry with automatic point recalculation
- `/admin/scoring` editable current-phase point values with automatic point recalculation
- Duplicate prevention using local browser vote token plus hashed IP and user-agent
- Public homepage leaderboard without exposing user contact details

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project and run:

```sql
-- paste supabase/schema.sql into the Supabase SQL editor first
-- then paste supabase/seed.sql
```

3. Create `.env.local`:

```bash
cp .env.example .env.local
```

Set:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-admin-password
DUPLICATE_HASH_SECRET=your-random-hmac-secret
```

4. Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Notes

The app uses the service-role key only inside Next.js route handlers. RLS is enabled and no anonymous policies are created by default. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

To update teams or groups, edit the `teams` table. If Supabase is not configured during local UI work, the app falls back to the built-in team seed in `lib/world-cup.ts`.

## Scoring

Default rules seeded in `scoring_rules`:

- Correct qualified team to Round of 32: 3
- Correct group winner: 5
- Correct group runner-up: 3
- Correct third-place qualifier: 2

Admins can edit these at `/admin/scoring`. Saving scoring rules recalculates all saved votes.

Finalist, champion, and later knockout-stage prediction fields are kept out of the current user flow. The public prediction link is meant to bring users back when the next prediction phase opens.

## Deployment

1. Push the repository to GitHub.
2. Import it in Vercel.
3. Add the same environment variables in Vercel Project Settings.
4. Deploy.

Use `NEXT_PUBLIC_SITE_URL` with the production URL so share links render correctly.
