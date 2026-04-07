# Mandato Agent Handoff

## What Is This

Mandato is a privacy-first, community prediction game for the Hungarian 2026 parliamentary election. Users predict the winning party list, party percentages, and prime minister — then get scored after the election based on a transparent formula. No registration required; token-based identity only.

Key principles:
- Privacy first: no email, no password, no tracking. Token = identity.
- Bilingual: Hungarian (default) + English. Every UI string comes from locale JSON.
- Open source.

## Architecture

npm workspaces monorepo:

```
mandato/
├── app/               # Vite + React + TypeScript frontend SPA
├── worker/            # Hono API on Cloudflare Workers + D1
├── shared/            # Shared TypeScript types and constants
└── package.json       # Root workspace config
```

Target deployment: Cloudflare Pages (frontend) + Cloudflare Workers (API) + Cloudflare D1 (database).

## Running Locally

```bash
npm install
npm run db:init -w worker       # Create tables (safe, IF NOT EXISTS)
npm run db:seed -w worker       # Populate with mock data (optional)
npm run dev                     # Frontend (:5174) + API (:8787) concurrently
```

Or separately: `cd worker && npx wrangler dev --port 8787` and `cd app && npm run dev`.

Vite proxies `/api/*` to the local wrangler server. No Docker needed.

**Remote dev API (optional):** Default `npm run dev` uses **local D1** via wrangler, not `api.dev.mandato.hu`. To hit the deployed dev Worker and shared dev D1 from the SPA only, run `npm run dev:remote` (sets `VITE_API_URL=https://api.dev.mandato.hu`) or put that variable in `app/.env.local` and run `npm run dev -w app`. You still need `VITE_TURNSTILE_SITEKEY` (and a valid dev site key) if the dev Worker enforces Turnstile.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite 8, React 19, TypeScript 5.9 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), shadcn-style components |
| i18n | `i18next` + `react-i18next` |
| Icons | `lucide-react` |
| Fonts | Inter (body), Sora (logo/headings) |
| API | Hono on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| CI/CD | GitHub Actions (`.github/workflows/`) |
| Local dev | `wrangler` (local D1 emulation), `concurrently` |

## Database

### Schema Management

- `worker/src/db/schema-init.sql` — Production-safe (`CREATE TABLE IF NOT EXISTS`). Use for first deploy or adding new tables.
- `worker/src/db/schema-reset.sql` — Development only (`DROP TABLE` + recreate). Destroys all data.
- `worker/src/db/migration-005-indexes.sql` — Composite indexes for common query patterns.
- `worker/src/db/migration-006-participation-rate.sql` — Adds `participation_rate` column to existing databases.
- npm scripts: `db:init` (safe init), `db:reset` (destructive reset), `db:migrate:indexes`, `db:migrate:participation`, `db:seed`, `db:seed-large` (1000 predictions + 8 groups), `db:score` / `db:score:dev` / `db:score:prod` (batch recompute `predictions.score` from `shared/scoring.ts`; prod needs `-- --confirm-prod`; optional `--dry-run`).

### Tables

**predictions**

| Column | Type | Purpose |
|--------|------|---------|
| `token` | TEXT UNIQUE | Auth token (hex, 32 chars). This IS the user's identity. |
| `share_token` | TEXT UNIQUE | Read-only shareable link token for profile sharing. |
| `display_name` | TEXT | Shown on leaderboard. Auto-generated as `Anonymous{NNNN}` if not set. |
| `visibility` | TEXT | `public` or `private`. Private users excluded from leaderboard. |
| `status` | TEXT | Always `finalized` (server only receives data on finalize). |
| `list_winner_id` | TEXT | Predicted winning party (`PartyId`). |
| `pct_{party}` | REAL | Predicted percentage per party (nullable, 0-100). Five columns. |
| `pct_nationalities` | REAL | Predicted combined nationalities list percentage (nullable, 0-100). |
| `participation_rate` | REAL | Predicted voter turnout percentage (nullable, 0-100). Default tip: 70%. |
| `pm_winner_id` | TEXT | Predicted PM candidate's party (`PartyId`). |
| `score` | REAL | Null until scoring runs against `REFERENCE_RESULT`. |
| Timestamps | TEXT | `created_at`, `updated_at`, `finalized_at`. |

