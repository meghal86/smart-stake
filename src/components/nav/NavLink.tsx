'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ComponentProps } from 'react'

type Props = ComponentProps<typeof Link> & {
  icon?: React.ReactNode
  label: string
  activeMatch?: string
}

export function NavLink({ href, icon, label, activeMatch, className, ...rest }: Props) {
  const pathname = usePathname()
  const isActive = activeMatch
    ? pathname?.startsWith(activeMatch)
    : pathname === href

  return (
    <Link
      href={href}
      className={[
        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
        isActive
          ? 'bg-slate-800 text-teal-400'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white',
        className || '',
      ].join(' ')}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
    >
      <span aria-hidden>{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  )
}
