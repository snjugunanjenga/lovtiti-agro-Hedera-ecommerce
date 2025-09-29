# Cursor Rules for Lovitti Agro Mart

## Project Context
- Project Name: Lovitti Agro Mart
- Description: A web-based decentralized marketplace for African farmers and buyers, using Hedera Hashgraph for transactions, Clerk for authentication, Stripe for payments, and Neon (PostgreSQL) with Prisma for data storage. Requires KYC for buyers and farmers, mandatory accounts.
- Tech Stack:
  - Frontend: Next.js (TypeScript), TailwindCSS, Shadcn, Radix UI
  - Backend: Next.js API routes, Node.js (USSD), Prisma (Neon PostgreSQL)
  - Blockchain: Hedera Hashgraph (HBAR, smart contracts)
  - Authentication: Clerk
  - Payments: Stripe
  - Storage: Neon (PostgreSQL), optional IPFS for images
  - Deployment: Vercel, GitHub, Jest/Cypress

## Coding Standards
1. **Language**: Use TypeScript for all code.
2. **File Structure**:
   - Next.js: Use `/app` for routing, `/components` for UI.
   - Backend: Use `/backend/services` for USSD logic.
   - Prisma: Use `/prisma/schema.prisma` for Neon PostgreSQL.
   - Smart Contracts: Store in `/smart-contracts/contracts`, tests in `/smart-contracts/tests`.
   - Cursor Rules: Store in `/.cursorrules/rules.md`.
   - Prompts: Store in `/prompts.md`.
3. **Naming Conventions**:
   - Files: PascalCase for components (e.g., `BuyerDashboard.tsx`), kebab-case for routes (e.g., `buyer-dashboard.ts`).
   - Variables/Functions: camelCase (e.g., `fetchListings`, `userData`).
   - Constants: UPPER_SNAKE_CASE (e.g., `NEON_DATABASE_URL`).
4. **Styling**:
   - Use TailwindCSS for responsive, utility-first styling.
   - Use Shadcn and Radix UI for accessible components.
   - Ensure mobile-first design with desktop breakpoints.
5. **Error Handling**:
   - Use try-catch for API, Prisma, Stripe, and Hedera calls.
   - Return user-friendly error messages for UI.
   - Log errors to console and Neon for debugging.
6. **Testing**:
   - Jest for unit tests (components, hooks, services).
   - Cypress for end-to-end tests (login, KYC, ordering).
   - Mocha/Chai for Hedera smart contract tests.
7. **Performance**:
   - Use `useMemo`, `useCallback`, and Next.js dynamic imports.
   - Cache data in localStorage for offline mode.
8. **Security**:
   - Sanitize inputs to prevent XSS/SQL injection.
   - Use Clerk for secure auth with role-based access (buyer, farmer, admin).
   - Encrypt Hedera keys in localStorage.
   - Ensure Stripe PCI compliance.
9. **Accessibility**:
   - Follow WCAG 2.1 (ARIA labels, keyboard navigation).
   - Support multilingual UI (English, Swahili) with i18n.
   - Simulate USSD for feature phone users.

## Code Generation Guidelines
- Include TypeScript interfaces for models (e.g., `IUser`, `IKYC`, `IProduct`, `IOrder`).
- Use functional components with hooks in Next.js.
- Follow RESTful conventions for API routes (e.g., `/api/kyc`, `/api/listings`).
- Generate Hedera smart contracts in Solidity for Hedera Contract Service.
- Use Prisma for Neon PostgreSQL queries and schema definitions.
- Include JSDoc comments for complex logic.
- Use environment variables for sensitive data (Clerk, Stripe, Neon, Hedera).

## Debugging and Suggestions
- Suggest optimizations (e.g., memoization, code-splitting).
- Highlight security risks (e.g., unhandled errors, exposed keys).
- Recommend UX improvements (e.g., micro-interactions).
- Validate Hedera transactions against testnet.

## Integration Requirements
- Clerk: Use `@clerk/nextjs` for authentication.
- Hedera: Use `@hashgraph/sdk` for wallet and transaction signing.
- Stripe: Use `@stripe/stripe-js` and `stripe` for payments.
- Prisma: Use `@prisma/client` for Neon PostgreSQL.
- IPFS: Optional for images; use `ipfs-http-client`.
- USSD: Simulate menu-driven flows in `/backend/services/ussd.js`.

## Project-Specific Notes
- KYC: Mandatory for buyers and farmers, stored in Neon with Prisma.
- Offline Mode: Cache listings and user data in localStorage.
- Buyer Accounts: Require Clerk-based login with KYC verification.
- USSD: Simulate flows (e.g., register, list products) for

## Completed Setup (to date)
- App scaffolded with Next.js 14 (app router) + Tailwind.
- Clerk integrated: `middleware.ts` with `clerkMiddleware()`, `<ClerkProvider>` in `app/layout.tsx`, auth pages (`/auth/login`, `/auth/signup`, `/auth/logout`).
- Clerk webhook at `/app/api/auth/clerk/route.ts` upserts Prisma `User` records.
- Prisma schema defined with `User`, `Profile`, `Listing`, `Order` and relations; Prisma Client generates successfully.
- Offline Hedera login helper (encrypted localStorage cache) exposed in `utils/hedera.ts` and surfaced in login UI.