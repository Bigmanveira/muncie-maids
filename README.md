# Muncie Maids

Home cleaning, booked in minutes — serving Muncie, Yorktown, Gaston, and Albany, Indiana.

Get an instant price, pick a time, and pay online. Cleaners are background-checked, insured, and local.

## Structure

```
client/     Customer booking app (Vite + React + TypeScript + Tailwind, PWA)
cleaner/    Cleaner app — applications, jobs, and earnings
ops/        Internal operations portal
supabase/   Database migrations and edge functions
```

## Development

Each app is a standalone Vite project:

```bash
cd client   # or cleaner/, ops/
npm install
npm run dev
```

Backend configuration is provided via environment variables (not included in this repo).

© Muncie Maids. All rights reserved.
