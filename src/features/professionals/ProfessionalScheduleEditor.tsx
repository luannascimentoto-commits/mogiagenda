import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { errorBoxClass, inputClass, primaryButtonClass } from '@/components/styles'
import { listClinicHours } from '@/features/clinic/api'
import { listProfessionalSchedules, saveProfessionalSchedules } from './api'
import type { ProfessionalSchedule } from './schema'

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

interface Props {
  professionalId: string
  onSaved: (message: string) => void
}

interface Row extends ProfessionalSchedule {
  key: string
}

function makeKey() { return Math.random().toString(36).slice(2) }

export function ProfessionalScheduleEditor({ professionalId, onSaved }: Props) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: initial } = useQuery({ queryKey: ['prof-schedules', professionalId], queryFn: () => listProfessionalSchedules(professionalId) })
  const { data: clinicHours } = useQuery({ queryKey: ['clinic-hours'], queryFn: listClinicHours })

  const [rowsByDay, setRowsByDay] = useState<Record<number, Row[]>>({})
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    if (!initial || initialized) return
    const base: Record<number, Row[]> = {}
    for (let d = 0; d < 7; d++) base[d] = []
    for (const h of initial) {
      base[h.weekday] = [...(base[h.weekday] ?? []), { ...h, key: makeKey() }]
    }
    setRowsByDay(base)
    setInitialized(true)
  }, [initial, initialized])

  // garantir base inicializada mesmo sem dados
  useEffect(() => {
    if (initialized) return
    const base: Record<number, Row[]> = {}
    for (let d = 0; d < 7; d++) base[d] = []
    setRowsByDay(base)
  }, [initialized])

  function addRow(day: number) {
    setRowsByDay((prev) => ({ ...prev, [day]: [...(prev[day] ?? []), { weekday: day, starts_at: '08:00', ends_at: '12:00', key: makeKey() }] }))
  }
  function removeRow(day: number, key: string) {
    setRowsByDay((prev) => ({ ...prev, [day]: (prev[day] ?? []).filter((r) => r.key !== key) }))
  }
  function updateRow(day: number, key: string, field: 'starts_at' | 'ends_at', value: string) {
    setRowsByDay((prev) => ({ ...prev, [day]: (prev[day] ?? []).map((r) => (r.key === key ? { ...r, [field]: value } : r)) }))
  }

  function checkOutsideClinic(): string | null {
    if (!clinicHours) return null
    const msgs: string[] = []
    for (let d = 0; d < 7; d++) {
      for (const r of rowsByDay[d] ?? []) {
        const clinicRanges = clinicHours.filter((c) => c.weekday === d)
        const inside = clinicRanges.some((c) => r.starts_at >= c.opens_at && r.ends_at <= c.closes_at)
        if (!inside && clinicRanges.length > 0) msgs.push(WEEKDAYS[d])
      }
    }
    if (msgs.length === 0) return null
    return `Atenção: horários fora do funcionamento da clínica em: ${[...new Set(msgs)].join(', ')}.`
  }

  function validate(): string | null {
    for (let d = 0; d < 7; d++) {
      for (const r of rowsByDay[d] ?? []) {
        if (r.ends_at <= r.starts_at) return `${WEEKDAYS[d]}: fim deve ser após o início.`
      }
      const sorted = [...(rowsByDay[d] ?? [])].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].starts_at < sorted[i - 1].ends_at) return `${WEEKDAYS[d]}: faixas sobrepostas.`
      }
    }
    return null
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('sem_permissao')
      const all: ProfessionalSchedule[] = []
      for (let d = 0; d < 7; d++) {
        for (const r of rowsByDay[d] ?? []) all.push({ weekday: d, starts_at: r.starts_at, ends_at: r.ends_at })
      }
      await saveProfessionalSchedules(professionalId, all)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['prof-schedules', professionalId] })
      onSaved('Horários de atendimento atualizados.')
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Não foi possível salvar.'),
  })

  function handleSave() {
    const v = validate()
    if (v) { setError(v); return }
    setError(null)
    setWarning(checkOutsideClinic())
    mutation.mutate()
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
      <h2 className="font-display text-lg font-bold">Horários de atendimento</h2>
      <p className="text-sm text-muted">Faixas em que este profissional atende.</p>

      <div className="space-y-4">
        {WEEKDAYS.map((name, day) => (
          <div key={day} className="rounded-xl border border-line p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold">{name}</span>
              <button type="button" onClick={() => addRow(day)} className="text-sm font-semibold text-brand-600 hover:underline">+ Faixa</button>
            </div>
            {(rowsByDay[day] ?? []).length === 0 && <p className="text-sm text-muted">Não atende</p>}
            <div className="space-y-2">
              {(rowsByDay[day] ?? []).map((r) => (
                <div key={r.key} className="flex items-center gap-2">
                  <input type="time" value={r.starts_at} onChange={(e) => updateRow(day, r.key, 'starts_at', e.target.value)} className={`${inputClass} w-auto`} />
                  <span className="text-muted">até</span>
                  <input type="time" value={r.ends_at} onChange={(e) => updateRow(day, r.key, 'ends_at', e.target.value)} className={`${inputClass} w-auto`} />
                  <button type="button" onClick={() => removeRow(day, r.key)} className="h-9 rounded-lg border border-[#bfcbce] bg-white px-3 text-[13px] font-semibold hover:bg-surface">Remover</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {warning && <p role="status" className="rounded-[10px] bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">{warning}</p>}
      {error && <p role="alert" className={errorBoxClass}>{error}</p>}

      <button type="button" onClick={handleSave} disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Salvando…' : 'Salvar horários'}
      </button>
    </section>
  )
}