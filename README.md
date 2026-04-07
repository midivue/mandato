# Mandato

**Mandato** is a privacy-first, community prediction game for the Hungarian 2026 parliamentary election. Submit your tip on who wins, what the percentages will be, and who becomes Prime Minister — then get scored against the real results after election night.

🇭🇺 **Live at [mandato.hu](https://mandato.hu)**

---

## What does it do?

Before the election (deadline: **12 April 2026, 06:00**), anyone can:

- Pick the winning party list
- Predict vote-share percentages for all five parties and the nationalities list
- Predict voter turnout
- Choose who becomes Prime Minister

After the election, every prediction is scored against the official results using a transparent formula. A public leaderboard ranks all participants. Groups let friends compete directly against each other.

**No registration required.** Your prediction token is your identity — save it, and you can always restore your session or share your prediction via a public profile link.

---

## Key principles

- **Privacy first** — no email, no password, no tracking. Token = identity. IP addresses are one-way hashed for rate limiting only and never stored in plain text.
- **Bilingual** — Hungarian (default) + English. Every UI string comes from locale JSON files.
- **Transparent scoring** — the scoring formula is fully documented and applied uniformly to all predictions.
- **Open source** — code is public, contributions welcome.

---

## Scoring (summary)

Scores are calculated on a 0–100 scale across five components:

| Component | Points |
|-----------|--------|
| Party percentage accuracy (5 parties) | 70 |
| Nationalities list percentage | 5 |
| Party list winner (binary) | 5 |
| Prime Minister winner (binary) | 10 |
| Voter turnout accuracy | 10 |

See `AGENTS.md` for scoring constants and thresholds.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS v4, shadcn-style components |
| i18n | i18next + react-i18next (hu / en) |
| API | Hono on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Deployment | Cloudflare Pages + Workers |
| CI/CD | GitHub Actions |

The repository is an npm workspaces monorepo:

```
mandato/
├── app/        # Vite + React SPA
├── worker/     # Hono API (Cloudflare Workers + D1)
├── shared/     # Shared TypeScript types and constants
└── package.json
```

---

## Running locally

```bash
npm install
npm run db:init -w worker    # Create tables (safe, IF NOT EXISTS)
npm run db:seed -w worker    # Optional: populate with mock data
npm run dev                  # Frontend :5174 + API :8787
```

Vite proxies `/api/*` to the local Wrangler server. No Docker needed.

---

## Releases

Releases are driven entirely through pull requests. Open a PR from `dev → main` with a `patch`, `minor`, or `major` label. The pipeline validates the PR, generates a changelog preview, and on merge creates a tagged GitHub Release and deploys to production automatically.

See [`AGENTS.md`](./AGENTS.md) for the full architecture, API reference, and contributor conventions.

---

## License

Apache License 2.0 — see [`LICENSE`](./LICENSE).

Use of this software requires preserving all copyright and attribution notices, including the [`NOTICE`](./NOTICE) file and the [`AUTHORS`](./AUTHORS) list in any derivative work or distribution.