**groups**

| Column | Type | Purpose |
|--------|------|---------|
| `group_token` | TEXT UNIQUE | URL token for the group page (`#csoport/<group_token>`). |
| `name` | TEXT | Display name. Auto-generated from `group-names.json` + 2-digit suffix if not provided. |
| `visibility` | TEXT | `public` or `private`. Default `public`. |
| Timestamps | TEXT | `created_at`, `updated_at`. |

**group_members**

| Column | Type | Purpose |
|--------|------|---------|
| `group_id` | INTEGER FK | References `groups(id)`. |
| `prediction_share_token` | TEXT | The member's prediction `share_token`. UNIQUE per group. |
| `added_at` | TEXT | Timestamp. |

### Indexes

Defined in `migration-005-indexes.sql`:
- `idx_predictions_status` — `(status)`
- `idx_predictions_leaderboard` — `(visibility, score DESC) WHERE score IS NOT NULL`
- `idx_predictions_public_finalized` — `(visibility, status, finalized_at DESC)`
- `idx_group_members_share_token` — `(prediction_share_token)`

## API

All endpoints under `/api/v1/`. Route files in `worker/src/routes/`.

| Method | Path | Auth | Route File |
|--------|------|------|------------|
| `POST` | `/predictions` | none | `predictions.ts` |
| `GET` | `/predictions/:token` | token in path | `predictions.ts` |
| `PUT` | `/predictions/:token` | token in path | `predictions.ts` |
| `POST` | `/predictions/:token/finalize` | token in path | `predictions.ts` |
| `DELETE` | `/predictions/:token` | token in path | `predictions.ts` |
| `GET` | `/share/:shareToken` | none | `share.ts` |
| `GET` | `/leaderboard` | none | `leaderboard.ts` |
| `GET` | `/stats` | none | `stats.ts` |
| `POST` | `/groups` | `X-User-Token` | `groups.ts` |
| `GET` | `/groups/my-groups` | `X-User-Token` | `groups.ts` |
| `GET` | `/groups/:groupToken` | none | `groups.ts` |
| `PUT` | `/groups/:groupToken` | `X-User-Token` (member) | `groups.ts` |
| `POST` | `/groups/:groupToken/join` | `X-User-Token` | `groups.ts` |
| `POST` | `/groups/:groupToken/members` | `X-User-Token` (member) | `groups.ts` |
| `DELETE` | `/groups/:groupToken/members/:shareToken` | `X-User-Token` (member) | `groups.ts` |
| `GET` | `/groups/best` | none | `groups.ts` |

### Server-Side Enforcement

- All mutations rejected after cutoff (`2026-04-12T06:00:00+02:00`).
- Visibility: public-to-private blocked after cutoff; private-to-public allowed anytime.
- Finalize requires: winner party selected, all 6 percentage fields filled and summing to 100%, PM candidate selected.
- PM candidate disabled if that party's percentage is below 5% threshold.
- Prediction deletion cascades to `group_members`. Group auto-deletes when last member leaves.

### Middleware Stack (in order, defined in `index.ts`)

