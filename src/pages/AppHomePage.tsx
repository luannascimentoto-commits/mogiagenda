import { useAuth } from '@/auth/useAuth'
import { roleLabels } from '@/auth/roles'

/** Painel (provisório). Os indicadores entram no bloco 4.5. */
export default function AppHomePage() {
  const { profile, clinic } = useAuth()

  return (
    <div className="space-y-2">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Olá, {profile?.full_name}
      </h1>
      <p className="text-muted">
        {clinic?.name} · {profile ? roleLabels[profile.role] : ''}
      </p>
      <p className="pt-2 text-sm text-muted">O painel com os indicadores será construído no bloco 4.5.</p>
    </div>
  )
}
