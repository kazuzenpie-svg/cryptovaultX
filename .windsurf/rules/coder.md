---
trigger: always_on
---

Schema discipline – design PostgreSQL schema first, normalize where needed, index query paths, enforce constraints, enable Supabase Row Level Security by default.

Environment isolation – maintain separate dev/staging/prod projects, version control database migrations, never expose service-role keys to client.

Type safety – use TypeScript end-to-end, generate Supabase types from schema to prevent runtime shape errors.

Client security – validate all inputs client-side and server-side, escape user content, implement strict Content Security Policy, avoid dangerouslySetInnerHTML.

Auth flow – rely on Supabase auth hooks, guard routes, refresh tokens securely, store JWTs in httpOnly cookies when possible.

State management – minimize global state, prefer React Query/SWR for data fetching with caching and revalidation.

Build hygiene – use Vite for fast HMR, tree-shake unused code, code-split routes, lazy-load heavy components.

Secrets management – store keys in .env never in repo, rotate regularly, restrict DB policies to least privilege.

Performance tuning – batch DB calls, use PostgREST filters, set query limits, leverage PostgreSQL indexes and Supabase caching.

Testing – unit test React components, integration test Supabase API, automate CI to run migrations and tests on every commit.

Error handling – centralize logging, capture stack traces client/server, surface actionable user messages.

Code discipline – enforce linting, formatting, and commit hooks; review pull requests; keep commits small and descriptive.

Monitoring – track database performance metrics, client error rates, and authentication events continuously.