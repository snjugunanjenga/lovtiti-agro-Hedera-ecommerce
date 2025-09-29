# API Overview

## Auth Webhooks
- POST /api/auth/clerk-webhook

## KYC
- POST /api/kyc/submit
- GET /api/kyc/status

## Listings
- POST /api/listings
- GET /api/listings

## Transactions
- POST /api/transactions/intent (Stripe)
- POST /api/transactions/escrow/create (Hedera)
- POST /api/transactions/escrow/release (Hedera)

## Admin
- GET /api/admin/kyc
- POST /api/admin/kyc/:id/approve
- POST /api/admin/kyc/:id/reject
