import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/useAuth'
import { AuthLayout } from '@/components/AuthLayout'
import { errorBoxClass, inputClass, primaryButtonClass } from '@/components/styles'

const schema = z
  .object({
    password: z.string().min(8, 'Use pelo menos 8 caracteres.'),
    confirm: z.string().min(1, 'Repita a senha.'),
  })
  .refine((v) => v.password === v.confirm, { message: 'As senhas não conferem.', path: ['confirm'] })
type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const { session, loading } = useAuth()
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit({ password }: FormValues) {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      if (error.code === 'same_password') setServerError('Escolha uma senha diferente da anterior.')
      else if (error.code === 'weak_password') setServerError('Senha muito fraca. Escolha uma senha mais difícil de adivinhar.')
      else setServerError('Não foi possível alterar a senha. Solicite um novo link e tente de novo.')
      return
    }
    setDone(true)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-muted">Carregando…</main>
    )
  }

  // Sem sessão = o link do e-mail é inválido, já foi usado ou expirou.
  if (!session) {
    return (
      <AuthLayout title="Link inválido ou expirado">
        <p className="text-sm leading-relaxed text-muted">
          Este link de recuperação não é mais válido. Solicite um novo para continuar.
        </p>
        <Link to="/recuperar-senha" className={primaryButtonClass}>
          Solicitar novo link
        </Link>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout title="Senha alterada">
        <p className="text-sm leading-relaxed text-muted">Sua nova senha já está valendo.</p>
        <Link to="/app" className={primaryButtonClass}>
          Ir para o painel
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Criar nova senha" subtitle="Escolha uma senha com pelo menos 8 caracteres.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-semibold">Nova senha</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            className={inputClass}
            {...register('password')}
          />
          {errors.password && <p role="alert" className="text-sm text-danger">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm" className="text-sm font-semibold">Repita a nova senha</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirm}
            className={inputClass}
            {...register('confirm')}
          />
          {errors.confirm && <p role="alert" className="text-sm text-danger">{errors.confirm.message}</p>}
        </div>

        {serverError && <p role="alert" className={errorBoxClass}>{serverError}</p>}

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </AuthLayout>
  )
}
