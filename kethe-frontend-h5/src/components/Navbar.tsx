
import type { ReactNode } from 'react'
import { clsx } from 'clsx'

interface NavbarProps {
  title: string
  right?: ReactNode
  className?: string
}

export function Navbar({ title, right, className }: NavbarProps) {
  return (
    <header className={clsx('home-navbar', className)}>
      <h1>{title}</h1>
      {right}
    </header>
  )
}
