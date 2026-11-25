import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { errorBoxClass, inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/styles'
import { listProfessionalsSimple2, listServicesSimple, createManualAppointment } from './api'
import { listPatients, createPatient } from '@/features/patients/api'
import { localToUtcIso } from '@/lib/timezone'
import { getClinic } from '@/features/clinic/api'

const schema = z.object({
  professional_id: z.string().min(1, 'Selecione o profissional.'),
  service_id: z.string().min(1, 'Selecione o serviço.'),
  patient_name: z.string().trim().min(2, 'Informe o nome.'),
  patient_phone: z.string().trim().min(10, 'Telefone inválido.'),
  patient_email: z.string().trim().email('E-mail inválido.').optional().or(z.literal('')),
  starts_at: z.string().min(1, 'Informe data e hora.'),
  notes: z.string().trim().max(300).optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

interface Props {
  appointment: any | null
  onCancel: () => void
  onSaved: (message: string) => void
}

export function AppointmentForm({ onCancel, onSaved }: Props) {
  const { profile } = useAuth()
  const { data: clinic } = useQuery({ queryKey: ['clinic'], queryFn: getClinic })
  const { data: professionals } = useQuery({ queryKey: ['professionals-simple'], queryFn: listProfessionalsSimple2 })
  const { data: services } = useQuery({ queryKey: ['services-simple'], queryFn: listServicesSimple })

  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      professional_id: '',
      service_id: '',
      patient_name: '',
      patient_phone: '',
      patient_email: '',
      starts_at: '',
      notes: '',
    },
  })

  const serviceId = watch('service_id')
  const selectedService = (services ?? []).find((s) => s.id === serviceId)

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!profile || !clinic) throw new Error('sem_permissao')
      // find or create patient
      const patients = await listPatients()
      let patient = patients.find((p) => p.phone === values.patient_phone.replace(/\D/g, ''))
      if (!patient) {
        patient = await createPatient({
          full_name: values.patient_name,
          phone: values.patient_phone.replace(/\D/g, ''),
          email: values.patient_email === '' ? null : values.patient_email!,
        })
      }
      const startsAt = localToUtcIso(values.starts_at, clinic.timezone)
      await createManualAppointment({
        professional_id: values.professional_id,
        service_id: values.service_id,
        patient_id: patient.id,
        starts_at: startsAt,
        duration_minutes: selectedService?.duration_minutes ?? 30,
        notes: values.notes === '' ? null : values.notes,
      })
    },
    onSuccess: async () => {
      onSaved('Agendamento criado.')
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('exclusion') || msg.includes('conflict') || msg.includes('23P01')) {
        setServerError('Conflito de horário: já existe agendamento neste período.')
      } else {
        setServerError(msg || 'Não foi possível criar o agendamento.')
      }
    },
  })

  function onSubmit(values: FormValues) {
    setServerError(null)
    mutation.mutate(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Profissional</label>
        <select className={inputClass} {...register('professional_id')}>
          <option value="">Selecione</option>
          {(professionals ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {errors.professional_id && <p role="alert" className="text-sm text-danger">{errors.professional_id.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Serviço</label>
        <select className={inputClass} {...register('service_id')}>
          <option value="">Selecione</option>
          {(services ?? []).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
        </select>
        {errors.service_id && <p role="alert" className="text-sm text-danger">{errors.service_id.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Nome do paciente</label>
        <input className={inputClass} {...register('patient_name')} />
        {errors.patient_name && <p role="alert" className="text-sm text-danger">{errors.patient_name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Telefone</label>
        <input className={inputClass} {...register('patient_phone')} placeholder="11999999999" />
        {errors.patient_phone && <p role="alert" className="text-sm text-danger">{errors.patient_phone.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">E-mail (opcional)</label>
        <input type="email" className={inputClass} {...register('patient_email')} />
        {errors.patient_email && <p role="alert" className="text-sm text-danger">{errors.patient_email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Data e hora</label>
        <input type="datetime-local" className={inputClass} {...register('starts_at')} />
        {errors.starts_at && <p role="alert" className="text-sm text-danger">{errors.starts_at.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Observações (opcional)</label>
        <textarea rows={2} className="w-full rounded-[10px] border border-[#bfcbce] bg-white px-3.5 py-3 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30" {...register('notes')} />
      </div>

      {serverError && <p role="alert" className={errorBoxClass}>{serverError}</p>}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className={`${secondaryButtonClass} flex-1`}>Cancelar</button>
        <button type="submit" disabled={mutation.isPending} className={`${primaryButtonClass} flex-1`}>
          {mutation.isPending ? 'Salvando…' : 'Criar agendamento'}
        </button>
      </div>
    </form>
  )
}