import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-white hover:bg-zinc-700',
        outline: 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
        ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
      },
      size: {
        // Default: min 44px on mobile, 36px on md+
        default: 'min-h-11 px-4 py-2 md:min-h-9 md:h-9',
        sm: 'min-h-10 rounded-md px-3 md:min-h-8 md:h-8',
        // Explicit touch sizes for prominent CTAs
        touch: 'min-h-11 px-4 py-2',
        touchLg: 'min-h-14 px-6 py-3 text-base font-semibold',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
