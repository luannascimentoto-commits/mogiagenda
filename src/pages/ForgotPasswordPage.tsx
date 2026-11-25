import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from '@/components/AuthLayout'
import { errorBoxClass, inputClass, primaryButtonClass } from '@/components/styles'

const schema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
})
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit({ email }: FormValues) {
    setServerError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    if (error) {
      setServerError(
        error.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
          : 'Não foi possível enviar agora. Tente novamente em instantes.',
      )
      return
    }
    // Mesma resposta exista ou não a conta: ninguém descobre quais e-mails estão cadastrados.
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout title="Verifique seu e-mail">
        <p className="text-sm leading-relaxed text-muted">
          Se o e-mail informado estiver cadastrado, você receberá um link para criar uma nova senha.
          Confira também a caixa de spam.
        </p>
        <Link
          to="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-[#bfcbce] bg-white font-semibold text-ink hover:bg-surface"
        >
          Voltar para o login
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Recuperar senha" subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha.">
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

        {serverError && <p role="alert" className={errorBoxClass}>{serverError}</p>}

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? 'Enviando…' : 'Enviar link'}
        </button>
        <div className="text-center">
          <Link to="/login" className="inline-block py-1.5 text-sm font-semibold text-brand-600 hover:underline">
            Voltar para o login
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
