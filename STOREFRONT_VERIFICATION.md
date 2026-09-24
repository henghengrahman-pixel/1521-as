# Storefront Verification Report

Date: 2026-09-24

## Implemented scope
Partner public storefront, default template, slug migration/redirect support, claim invitation + OTP provider abstraction, partner password/session, partner-owned storefront editor, draft/preview/publish, S3 media ownership/validation, operational listing eligibility, category/area ranking, server-derived badges, partner analytics, admin storefront controls, selected-partner checkout integration, sitemap/robots/metadata, and responsive namespaced CSS.

## Commands actually executed

| Command | Result |
|---|---|
| `npm install --no-audit --no-fund --prefer-offline` | BLOCKED: sandbox command timed out; npm cache contains no project dependencies |
| `npm exec --offline -- prisma format` | FAIL exit 1 — Prisma package is not cached |
| `npm exec --offline -- prisma validate` | FAIL exit 1 — Prisma package is not cached |
| `npm exec --offline -- prisma generate` | FAIL exit 1 — Prisma package is not cached |
| `npm run typecheck` | FAIL exit 2 — dependencies/type declarations (`next`, `@prisma/client`, React, Node types, etc.) are absent because install is blocked |
| `npm run lint` | FAIL exit 127 — `eslint` executable absent |
| `npm test -- --runInBand` | FAIL exit 127 — `vitest` executable absent |
| `npm run build` | FAIL exit 127 — `prisma`/`next` executables absent |
| `docker build -t jasabatam-storefront-check .` | FAIL exit 127 — Docker CLI is unavailable in sandbox |
| TypeScript `transpileModule` syntax scan over `src` + `tests` | PASS exit 0 — 117 files parsed, 0 syntax-error files |
| `node scripts/audit-project.mjs` | PASS exit 0 — 109 source files / 37 UI actions / 43 Prisma models referenced |
| `node scripts/audit-css.mjs` | PASS exit 0 — 328 selectors / 0 same-context duplicates |
| migration static safety assertion | PASS exit 0 — no DROP TABLE / TRUNCATE / DELETE FROM / migrate reset in new migration |
| storefront route/security static assertions | PASS exit 0 |

## External blockers
1. The execution environment cannot install npm dependencies from the registry and has no useful npm cache. Therefore Prisma format/validate/generate, real typecheck, lint, Vitest, and Next build cannot be completed here.
2. Docker CLI is not installed in the execution environment.
3. No production/staging `DATABASE_URL` was provided to this sandbox, so migration deploy, runtime smoke tests, and the live HL Laundry/Bengkong database acceptance test cannot be executed safely.
4. Claim OTP intentionally requires a real `WHATSAPP_CLAIM_WEBHOOK_URL` + `WHATSAPP_CLAIM_WEBHOOK_SECRET`; when absent, the UI reports provider unavailable rather than simulating delivery.

Because of these blockers, this artifact is **not claimed as fully build-verified or production-ready in this sandbox**. Run the same verification gate in Railway/CI with dependencies, PostgreSQL, S3 credentials and (for claim flow) the real WhatsApp provider configured.
