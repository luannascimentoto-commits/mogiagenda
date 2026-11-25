import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { errorBoxClass, inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/styles'
import { createPatient, updatePatient } from './api'
import type { Patient } from './api'

const schema = z.object({
  full_name: z.string().trim().min(2, 'Informe o nome.'),
  phone: z.string().trim().min(10, 'Telefone inválido.'),
  email: z.string().trim().email('E-mail inválido.').optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

interface Props {
  patient: Patient | null
  onCancel: () => void
  onSaved: (message: string) => void
}

export function PatientForm({ patient, onCancel, onSaved }: Props) {
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: patient?.full_name ?? '',
      phone: patient?.phone ?? '',
      email: patient?.email ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const input = { full_name: values.full_name, phone: values.phone.replace(/\D/g, ''), email: values.email === '' ? null : values.email! }
      if (patient) await updatePatient(patient.id, input)
      else await createPatient(input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['patients'] })
      onSaved(patient ? 'Paciente atualizado.' : 'Paciente criado.')
    },
    onError: (e) => setServerError(e instanceof Error ? e.message : 'Não foi possível salvar.'),
  })

  return (
    <form onSubmit={handleSubmit((v) => { setServerError(null); mutation.mutate(v) })} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Nome</label>
        <input className={inputClass} {...register('full_name')} />
        {errors.full_name && <p role="alert" className="text-sm text-danger">{errors.full_name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Telefone</label>
        <input className={inputClass} {...register('phone')} placeholder="11999999999" />
        {errors.phone && <p role="alert" className="text-sm text-danger">{errors.phone.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">E-mail (opcional)</label>
        <input type="email" className={inputClass} {...register('email')} />
        {errors.email && <p role="alert" className="text-sm text-danger">{errors.email.message}</p>}
      </div>
      {serverError && <p role="alert" className={errorBoxClass}>{serverError}</p>}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className={`${secondaryButtonClass} flex-1`}>Cancelar</button>
        <button type="submit" disabled={mutation.isPending} className={`${primaryButtonClass} flex-1`}>
          {mutation.isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}