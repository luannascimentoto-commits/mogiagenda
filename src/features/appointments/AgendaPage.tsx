import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { errorBoxClass, inputClass, secondaryButtonClass } from '@/components/styles'
import { listAppointments } from './api'
import { listTimeBlocks } from '@/features/blocks/api'
import { getClinic } from '@/features/clinic/api'
import { listProfessionalsSimple2 } from './api'

export default function AgendaPage() {
  const { profile } = useAuth()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [professionalId, setProfessionalId] = useState('')

  const dateFrom = new Date(date + 'T00:00:00').toISOString()
  const dateTo = new Date(date + 'T23:59:59').toISOString()

  const { data: clinic } = useQuery({ queryKey: ['clinic'], queryFn: getClinic, enabled: !!profile })
  const { data: professionals } = useQuery({ queryKey: ['professionals-simple'], queryFn: listProfessionalsSimple2, enabled: !!profile })
  const { data: appointments, isPending, isError, refetch } = useQuery({
    queryKey: ['agenda', date, professionalId],
    queryFn: () => listAppointments({ dateFrom, dateTo, professionalId: professionalId || undefined }),
    enabled: !!profile,
  })
  const { data: blocks } = useQuery({ queryKey: ['time-blocks'], queryFn: listTimeBlocks, enabled: !!profile })

  const rows = appointments ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-extrabold tracking-tight">Agenda</h1>
        <p className="mt-1.5 text-sm text-muted">Visão do dia por profissional.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} w-auto`} />
        <select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="">Todos os profissionais</option>
          {(professionals ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {isPending && <p className="py-6 text-center text-muted">Carregando…</p>}
      {isError && (
        <div className="space-y-3 py-4 text-center">
          <p className={errorBoxClass}>Não foi possível carregar a agenda.</p>
          <button onClick={() => void refetch()} className={`${secondaryButtonClass} mx-auto max-w-[200px]`}>Tentar de novo</button>
        </div>
      )}

      {!isPending && !isError && rows.length === 0 && (
        <p className="py-6 text-center text-muted">Nenhum agendamento neste dia.</p>
      )}

      {rows.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
          {rows.map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b border-[#e8edef] py-3 last:border-0">
              <div>
                <div className="font-semibold">{a.patient?.full_name ?? '—'}</div>
                <div className="text-sm text-muted">{a.professional?.name} · {a.service?.name}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{new Date(a.starts_at).toLocaleTimeString('pt-BR', { timeZone: clinic?.timezone, hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-xs text-muted">{a.status}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {blocks && blocks.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-bold">Bloqueios do período</h2>
          {blocks
            .filter((b) => new Date(b.starts_at) <= new Date(dateTo) && new Date(b.ends_at) >= new Date(dateFrom))
            .map((b) => (
              <div key={b.id} className="text-sm text-muted">
                {b.reason || 'Bloqueio'} — {new Date(b.starts_at).toLocaleString('pt-BR')} a {new Date(b.ends_at).toLocaleString('pt-BR')}
              </div>
            ))}
        </section>
      )}
    </div>
  )
}