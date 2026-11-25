import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { serviceSchema, DURATIONS, type ServiceFormValues } from './schema'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import {
  errorBoxClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/styles'
import { parsePrice, priceToInput } from '@/lib/format'
import { createService, updateService } from './api'
import type { Service } from './types'

// DURATIONS importado de ./schema

function friendlyError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code
  const message = error instanceof Error ? error.message : ''
  if (code === '42501' || message === 'sem_permissao') {
    return 'Você não tem permissão para esta ação.'
  }
  return 'Não foi possível salvar. Tente novamente.'
}

interface Props {
  service: Service | null // null = novo serviço
  onCancel: () => void
  onSaved: (message: string) => void
}

export function ServiceForm({ service, onCancel, onSaved }: Props) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      duration: String(service?.duration_minutes ?? 30),
      price: priceToInput(service?.price_cents ?? null),
      is_active: service?.is_active ?? true,
    },
  })

  // Se o serviço já tem uma duração fora da lista padrão, ela continua aparecendo.
  const current = service?.duration_minutes
  const durations =
    current && !DURATIONS.includes(current) ? [...DURATIONS, current].sort((a, b) => a - b) : DURATIONS

  const mutation = useMutation({
    mutationFn: async (input: Omit<Service, 'id'>) => {
      if (!profile) throw new Error('sem_permissao')
      if (service) await updateService(service.id, input)
      else await createService(profile.clinic_id, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['services'] })
      onSaved(service ? 'Serviço atualizado.' : 'Serviço criado.')
    },
    onError: (error) => setServerError(friendlyError(error)),
  })

  function onSubmit(values: ServiceFormValues) {
    const price = parsePrice(values.price)
    if (!price.ok) return
    setServerError(null)
    mutation.mutate({
      name: values.name,
      description: values.description === '' ? null : values.description,
      duration_minutes: Number(values.duration),
      price_cents: price.cents,
      is_active: values.is_active,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-semibold">Nome</label>
        <input id="name" type="text" aria-invalid={!!errors.name} className={inputClass} {...register('name')} />
        {errors.name && <p role="alert" className="text-sm text-danger">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-semibold">
          Descrição <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          aria-invalid={!!errors.description}
          className="w-full rounded-[10px] border border-[#bfcbce] bg-white px-3.5 py-3 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30"
          {...register('description')}
        />
        {errors.description && <p role="alert" className="text-sm text-danger">{errors.description.message}</p>}
      </div>

      <div className="flex gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor="duration" className="text-sm font-semibold">Duração</label>
          <select id="duration" className={inputClass} {...register('duration')}>
            {durations.map((d) => (
              <option key={d} value={d}>{d} minutos</option>
            ))}
          </select>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor="price" className="text-sm font-semibold">
            Valor (R$) <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            id="price"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            aria-invalid={!!errors.price}
            className={inputClass}
            {...register('price')}
          />
        </div>
      </div>
      {errors.price && <p role="alert" className="-mt-3 text-sm text-danger">{errors.price.message}</p>}
      <p className="-mt-2 text-xs text-muted">Sem valor, nenhum preço é mostrado ao paciente.</p>

      <div className="flex items-center gap-3 text-[15px]">
        <input id="is_active" type="checkbox" className="h-5 w-5" {...register('is_active')} />
        <label htmlFor="is_active">Disponível para agendamento</label>
      </div>

      {serverError && <p role="alert" className={errorBoxClass}>{serverError}</p>}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className={`${secondaryButtonClass} flex-1`}>
          Cancelar
        </button>
        <button type="submit" disabled={mutation.isPending} className={`${primaryButtonClass} flex-1`}>
          {mutation.isPending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
