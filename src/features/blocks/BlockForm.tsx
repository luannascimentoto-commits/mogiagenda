import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { errorBoxClass, inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/styles'
import { blockSchema, type BlockFormValues, BRAZIL_HOLIDAYS } from './schema'
import { createTimeBlock, findConflictingAppointments, listProfessionalsSimple } from './api'
import { localToUtcIso } from '@/lib/timezone'
import type { Clinic } from '@/features/clinic/schema'

interface Props {
  clinic: Clinic
  professionals: { id: string; name: string }[]
  onCancel: () => void
  onSaved: (message: string) => void
}

export function BlockForm({ clinic, onCancel, onSaved }: Props) {
  const { profile } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<{ id: string }[] | null>(null)
  const [pendingValues, setPendingValues] = useState<BlockFormValues | null>(null)

  const { data: professionals } = useQuery({ queryKey: ['professionals-simple'], queryFn: listProfessionalsSimple })

  const { register, handleSubmit, watch, formState: { errors } } = useForm<BlockFormValues>({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      scope: 'clinic',
      professional_id: '',
      starts_at: '',
      ends_at: '',
      reason: '',
    },
  })

  const scope = watch('scope')

  const mutation = useMutation({
    mutationFn: async (values: BlockFormValues) => {
      if (!profile) throw new Error('sem_permissao')
      const professionalId = values.scope === 'professional' ? values.professional_id || null : null
      const startsAt = localToUtcIso(values.starts_at, clinic.timezone)
      const endsAt = localToUtcIso(values.ends_at, clinic.timezone)
      await createTimeBlock({
        professional_id: professionalId,
        starts_at: startsAt,
        ends_at: endsAt,
        reason: values.reason === '' ? null : values.reason!,
      })
    },
    onSuccess: async () => {
      onSaved('Bloqueio criado.')
    },
    onError: (e) => setServerError(e instanceof Error ? e.message : 'Não foi possível criar.'),
  })

  async function onSubmit(values: BlockFormValues) {
    setServerError(null)
    setConflicts(null)
    const professionalId = values.scope === 'professional' ? values.professional_id || null : null
    const startsAt = localToUtcIso(values.starts_at, clinic.timezone)
    const endsAt = localToUtcIso(values.ends_at, clinic.timezone)
    // checar conflitos
    try {
      const c = await findConflictingAppointments(startsAt, endsAt, professionalId)
      if (c.length > 0 && !pendingValues) {
        setConflicts(c)
        setPendingValues(values)
        return
      }
    } catch (e) {
      // ignora erro de conflito
    }
    setPendingValues(null)
    mutation.mutate(values)
  }

  function confirmCreate() {
    if (pendingValues) {
      setConflicts(null)
      setPendingValues(null)
      mutation.mutate(pendingValues)
    }
  }

  function cancelCreate() {
    setConflicts(null)
    setPendingValues(null)
  }

  async function addHolidays(year: number) {
    if (!window.confirm(`Adicionar feriados nacionais de ${year} como bloqueios de dia inteiro?`)) return
    for (const h of BRAZIL_HOLIDAYS) {
      const start = `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}T00:00`
      const end = `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}T23:59`
      try {
        await createTimeBlock({
          professional_id: null,
          starts_at: localToUtcIso(start, clinic.timezone),
          ends_at: localToUtcIso(end, clinic.timezone),
          reason: h.name,
        })
      } catch (e) {
        // ignora duplicados
      }
    }
    onSaved('Feriados adicionados.')
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Escopo</label>
          <select className={inputClass} {...register('scope')}>
            <option value="clinic">Clínica inteira</option>
            <option value="professional">Profissional específico</option>
          </select>
        </div>

        {scope === 'professional' && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Profissional</label>
            <select className={inputClass} {...register('professional_id')}>
              <option value="">Selecione</option>
              {(professionals ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.professional_id && <p role="alert" className="text-sm text-danger">{errors.professional_id.message}</p>}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Início</label>
            <input type="datetime-local" className={inputClass} {...register('starts_at')} />
            {errors.starts_at && <p role="alert" className="text-sm text-danger">{errors.starts_at.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Fim</label>
            <input type="datetime-local" className={inputClass} {...register('ends_at')} />
            {errors.ends_at && <p role="alert" className="text-sm text-danger">{errors.ends_at.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Motivo (opcional)</label>
          <input className={inputClass} {...register('reason')} />
        </div>

        {serverError && <p role="alert" className={errorBoxClass}>{serverError}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCancel} className={`${secondaryButtonClass} flex-1`}>Cancelar</button>
          <button type="submit" disabled={mutation.isPending} className={`${primaryButtonClass} flex-1`}>
            {mutation.isPending ? 'Salvando…' : 'Criar bloqueio'}
          </button>
        </div>
      </form>

      {conflicts && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-800">Existem {conflicts.length} agendamento(s) no período.</p>
          <p className="text-sm text-amber-800">O sistema não cancela automaticamente. Deseja criar o bloqueio mesmo assim?</p>
          <div className="flex gap-3">
            <button onClick={cancelCreate} className={`${secondaryButtonClass} flex-1`}>Cancelar</button>
            <button onClick={confirmCreate} className={`${primaryButtonClass} flex-1`}>Criar mesmo assim</button>
          </div>
        </div>
      )}

      <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-bold">Feriados nacionais</h2>
        <p className="text-sm text-muted">Adiciona bloqueios de dia inteiro para a clínica.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => addHolidays(new Date().getFullYear())} className={secondaryButtonClass}>
            Feriados {new Date().getFullYear()}
          </button>
          <button type="button" onClick={() => addHolidays(new Date().getFullYear() + 1)} className={secondaryButtonClass}>
            Feriados {new Date().getFullYear() + 1}
          </button>
        </div>
      </section>
    </div>
  )
}