1. **Request ID** (`middleware/request-id.ts`) — UUID per request, `X-Request-Id` header, stored in Hono context.
2. **Global error handler** — Structured JSON logging with request ID. Returns generic 500.
3. **CORS** — Restricted to localhost, `*.pages.dev`, `*.workers.dev`, `*.mandato.hu`.
4. **Security headers** — `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
5. **Rate limiting** — Per-IP (hashed), 60 reads/min, 10 writes/min. Logs 429 events with request ID + IP hash prefix.
6. **Body size cap** — 4KB on non-GET requests.
7. **Maintenance mode** — If `MAINTENANCE_MODE` env is set, all non-GET/OPTIONS return 503.

### Caching

Hybrid L1 (in-memory per isolate) + L2 (Cloudflare Cache API per PoP) via `lib/cache.ts`.

| Endpoint | L1 TTL | L2 |
|----------|--------|----|
| `/stats` | 30s | Yes |
| `/leaderboard` | 20s | Yes |
| `/groups/best` | 60s | Yes |
| `/share/:shareToken` | 60s | No |
| `/groups/:groupToken` | 30s | No |

## Worker Code Structure

```
worker/src/
├── index.ts                    # App setup, middleware stack, route mounting (~115 lines)
├── types.ts                    # Bindings, AppEnv (Variables: { requestId })
├── middleware/
│   └── request-id.ts           # UUID generation + X-Request-Id header
├── lib/
│   ├── cache.ts                # Hybrid L1/L2 caching
│   ├── tokens.ts               # generateToken, generateAnonymousName, generateGroupName
│   ├── cutoff.ts               # CUTOFF_MS, isBeforeCutoff
│   ├── ip.ts                   # getClientIP, hashIP
│   ├── validation.ts           # isValidPartyId, isValidPercent, parseBody, string limits
│   └── mappers.ts              # rowToPrediction, PCT_DB_COLUMNS, PCT_BODY_KEYS
├── routes/
│   ├── predictions.ts          # CRUD + finalize + delete
│   ├── groups.ts               # Groups + members + best groups
│   ├── share.ts                # Shared prediction view
│   ├── leaderboard.ts          # Ranked leaderboard
│   └── stats.ts                # Aggregate statistics
└── db/
    ├── queries/
    │   ├── stats.ts            # 10+ batch queries for stats endpoint
    │   ├── share.ts            # Shared prediction query
    │   └── leaderboard.ts      # Leaderboard with CTE for ranking
    ├── schema-init.sql          # Production-safe schema (source of truth)
    ├── schema-reset.sql         # Dev-only destructive reset
    ├── migration-005-indexes.sql
    ├── migration-006-participation-rate.sql
    ├── seed.sql                 # ~20 mock predictions
    ├── seed-large.sql           # 1000 predictions + 8 groups
    └── group-names.json         # ~50 fun Hungarian names for groups
```

`worker/scripts/recalculate-scores.ts` — batch (re)score finalized rows in D1 (`npm run db:score*`).

## Draft and Finalize Model

**Drafts are local-only.** The browser saves prediction drafts to `localStorage` — there are no draft records on the server. The server only receives prediction data on explicit finalization (`POST /predictions` + `POST /predictions/:token/finalize` in one flow). This means:
- `saveDraft()` writes to `localStorage` only — zero server calls.
- `finalize()` is the only path that creates a server record.
- Token, share link, and profile are only available after finalization.
- Users can re-finalize (edit + finalize again) until the cutoff.
- `PUT /predictions/:token` is only for post-finalize metadata changes (display_name, visibility).

## Frontend Pages and Routing

Hash-based routing via `useHash()` hook (`useSyncExternalStore` on `hashchange`). No router library.

| Hash | Page Module | Description |
|------|------------|-------------|
| `#jatek` (default) | `pages/ballot/` | Editable prediction form — party selection, percentages, PM, session panel |
| `#board` | `pages/leaderboard/` | Dual-mode: pre-result (latest tips/groups) and post-result (ranked leaderboard) |
| `#stats` | `pages/stats/` | Community aggregates vs reference results, accuracy rates, geographic breakdown |
| `#tipp/<shareToken>` | `pages/profile-page.tsx` | Read-only ballot view of any user's prediction |
| `#csoportok` | `pages/groups-page.tsx` | Create groups, list own groups, open group by link |
| `#csoport/<groupToken>` | `pages/group-detail/` | Group leaderboard, compact tips comparison, member management |
| `#meghivo/<groupToken>` | `pages/invite-page.tsx` | Invite landing page — join group or create prediction to join |
| `#info` | `pages/info-page.tsx` | Scoring breakdown, timeline, privacy, FAQ accordion |

