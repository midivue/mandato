import type { ReactNode } from 'react'
import { CardHeader, CardTitle } from '@/components/ui/card'

export function PageHeader({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children?: ReactNode
}) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <span className="hidden text-xs font-medium tracking-wide text-zinc-400 min-[401px]:inline">mandato.hu</span>
      </div>
      {children}
    </CardHeader>
  )
}
