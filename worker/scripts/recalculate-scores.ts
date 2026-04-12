/**
 * Batch (re)score all finalized predictions in D1 using the same v2 formula as the app
 * (`shared/scoring.ts` / `REFERENCE_RESULT` in `shared/types.ts`).
 *
 * Usage (from repo root or worker):
 *   npm run db:score -w worker              # mandato-local, --local
 *   npm run db:score:dev -w worker          # mandato-dev, --remote
 *   npm run db:score:prod -w worker -- --confirm-prod
 *
 * Flags:
 *   --dry-run        Print counts and first rows; no SQL writes
 *   --null-only      Only process rows where score IS NULL (skip already-scored rows)
 *   --confirm-prod   Required when target is prod
 */

import { execFileSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { computeScoreBreakdown } from '@mandatoto/shared/scoring'
import type { PartyId } from '@mandatoto/shared/types'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const WORKER_ROOT = join(__dirname, '..')

type Target = 'local' | 'dev' | 'prod'

const TARGET_DB: Record<Target, string> = {
  local: 'mandato-local',
  dev: 'mandato-dev',
  prod: 'mandato-prod',
}

type D1Row = Record<string, unknown>

function parseArgs(argv: string[]) {
  let target: Target = 'local'
  let dryRun = false
  let nullOnly = false
  let confirmProd = false
  const unknown: string[] = []
  for (const a of argv) {
    if (a === '--dry-run') dryRun = true
    else if (a === '--null-only') nullOnly = true
    else if (a === '--confirm-prod') confirmProd = true
    else if (a === 'local' || a === 'dev' || a === 'prod') target = a
    else unknown.push(a)
  }
  return { target, dryRun, nullOnly, confirmProd, unknown }
}

function d1ExecuteJson(dbName: string, extraArgs: string[], command: string): D1Row[] {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', dbName, ...extraArgs, '--json', '--command', command],
    { cwd: WORKER_ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'inherit'] },
  )
  const parsed = JSON.parse(out.trim()) as { results: D1Row[]; success: boolean }[]
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Unexpected wrangler JSON output')
  }
  const first = parsed[0]
  if (!first.success) throw new Error('D1 command failed')
  return first.results ?? []
}

function d1ExecuteFile(dbName: string, extraArgs: string[], filePath: string): void {
  execFileSync('npx', ['wrangler', 'd1', 'execute', dbName, ...extraArgs, '--file', filePath], {
    cwd: WORKER_ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'inherit', 'inherit'],
  })
}

function num(row: D1Row, key: string): number | null {
  const v = row[key]
  if (v == null) return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return null
}

function party(row: D1Row, key: string): PartyId | null {
  const v = row[key]
  if (v == null || typeof v !== 'string') return null
  return v as PartyId
}

function str(row: D1Row, key: string): string {
  const v = row[key]
  if (typeof v !== 'string' || !/^[0-9a-f]{32}$/.test(v)) {
    throw new Error(`Invalid token column for row`)
  }
  return v
}

function rowToInput(row: D1Row) {
  return {
    listWinnerId: party(row, 'list_winner_id'),
    pmWinnerId: party(row, 'pm_winner_id'),
    pctMkkp: num(row, 'pct_mkkp'),
    pctTisza: num(row, 'pct_tisza'),
    pctMiHazank: num(row, 'pct_mi_hazank'),
    pctDk: num(row, 'pct_dk'),
    pctFideszKdnp: num(row, 'pct_fidesz_kdnp'),
    pctNationalities: num(row, 'pct_nationalities'),
    participationRate: num(row, 'participation_rate'),
  }
}

const SELECT_COLS = `token, list_winner_id, pm_winner_id, pct_mkkp, pct_tisza, pct_mi_hazank, pct_dk, pct_fidesz_kdnp, pct_nationalities, participation_rate, score`

function main() {
  const { target, dryRun, nullOnly, confirmProd, unknown } = parseArgs(process.argv.slice(2))
  if (unknown.length > 0) {
    console.error('Unknown arguments:', unknown.join(' '))
    process.exit(1)
  }
  if (target === 'prod' && !confirmProd) {
    console.error('Refusing to touch production without --confirm-prod')
    process.exit(1)
  }

  const dbName = TARGET_DB[target]
  const wranglerDbArgs = target === 'local' ? (['--local'] as const) : (['--remote'] as const)

  const selectSql = `SELECT ${SELECT_COLS} FROM predictions WHERE status = 'finalized'${nullOnly ? ' AND score IS NULL' : ''}`

  const flags = [dryRun && '[dry-run]', nullOnly && '[null-only]'].filter(Boolean).join(' ')
  console.error(`Target: ${target} (${dbName})${flags ? ' ' + flags : ''}`)

  const rows = d1ExecuteJson(dbName, [...wranglerDbArgs], selectSql)
  console.error(`Finalized predictions: ${rows.length}`)

  const updates: { token: string; score: number; prev: number | null }[] = []
  for (const row of rows) {
    const token = str(row, 'token')
    const breakdown = computeScoreBreakdown(rowToInput(row))
    const prev = num(row, 'score')
    updates.push({ token, score: breakdown.total, prev })
  }

  const changed = updates.filter((u) => u.prev !== u.score)
  console.error(`Rows with score change: ${changed.length}`)

  if (dryRun) {
    for (const u of updates.slice(0, 10)) {
      console.log(`${u.token}  ${u.prev ?? 'null'} -> ${u.score}`)
    }
    if (updates.length > 10) console.log('…')
    return
  }

  if (updates.length === 0) {
    console.error('Nothing to update.')
    return
  }

  const lines: string[] = []
  for (const u of updates) {
    lines.push(
      `UPDATE predictions SET score = ${JSON.stringify(u.score)} WHERE token = '${u.token}';`,
    )
  }
  const sqlPath = join(tmpdir(), `mandato-recalc-scores-${Date.now()}.sql`)
  try {
    writeFileSync(sqlPath, lines.join('\n'), 'utf-8')
    d1ExecuteFile(dbName, [...wranglerDbArgs], sqlPath)
    console.error('Done.')
  } finally {
    try {
      unlinkSync(sqlPath)
    } catch {
      /* ignore */
    }
  }
}

main()
