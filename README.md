# Lovtiti Agro Mart

Marketplace connecting farmers and buyers with Hedera escrow and Stripe payments.

## Tech
- Next.js 14 (app dir) + TypeScript + TailwindCSS
- Prisma + PostgreSQL (Neon)
- Clerk auth (stubs)
- Hedera & Stripe helpers (stubs)
- Express backend to simulate USSD

## Getting Started
1. Install deps:
```bash
npm ci
```
2. Set env vars in `.env` (see below).
3. Setup DB:
```bash
npx prisma migrate dev --name init
```
4. Run web app:
```bash
npm run dev
```
5. Run USSD server:
```bash
node --loader ts-node/esm backend/server.ts
```

## Env
```
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
STRIPE_SECRET_KEY="sk_..."
HEDERA_ACCOUNT_ID="..."
HEDERA_PRIVATE_KEY="..."
```
