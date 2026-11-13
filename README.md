# Maliha Store Plus — starter marketplace

This is a deployable MVP starter, not a fully audited production marketplace. It includes a responsive storefront, Supabase-backed account signup/login, product submission, COD order creation, basic admin product approval and order status updates.

## What still needs owner setup
1. Create a Supabase project on the Free plan.
2. In Supabase > SQL Editor, run `supabase/schema.sql`.
3. In Supabase > Project Settings > API, copy the Project URL and publishable/anon key.
4. Copy `.env.example` to `.env.local` and fill in those two public values.
5. Deploy the project to Vercel and add the same two environment variables in Vercel Project Settings.

Never put a Supabase `service_role` key in this app or expose it in browser code. Never send passwords or OTPs to anyone.

## Local test
- Install Node.js 20 or newer.
- Run `npm install`
- Run `npm run dev`
- Open http://localhost:3000

## Vercel deployment
- Upload this folder to a new GitHub repository.
- In Vercel, choose Add New > Project and import that repository.
- Framework: Next.js (detected automatically).
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Deploy.

## Make your own account admin
- Sign up once from the website.
- In Supabase > Authentication > Users, copy your user UUID.
- In Supabase > SQL Editor, run:
  `update public.profiles set role='admin', seller_status='approved' where id='YOUR-USER-UUID';`
- Sign out and sign in again, then open `/admin`.

## Important limitations before real business use
- This starter is an MVP foundation, not yet ready for unrestricted public commerce.
- Seller onboarding/approval, seller-specific order visibility, secure cart pricing verification, seller payouts/commission ledger, shipping provider integrations, image upload storage, refunds/returns, transactional emails/SMS, abuse protection, audit logs, and security review still need implementation.
- Current checkout writes the total sent by the browser; do not accept real paid orders until server-side price validation and order creation are added.
- Admin role must be granted only by the site owner through the SQL Editor.
- Supabase free projects have usage limits and may pause after inactivity. Vercel free plan is subject to its terms and limits.
- COD is a recorded order method only; no courier API or cash reconciliation is connected.
