# MarketUp Copilot Instructions

You are working on MarketUp, a Personal Storefront SaaS platform.

## Architecture

- **Monorepo:** Uses Turborepo with `pnpm`.
- **Database:** Prisma client is centralized in `packages/database`. Always run `pnpm run db:generate` after schema changes.
- **Frontend:** Next.js 15/16 in `apps/web`. Prefer `@/` alias for imports. Uses `shadcn/ui` components in `components/ui`.
- **Backend:** NestJS in `apps/api`. Follow modular structure. Always use `PrismaService` for DB access.

## Coding Patterns

- **API Calls:** Use the pre-configured `api` instance in `apps/web/lib/api-client.ts`. It handles JWT injection automatically from Zustand storage.
- **State Management:** 
  - Server state: TanStack Query.
  - Client state (Auth/Cart): Zustand with persistence.
- **Forms:** Use `react-hook-form` + `zod` + `shadcn/ui` Form components.
- **Images:** All product images are stored in Cloudinary. The API handles the upload via a dedicated provider.

## Storefront Access

Public storefronts are accessed via `/shop/[slug]` routes. These pages should remain highly performant and SEO friendly (favoring SSR/SSG).