Header nav: Ballot, Statistics, Groups, Information, Leaderboard (CTA button). Mobile hamburger menu on small screens.

Routes `#csoportok`, `#csoport/...`, `#meghivo/...`, `#tipp/...`, `#stats`, `#info`, and `#board` are placed before the loading/draft gate in `App.tsx` so they work without an active prediction session.

### Code Splitting

`StatsPage`, `InfoPage`, `GroupsPage`, `GroupDetailPage`, `InvitePage`, and `LeaderboardPage` are lazy-loaded via `React.lazy` in `app-router.tsx`. `BallotPage` and `ProfilePage` are eagerly loaded as the most common entry points.

## Frontend Code Structure

```
app/src/
├── App.tsx                      # Thin shell: composes header, router, footer, error boundary
├── app/
│   ├── app-header.tsx           # Header + desktop/mobile navigation
│   ├── app-footer.tsx           # Footer
│   ├── app-router.tsx           # Hash routing + React.lazy imports + Suspense
│   └── error-boundary.tsx       # Root error boundary with fallback UI
├── hooks/
│   ├── use-hash.ts              # Hash-based routing hook
│   ├── use-countdown.ts         # Countdown to cutoff
│   ├── use-api-query.ts         # Generic data fetching hook
│   ├── use-pending-join.ts      # Auto-join groups after finalize
│   └── use-prediction/          # Decomposed prediction state management
│       ├── index.ts             # Orchestrator composing sub-hooks
│       ├── types.ts             # VotingDraft, PercentFieldId
│       ├── percent-math.ts      # redistributePercents, predictionToDraft, etc.
│       ├── use-prediction-init.ts
│       ├── use-prediction-draft.ts
│       ├── use-prediction-persist.ts
│       ├── use-session-restore.ts
│       └── use-save-reminder.ts
├── lib/
│   ├── api-client.ts            # Typed fetch wrapper for all API endpoints
│   ├── storage.ts               # Typed localStorage helpers with try/catch
│   ├── utils.ts                 # cn() (clsx + tailwind-merge)
│   ├── map-utils.ts             # Map rendering utilities
│   └── build-info.ts            # Build metadata (version, commit hash, repo URL)
├── components/
│   ├── trans.tsx                 # <T> component: rich-text i18n with HTML tag support
│   ├── info-boxes.tsx           # <AppInfoBoxes>, <GroupInfoBoxes>
│   ├── top-three-podium.tsx     # Gold/silver/bronze podium display
│   ├── page-header.tsx          # Reusable page header with icon
│   ├── party-badge.tsx          # Party name badge with color
│   ├── rank-badge.tsx           # Rank display with top-3 coloring
│   ├── info-box.tsx             # Icon + label + value display
│   ├── ranked-list.tsx          # Searchable ranked list with progress bars
│   ├── restore-session-modal.tsx # Token paste + restore modal
│   ├── budapest-map.tsx         # Budapest district SVG map
│   ├── hungary-map.tsx          # Hungary county SVG map
│   ├── europe-map.tsx           # Europe country SVG map
│   ├── world-map.tsx            # World country SVG map
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       └── modal.tsx            # Generic modal with backdrop
├── pages/
│   ├── ballot/                  # 13 files: orchestrator + sub-components + utils
│   ├── stats/                   # 14 files: orchestrator + sections + geo hook + utils
│   ├── leaderboard/             # 7 files: orchestrator + table + sections + utils
│   ├── group-detail/            # 9 files: orchestrator + sections + modals + utils
│   ├── profile-page.tsx
│   ├── groups-page.tsx
│   ├── invite-page.tsx
│   └── info-page.tsx
├── data/
│   └── election-options.ts      # Static party/PM data, PartyId type, PARTY_SHORT map
├── locales/
│   ├── hu.json                  # Hungarian strings
│   └── en.json                  # English strings
└── assets/
    ├── parties/                 # Party logos
    └── pm/                      # PM candidate portraits
```

## localStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `mandatoto:v1:token` | string | Prediction auth token (set on finalize) |
| `mandatoto:v1:draft` | JSON | Local draft prediction data |
| `mandatoto:v1:locked-percents` | JSON | Which percentage fields are locked for redistribution |
| `mandatoto:v1:groups` | JSON array | `{ groupToken, name }[]` — user's group memberships |
| `mandatoto:v1:pending-join` | JSON | `{ groupToken, groupName }` — pending invite, cleared after auto-join |

## Session Management

- **Restore session:** Paste a saved token → fetches prediction from server + recovers group memberships via `GET /groups/my-groups`.
- **Leave session:** Clears all localStorage keys and resets to fresh local draft. No server call — the prediction remains on the server for future restoration.
- **Auto-join pending groups:** When a user finalizes after arriving via an invite link, the pending group join triggers automatically.

## Groups Feature

Groups let users create named competitions among friends. A group collects prediction profiles and shows a dedicated mini-leaderboard plus a compact side-by-side tips comparison.

**Auth model**: No separate admin role. Management (add/remove members, rename) is tied to group membership via `X-User-Token` header resolved to `share_token`.

**Lifecycle**: Members can leave groups at any time. When the last member leaves, the group is automatically deleted (backend handles this). Leave group shows a confirmation popup with an amber warning when the user is the last member.

**Invite links**: Route `#meghivo/<groupToken>` provides a self-join entry point. New users are redirected to `#jatek` with a `pending-join` localStorage entry that triggers auto-join after finalization.

**Best Groups leaderboard**: Top 10 public groups ranked by average member score. Only groups created before `CUTOFF_AT` with 2+ scored members qualify.

## Leaderboard — Dual Mode

Controlled by `RESULTS_AVAILABLE` in `shared/types.ts`:

**Pre-result mode** (`RESULTS_AVAILABLE = false`):
- Shows latest 10 finalized tips and 6 newest groups — no ranking, no scores.
- Vote processing bar shows 0% with "Awaiting results".

**Post-result mode** (`RESULTS_AVAILABLE = true`):
- Full ranked leaderboard with scores, search, colored top-3 badges.
- Top 3 podium section. Vote processing bar shows actual `VOTE_PROCESSING_PCT`.

**Result update milestones**: First update at 80% vote processing, then at 85%, 90%, 95%, 100%. Final scoring only at 100%.

## Scoring

Five components (0-100 scale, **v2**):
- Percentage accuracy — 5 parties (70 pts) — mean absolute error across 5 party fields, 30pp cap.
- Nationalities list (5 pts) — separate tight-cap scoring, 0.5pp cap.
- Party list winner (5 pts) — binary correct/incorrect.
- PM winner (10 pts) — binary correct/incorrect.
- Participation rate (10 pts) — absolute error, 20pp cap. Default: 70%.

Score computation runs as a batch after the election against the real results. `REFERENCE_RESULT` in `shared/types.ts` holds placeholder results for development. `RESULTS_AVAILABLE` and `VOTE_PROCESSING_PCT` are the two constants to update on election night.

To (re)write scores in D1 after updating `REFERENCE_RESULT`, run `npm run db:score -w worker` (local), `npm run db:score:dev -w worker` (remote `mandato-dev`), or `npm run db:score:prod -w worker -- --confirm-prod` (remote `mandato-prod`). Add `--dry-run` after `--` to preview without updating. Implementation: `worker/scripts/recalculate-scores.ts` (formula in `shared/scoring.ts`, shared with the leaderboard breakdown UI).

