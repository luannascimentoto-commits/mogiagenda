import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('E-mail ou senha incorretos.')
    setBusy(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-line bg-white p-8"
      >
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Agenda<span className="text-brand-600">Mogi</span>
        </h1>
        <p className="text-muted">Entre para acessar a sua agenda.</p>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">E-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-line px-3 outline-none focus:border-brand-600"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Senha</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-line px-3 outline-none focus:border-brand-600"
          />
        </label>

        {error && <p className="text-sm font-semibold text-danger">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="h-11 w-full rounded-[10px] bg-brand-600 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}