import type { ReactNode } from 'react'
import { Logo } from './Logo'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
}

/** Moldura das telas públicas de acesso: logotipo + cartão branco. */
export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="space-y-5 rounded-2xl border border-line bg-white p-7">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}
