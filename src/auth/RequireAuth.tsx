import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'

/**
 * Só deixa passar quem está logado e com perfil ativo.
 * Funciona das duas formas:
 *   <Route element={<RequireAuth />}> ... </Route>
 *   <RequireAuth><AppLayout /></RequireAuth>
 */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { session, profile, loading, signOut } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-muted">Carregando…</main>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Logou, mas não tem perfil ou foi desativado: não entra no painel.
  if (!profile || !profile.is_active) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-muted">Seu acesso não está ativo. Fale com o administrador da clínica.</p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#bfcbce] bg-white px-5 font-semibold text-ink hover:bg-surface"
        >
          Sair
        </button>
      </main>
    )
  }

  return children ? <>{children}</> : <Outlet />
}
