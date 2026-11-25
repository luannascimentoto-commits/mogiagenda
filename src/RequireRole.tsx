import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import type { Profile } from '@/auth/auth-context'

type Role = Profile['role']

/**
 * Só deixa passar quem tem um dos papéis informados.
 * Aceita a prop como `allow` ou `roles`, e funciona das duas formas:
 *   <Route element={<RequireRole allow={['admin']} />}> ... </Route>
 *   <RequireRole allow={['admin']}><Pagina /></RequireRole>
 */
export function RequireRole({
  allow,
  roles,
  children,
}: {
  allow?: Role[]
  roles?: Role[]
  children?: ReactNode
}) {
  const { profile } = useAuth()
  const permitidos = allow ?? roles ?? []

  if (!profile || !permitidos.includes(profile.role)) {
    return <Navigate to="/app" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
