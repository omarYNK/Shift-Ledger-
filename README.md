# Shift Ledger

Labor log + invoicing app for a warehouse labor business. Employees log hours
against clients; the admin manages clients/rates/employees/fixed charges and
generates PDF invoices that download as real files via a server-rendered
route — no client-side print dialog, no platform sandbox restrictions.

## Stack

- Next.js 16 (App Router) + TypeScript
- PostgreSQL via Prisma ORM 7 (driver adapter: `@prisma/adapter-pg`)
- PDF generation: `@react-pdf/renderer`, rendered server-side in
  `src/app/api/invoices/generate/route.tsx` and returned with
  `Content-Disposition: attachment`
- No auth library — access is by shared link; identity (admin vs. employee)
  is stored in a cookie (see `src/lib/identity.ts`). The admin side is
  additionally gated by a shared password (`ADMIN_PASSWORD` env var).

## Local development

This repo currently points `DATABASE_URL` at a local Prisma Dev Postgres
instance (no Docker required) for convenience. To (re)start it:

```
npx prisma dev -p 51213 --db-port 51214 -d
```

That's a background dev-only Postgres — the connection string it prints is
already saved in `.env`. Then:

```
npm install
npx prisma migrate dev   # apply schema
npx prisma db seed       # load the real client roster (see prisma/seed.ts)
npm run dev
```

Open http://localhost:3000.

## Deploying for real (Supabase/Neon + Vercel)

1. Create a Postgres database on Supabase or Neon and copy its connection
   string.
2. Set `DATABASE_URL` to that string, and set `ADMIN_PASSWORD` to whatever
   password the admin should enter — both in `.env` (for local admin tasks)
   and in your hosting provider's environment variables (e.g. Vercel project
   settings).
3. Run migrations against it: `npx prisma migrate deploy`
4. Seed the client roster once: `npx prisma db seed`
5. Deploy (e.g. `vercel --prod`, or connect the repo in the Vercel
   dashboard). No other config is required — the PDF route runs on the
   Node.js runtime (`export const runtime = "nodejs"`), which Vercel
   supports out of the box.

## Data model notes

- A `TimeEntry`'s `rate`/`amount` and a `FixedItem`'s `amount` are captured
  at creation time from the client's rate *then* — changing a client's rate
  later never rewrites past entries. This is what makes past invoices
  reproducible.
- Employees are archived, never hard-deleted, so historical time entries keep
  a valid reference. Clients, by contrast, can be hard-deleted from the admin
  Clients tab — the foreign keys on `TimeEntry`/`FixedItem`/`Invoice` are
  nullable with `onDelete: SetNull`, so deleting a client clears the link but
  never touches the `clientName` snapshot already recorded on past rows.
  Historical billing data survives; only the ability to log *new* hours/
  charges against that client goes away.
- Employees can log both hours and one-off fixed charges (materials,
  packaging, etc.) against any client directly from `/log`, in addition to
  the admin's own "Fixed charges" tab. Each fixed charge records who added it
  (`employeeId`/`employeeName`, nullable — null means the admin added it).
- Generating an invoice for a client/period stamps every included
  `TimeEntry`/`FixedItem` with `invoicedAt` (locking them from further
  edits/deletes) and writes a versioned `Invoice` record. Re-generating for
  the same client/month creates `-v2`, `-v3`, etc. rather than silently
  duplicating or overwriting.

## What's intentionally out of scope (v1)

Storage fees, postage markup, per-order handling fees, and software fees are
tracked only as free text in a client's `notes` field — the app does not
calculate them. Multiple rate types per client, PIN-protected employee
identity, CSV export, and emailing invoices directly were left as
"nice to have, not required" per the original spec and are not built.
