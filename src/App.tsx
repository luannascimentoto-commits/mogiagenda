import Login from './Login'
import { supabase } from './lib/supabase'
import { useSession } from './useSession'

export default function App() {
  const { session, loading } = useSession()

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-muted">Carregando…</main>
  }

  if (!session) return <Login />

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-line bg-white p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Agenda<span className="text-brand-600">Mogi</span>
        </h1>
        <p className="text-muted">Você entrou como {session.user.email}.</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="h-11 w-full rounded-[10px] border border-line font-semibold hover:bg-surface"
        >
          Sair
        </button>
      </div>
    </main>
  )
}