import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { errorBoxClass, inputClass, primaryButtonClass } from '@/components/styles'
import { clinicSchema, type Clinic, type ClinicFormValues, TIMEZONES } from './schema'
import { updateClinic } from './api'

interface Props {
  clinic: Clinic
  onSaved: (message: string) => void
}

export function ClinicForm({ clinic, onSaved }: Props) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      name: clinic.name,
      address_line: clinic.address_line ?? '',
      city: clinic.city ?? '',
      state: clinic.state ?? '',
      zip_code: clinic.zip_code ?? '',
      phone: clinic.phone ?? '',
      whatsapp: clinic.whatsapp ?? '',
      email: clinic.email ?? '',
      timezone: clinic.timezone,
      booking_min_notice_hours: clinic.booking_min_notice_hours,
      booking_max_days_ahead: clinic.booking_max_days_ahead,
      slot_step_minutes: clinic.slot_step_minutes,
      auto_confirm: clinic.auto_confirm,
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: ClinicFormValues) => {
      if (!profile) throw new Error('sem_permissao')
      await updateClinic(clinic.id, values)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clinic'] })
      onSaved('Dados da clínica atualizados.')
    },
    onError: (e) => setServerError(e instanceof Error ? e.message : 'Não foi possível salvar.'),
  })

  function onSubmit(values: ClinicFormValues) {
    setServerError(null)
    mutation.mutate(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-bold">Dados da clínica</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da clínica" error={errors.name?.message}>
            <input className={inputClass} {...register('name')} />
          </Field>
          <Field label="E-mail" error={errors.email?.message}>
            <input type="email" className={inputClass} {...register('email')} />
          </Field>
          <Field label="Telefone" error={errors.phone?.message}>
            <input className={inputClass} {...register('phone')} />
          </Field>
          <Field label="WhatsApp" error={errors.whatsapp?.message}>
            <input className={inputClass} {...register('whatsapp')} />
          </Field>
          <Field label="Endereço" error={errors.address_line?.message}>
            <input className={inputClass} {...register('address_line')} />
          </Field>
          <Field label="Cidade" error={errors.city?.message}>
            <input className={inputClass} {...register('city')} />
          </Field>
          <Field label="Estado (UF)" error={errors.state?.message}>
            <input className={inputClass} maxLength={2} {...register('state')} />
          </Field>
          <Field label="CEP" error={errors.zip_code?.message}>
            <input className={inputClass} {...register('zip_code')} />
          </Field>
          <Field label="Fuso horário" error={errors.timezone?.message}>
            <select className={inputClass} {...register('timezone')}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-bold">Regras de agendamento</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Antecedência mínima (horas)" error={errors.booking_min_notice_hours?.message}>
            <input type="number" min={0} className={inputClass} {...register('booking_min_notice_hours', { valueAsNumber: true })} />
          </Field>
          <Field label="Dias máximos à frente" error={errors.booking_max_days_ahead?.message}>
            <input type="number" min={1} max={365} className={inputClass} {...register('booking_max_days_ahead', { valueAsNumber: true })} />
          </Field>
          <Field label="Passo dos horários (minutos)" error={errors.slot_step_minutes?.message}>
            <select className={inputClass} {...register('slot_step_minutes', { valueAsNumber: true })}>
              {[5, 10, 15, 20, 30, 60].map((v) => <option key={v} value={v}>{v} min</option>)}
            </select>
          </Field>
          <div className="flex items-center gap-3 pt-6">
            <input id="auto_confirm" type="checkbox" className="h-5 w-5" {...register('auto_confirm')} />
            <label htmlFor="auto_confirm" className="text-[15px] font-medium">Confirmar agendamentos automaticamente</label>
          </div>
        </div>
      </section>

      {serverError && <p role="alert" className={errorBoxClass}>{serverError}</p>}

      <button type="submit" disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Salvando…' : 'Salvar dados'}
      </button>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold">{label}</label>
      {children}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  )
}