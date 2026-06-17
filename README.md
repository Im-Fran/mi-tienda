# miTienda Frontend

Vite + React 19 SPA for the miTienda multi-tenant SaaS e-commerce platform.

Two apps in one:
- `/admin/*` — dashboard for store owners and system admins
- `/store/:storeSlug/*` — storefront for customers

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Client state | Zustand (persist) |
| Forms | React Hook Form + Zod |
| UI | shadcn/ui + Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| Markdown | react-markdown + @uiw/react-md-editor |
| Notifications | Sonner |
| Deployment | Cloudflare Pages |

## Prerequisites

- Node.js 20+
- The miTienda backend API running at `http://localhost:8787`

## Environment Variables

Copy `.env` and adjust if needed:

```
VITE_API_BASE_URL=http://localhost:8787
VITE_APP_URL=http://localhost:5173
```

Both variables are required. `VITE_API_BASE_URL` is used for the API proxy and for CDN image URLs. `VITE_APP_URL` is the public URL of this frontend (used for OAuth redirect configuration).

## Local Development

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. All `/api/*` requests are proxied to `http://localhost:8787` via Vite's built-in proxy (see `vite.config.ts`).

## Build

```bash
npm run build
```

Output is written to `dist/`. TypeScript is compiled first (`tsc -b`), then Vite bundles the app.

## Cloudflare Pages Deployment

The project includes a `wrangler.toml` configured for Cloudflare Pages:

```bash
# Preview locally with Wrangler
npx wrangler pages dev dist

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist
```

Set the following environment variables in the Cloudflare Pages dashboard (Settings > Environment variables):

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | URL of the deployed backend worker |
| `VITE_APP_URL` | URL of the deployed frontend Pages project |

The `pages_build_output_dir = "dist"` in `wrangler.toml` tells Cloudflare Pages where to find the build output. For CI/CD, connect the GitHub repo and set the build command to `npm run build`.

## shadcn/ui Components

Components were initialized with:

```bash
npx shadcn@latest init
npx shadcn@latest add button input label card badge avatar \
  dropdown-menu tooltip dialog sheet select radio-group checkbox \
  switch separator tabs textarea sonner
```

To add more components:

```bash
npx shadcn@latest add <component-name>
```

Components live in `src/components/ui/`. The `components.json` configuration uses `src/` path aliases.

## Project Structure

```
src/
├── api/
│   ├── client.ts          # fetch wrapper, JSend handling, auth headers
│   ├── types.ts           # TypeScript types from OpenAPI spec
│   └── endpoints/         # per-domain API functions (11 files)
├── stores/
│   ├── auth.store.ts      # user session + customer session (Zustand persist)
│   └── cart.store.ts      # cart ID + guest token (Zustand persist)
├── hooks/                 # TanStack Query hooks (11 files)
├── lib/
│   ├── utils.ts           # cn, formatCurrency, formatDate, slugify
│   └── validators.ts      # Zod schemas for all forms
├── components/
│   ├── ui/                # shadcn/ui components
│   └── shared/            # LoadingSpinner, ErrorState, EmptyState,
│                          # DataTable, StatusBadge, MarkdownRenderer, ...
├── layouts/
│   ├── DashboardLayout.tsx   # sidebar + topbar for admin
│   └── StorefrontLayout.tsx  # header + footer for storefront
├── pages/
│   ├── admin/             # 19 admin pages
│   └── storefront/        # 10 storefront pages
├── app.tsx                # BrowserRouter, QueryClient, route tree, guards
└── main.tsx               # React root
```

## Auth Flow

Two independent auth systems share the same `apiClient`:

- **Admin/owner auth** — magic link + OAuth, token persisted in `mitenda-user-session` (localStorage). Bearer token sent on `/api/admin/*`, `/api/stores/*`, `/api/users/*` requests.
- **Customer auth** — magic link + OAuth, token persisted in `mitenda-customer-session` (localStorage). Bearer token sent on `/api/customers/*`, `/api/auth/customer/*` requests.
- **Guest cart** — `guestToken` persisted in `mitenda-cart` (localStorage). Sent as `X-Guest-Token` header on `/api/*/cart*` requests.

## Business Rules

- All monetary amounts are stored in **minor units** (cents). The `formatCurrency` utility divides by 100 for display.
- All timestamps are **Unix seconds**.
- API responses follow the **JSend** format: `{ status: "success", data: X }` / `{ status: "fail", ... }` / `{ status: "error", ... }`.
