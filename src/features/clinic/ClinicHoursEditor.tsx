import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { errorBoxClass, inputClass, primaryButtonClass } from '@/components/styles'
import type { ClinicHour } from './schema'
import { saveClinicHours } from './api'

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

interface Props {
  clinicId: string
  initial: ClinicHour[]
  onSaved: (message: string) => void
}

interface Row extends ClinicHour {
  key: string
}

function makeKey() {
  return Math.random().toString(36).slice(2)
}

export function ClinicHoursEditor({ clinicId, initial, onSaved }: Props) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [rowsByDay, setRowsByDay] = useState<Record<number, Row[]>>(() => {
    const base: Record<number, Row[]> = {}
    for (let d = 0; d < 7; d++) base[d] = []
    for (const h of initial) {
      base[h.weekday] = [...(base[h.weekday] ?? []), { ...h, key: makeKey() }]
    }
    return base
  })
  const [error, setError] = useState<string | null>(null)

  function addRow(day: number) {
    setRowsByDay((prev) => ({
      ...prev,
      [day]: [...prev[day], { weekday: day, opens_at: '08:00', closes_at: '12:00', key: makeKey() }],
    }))
  }

  function removeRow(day: number, key: string) {
    setRowsByDay((prev) => ({
      ...prev,
      [day]: prev[day].filter((r) => r.key !== key),
    }))
  }

  function updateRow(day: number, key: string, field: 'opens_at' | 'closes_at', value: string) {
    setRowsByDay((prev) => ({
      ...prev,
      [day]: prev[day].map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    }))
  }

  function validate(): string | null {
    for (let d = 0; d < 7; d++) {
      const rows = rowsByDay[d]
      for (const r of rows) {
        if (r.closes_at <= r.opens_at) return `Dia ${WEEKDAYS[d]}: fechamento deve ser após abertura.`
      }
      // sobreposição
      const sorted = [...rows].sort((a, b) => a.opens_at.localeCompare(b.opens_at))
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].opens_at < sorted[i - 1].closes_at) {
          return `Dia ${WEEKDAYS[d]}: faixas sobrepostas.`
        }
      }
    }
    return null
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('sem_permissao')
      const all: ClinicHour[] = []
      for (let d = 0; d < 7; d++) {
        for (const r of rowsByDay[d]) {
          all.push({ weekday: d, opens_at: r.opens_at, closes_at: r.closes_at })
        }
      }
      await saveClinicHours(clinicId, all)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clinic-hours'] })
      onSaved('Horários de funcionamento atualizados.')
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Não foi possível salvar.'),
  })

  function handleSave() {
    const v = validate()
    if (v) { setError(v); return }
    setError(null)
    mutation.mutate()
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
      <h2 className="font-display text-lg font-bold">Horário de funcionamento</h2>
      <p className="text-sm text-muted">Adicione uma ou mais faixas por dia (ex.: manhã e tarde).</p>

      <div className="space-y-4">
        {WEEKDAYS.map((name, day) => (
          <div key={day} className="rounded-xl border border-line p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold">{name}</span>
              <button type="button" onClick={() => addRow(day)} className="text-sm font-semibold text-brand-600 hover:underline">
                + Faixa
              </button>
            </div>
            {rowsByDay[day].length === 0 && (
              <p className="text-sm text-muted">Fechado</p>
            )}
            <div className="space-y-2">
              {rowsByDay[day].map((r) => (
                <div key={r.key} className="flex items-center gap-2">
                  <input type="time" value={r.opens_at} onChange={(e) => updateRow(day, r.key, 'opens_at', e.target.value)} className={`${inputClass} w-auto`} />
                  <span className="text-muted">até</span>
                  <input type="time" value={r.closes_at} onChange={(e) => updateRow(day, r.key, 'closes_at', e.target.value)} className={`${inputClass} w-auto`} />
                  <button type="button" onClick={() => removeRow(day, r.key)} className="h-9 rounded-lg border border-[#bfcbce] bg-white px-3 text-[13px] font-semibold hover:bg-surface">
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p role="alert" className={errorBoxClass}>{error}</p>}

      <button type="button" onClick={handleSave} disabled={mutation.isPending} className={primaryButtonClass}>
        {mutation.isPending ? 'Salvando…' : 'Salvar horários'}
      </button>
    </section>
  )
}