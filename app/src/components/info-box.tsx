import type { ReactNode } from 'react'

export function InfoBox({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2">
      <span className="shrink-0 text-zinc-400">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="text-sm font-bold tabular-nums text-zinc-900">{value}</p>
      </div>
    </div>
  )
}
