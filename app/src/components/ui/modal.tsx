import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, children, maxWidth = 'max-w-md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusable[0]?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        className={`mx-4 w-full ${maxWidth} rounded-xl border border-zinc-200 bg-white p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ title, onClose, className = 'text-zinc-900' }: { title: string; onClose: () => void; className?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className={`text-sm font-semibold ${className}`}>{title}</h3>
      <button type="button" onClick={onClose} className="rounded p-1 text-zinc-400 transition-colors hover:text-zinc-700">
        <X className="size-4" />
      </button>
    </div>
  )
}
