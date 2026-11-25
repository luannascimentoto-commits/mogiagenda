import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '@/components/AuthLayout'
import { errorBoxClass, inputClass, primaryButtonClass } from '@/components/styles'
import { useAuth } from '@/auth/useAuth'

const schema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (!loading && session) return <Navigate to="/app" replace />

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const error = await signIn(values.email.trim(), values.password)
    if (error) setServerError(error)
  }

  return (
    <AuthLayout title="Entrar" subtitle="Acesse o painel da sua clínica.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            aria-invalid={!!errors.email}
            className={inputClass}
            {...register('email')}
          />
          {errors.email && <p role="alert" className="text-sm text-danger">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-semibold">Senha</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            className={inputClass}
            {...register('password')}
          />
          {errors.password && <p role="alert" className="text-sm text-danger">{errors.password.message}</p>}
          <div className="text-right">
            <Link
              to="/recuperar-senha"
              className="inline-block py-1.5 text-sm font-semibold text-brand-600 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        {serverError && <p role="alert" className={errorBoxClass}>{serverError}</p>}

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  )
}