## Shared Constants (`shared/types.ts`)

- `PartyId`: `'mkkp' | 'tisza' | 'mi_hazank' | 'dk' | 'fidesz_kdnp'`
- `CUTOFF_AT`: `'2026-04-12T06:00:00+02:00'`
- `PARTY_LIST_THRESHOLD`: `5` (percent)
- `RESULTS_AVAILABLE`: `false` — controls pre/post-result mode across the app
- `VOTE_PROCESSING_PCT`: `80` — vote processing percentage (manually updated during election night)
- `REFERENCE_RESULT`: placeholder election results used for development/display
- Types: `Prediction`, `PredictionUpdate`, `CreatePredictionRequest`, `SharedPrediction`, `LeaderboardEntry`, `StatsResponse`, `ElectionResult`, `GroupMember`, `GroupDetail`, `BestGroupEntry`, `TopScorer`

## Privacy & Leaderboard Rules

- `public` users: visible on leaderboard, profile viewable via share link.
- `private` users: excluded from leaderboard and geographic statistics. Can share a read-only link via `share_token`.
- Geographic statistics only include users with `visibility = 'public'` AND `location_public = 1`.
- IP addresses are one-way hashed (SHA-256) for rate limiting. Never stored in plain text or linked to predictions.
- Leaderboard entries link to profile pages (`#tipp/<shareToken>`).

## CI/CD & Release Flow

Four GitHub Actions workflows under `.github/workflows/`:

| File | Trigger | Purpose |
|------|---------|---------|
| `ci.yml` | Push/PR to any branch | Lint + build + typecheck (`lint-and-build` job) |
| `cd.yml` | Push to `dev`; `workflow_dispatch` | Deploy to dev or prod environment |
| `release-prepare.yml` | PR opened/updated targeting `main` | Validate PR source is `dev`, check release label, post version preview comment |
| `release.yml` | PR merged into `main` | Create git tag, publish GitHub Release, deploy to prod |

**Release process**: Open a PR from `dev → main` with label `patch`, `minor`, or `major`. The pipeline validates, previews the changelog, and on merge tags and deploys automatically. See `docs/GITHUB_ENV.md` for environment variables, secrets, and Cloudflare resource specs.

**Repo variable**: `GITHUB_REPO` in `app/src/lib/build-info.ts` — change this once when migrating to the final repository. All GitHub URLs (commit links, release links, open-source footer) are derived from it.

## Known Issues

- 4 ESLint warnings: `Date.now()` in `useCountdown` render, `setState` in effect patterns in `use-save-reminder.ts`, `ballot-page.tsx`, and `group-detail-page.tsx`. Functional, no bugs.

## Working Conventions

- Every UI string must be in locale JSON (no hardcoded text).
- Rich text in i18n strings uses HTML tags (`<b>`, `<u>`, `<i>`) rendered via the `<T>` component (`app/src/components/trans.tsx`). Use `<T i18nKey="key" />` instead of `{t('key')}` when the string contains formatting tags.
- Introductory info boxes are centralized in `info-boxes.tsx`. Use `<AppInfoBoxes>` or `<GroupInfoBoxes>` — do not duplicate the markup.
- Privacy-first framing in all copy and behavior.
- All pages inherit `max-w-6xl` from `<main>` — do not set per-page max widths.
- Page modules follow the orchestrator pattern: thin parent component composing focused sub-components. Keep sub-components in the same directory.
- Worker route handlers are thin: parse input → validate → call query module → map → respond.
- Run `npm run build` from root to verify types + bundle (includes worker typecheck).
- Run `npm run lint` from root for ESLint (covers both app and worker).
- Seed data: `npm run db:seed -w worker` populates ~20 mock predictions. The large seed (`npm run db:seed-large -w worker`) generates 1000 predictions plus 8 sample groups.
