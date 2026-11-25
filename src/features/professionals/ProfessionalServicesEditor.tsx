import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { errorBoxClass, inputClass, primaryButtonClass } from '@/components/styles'
import { listAllServices, listProfessionalServices, saveProfessionalServices } from './api'


interface Props {
  professionalId: string
  onSaved: (message: string) => void
}

interface LinkState {
  service_id: string
  name: string
  baseDuration: number
  basePrice: number | null
  selected: boolean
  overrideDuration: string
  overridePrice: string
}

export function ProfessionalServicesEditor({ professionalId, onSaved }: Props) {
  const queryClient = useQueryClient()
  const { data: allServices } = useQuery({ queryKey: ['services-all-active'], queryFn: listAllServices })
  const { data: current } = useQuery({ queryKey: ['prof-services', professionalId], queryFn: () => listProfessionalServices(professionalId) })

  const [links, setLinks] = useState<LinkState[]>([])
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!allServices || !current || initialized) return
    const byId = new Map(current.map((c) => [c.service_id, c]))
    setLinks(
      allServices.map((s) => {
        const c = byId.get(s.id)
        return {
          service_id: s.id,
          name: s.name,
          baseDuration: s.duration_minutes,
          basePrice: s.price_cents,
          selected: !!c,
          overrideDuration: c?.override_duration != null ? String(c.override_duration) : '',
          overridePrice: c?.override_price != null ? (c.override_price / 100).toFixed(2).replace('.', ',') : '',
        }
      }),
    )
    setInitialized(true)
  }, [allServices, current, initialized])

  const mutation = useMutation({
    mutationFn: async () => {
      const selected = links.filter((l) => l.selected).map((l) => ({
        service_id: l.service_id,
        duration_minutes: l.overrideDuration.trim() === '' ? null : Number(l.overrideDuration),
        price_cents: l.overridePrice.trim() === '' ? null : Math.round(parseFloat(l.overridePrice.replace(',', '.')) * 100),
      }))
      await saveProfessionalServices(professionalId, selected)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['prof-services', professionalId] })
      onSaved('Serviços do profissional atualizados.')
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Não foi possível salvar.'),
  })

  function toggle(id: string) {
    setLinks((prev) => prev.map((l) => (l.service_id === id ? { ...l, selected: !l.selected } : l)))
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
      <h2 className="font-display text-lg font-bold">Serviços que realiza</h2>
      <p className="text-sm text-muted">Marque os serviços e, se quiser, sobrescreva duração/valor para este profissional.</p>

      {links.length === 0 && <p className="text-sm text-muted">Carregando…</p>}

      <div className="space-y-2">
        {links.map((l) => (
          <div key={l.service_id} className="rounded-xl border border-line p-3">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={l.selected} onChange={() => toggle(l.service_id)} className="h-5 w-5" />
              <span className="font-semibold">{l.name}</span>
              <span className="text-xs text-muted">base: {l.baseDuration} min {l.basePrice != null ? `· R$ ${(l.basePrice/100).toFixed(2)}` : ''}</span>
            </div>
            {l.selected && (
              <div className="mt-2 grid grid-cols-2 gap-2 pl-8">
                <input
                  type="number"
                  placeholder="duração (min)"
                  value={l.overrideDuration}
                  onChange={(e) => setLinks((prev) => prev.map((x) => (x.service_id === l.service_id ? { ...x, overrideDuration: e.target.value } : x)))}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="valor (R$)"
                  value={l.overridePrice}
                  onChange={(e) => setLinks((prev) => prev.map((x) => (x.service_id === l.service_id ? { ...x, overridePrice: e.target.value } : x)))}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p role="alert" className={errorBoxClass}>{error}</p>}

      <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Salvando…' : 'Salvar serviços'}
      </button>
    </section>
  )
}