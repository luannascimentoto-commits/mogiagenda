import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { errorBoxClass, inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/styles'
import { createUserSchema, type CreateUserValues } from './schema'
import { createUser } from './api'

interface Props {
  onCancel: () => void
  onSaved: (message: string) => void
}

export function UserForm({ onCancel, onSaved }: Props) {
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', full_name: '', role: 'receptionist' },
  })

  const mutation = useMutation({
    mutationFn: async (values: CreateUserValues) => createUser(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      onSaved('Usuário criado. Um e-mail de definição de senha foi enviado.')
    },
    onError: (e) => setServerError(e instanceof Error ? e.message : 'Não foi possível criar.'),
  })

  function onSubmit(values: CreateUserValues) {
    setServerError(null)
    mutation.mutate(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Nome</label>
        <input className={inputClass} {...register('full_name')} />
        {errors.full_name && <p role="alert" className="text-sm text-danger">{errors.full_name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">E-mail</label>
        <input type="email" className={inputClass} {...register('email')} />
        {errors.email && <p role="alert" className="text-sm text-danger">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Papel</label>
        <select className={inputClass} {...register('role')}>
          <option value="admin">Administrador</option>
          <option value="receptionist">Recepção</option>
          <option value="professional">Profissional</option>
        </select>
      </div>

      {serverError && <p role="alert" className={errorBoxClass}>{serverError}</p>}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className={`${secondaryButtonClass} flex-1`}>Cancelar</button>
        <button type="submit" disabled={mutation.isPending} className={`${primaryButtonClass} flex-1`}>
          {mutation.isPending ? 'Criando…' : 'Criar usuário'}
        </button>
      </div>
    </form>
  )
}