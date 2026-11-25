import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { Drawer } from '@/components/Drawer'
import { errorBoxClass, inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/styles'
import { listAppointments, updateAppointmentStatus, rescheduleAppointment } from './api'
import { listProfessionalsSimple2 } from './api'
import { AppointmentForm } from './AppointmentForm'
import type { AppointmentRow } from './api'

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
  no_show: 'Falta',
}

export default function AppointmentsPage() {
  const { profile } = useAuth()
  const canEdit = profile?.role === 'admin' || profile?.role === 'receptionist'

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [professionalId, setProfessionalId] = useState('')

  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<'new' | AppointmentRow | null>(null)
  const [rescheduling, setRescheduling] = useState<AppointmentRow | null>(null)
  const [newDate, setNewDate] = useState('')
  const [reschedError, setReschedError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const filters = {
    dateFrom: dateFrom ? new Date(dateFrom + 'T00:00:00').toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
    professionalId: professionalId || undefined,
    status,
    search,
  }

  const { data: professionals } = useQuery({ queryKey: ['professionals-simple'], queryFn: listProfessionalsSimple2, enabled: !!profile })

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => listAppointments(filters),
    enabled: !!profile,
  })

  const rows = data ?? []

  function handleSaved(message: string) {
    setEditing(null)
    setNotice(message)
    window.setTimeout(() => setNotice(null), 4000)
    refetch()
  }

  async function changeStatus(a: AppointmentRow, newStatus: AppointmentRow['status']) {
    setActionError(null)
    try {
      await updateAppointmentStatus(a.id, newStatus)
      await refetch()
      setNotice('Status atualizado.')
      window.setTimeout(() => setNotice(null), 4000)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Não foi possível alterar.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-tight">Agendamentos</h1>
          <p className="mt-1.5 text-sm text-muted">Lista de atendimentos.</p>
        </div>
        {canEdit && (
          <button onClick={() => setEditing('new')} className="h-[46px] rounded-[10px] bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">
            + Novo agendamento
          </button>
        )}
      </div>

      {notice && <p role="status" className="rounded-[10px] bg-confirmed-bg px-3.5 py-2.5 text-sm font-medium text-confirmed-fg">{notice}</p>}
      {actionError && <p role="alert" className={errorBoxClass}>{actionError}</p>}

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap gap-3">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClass} w-auto`} />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputClass} w-auto`} />
          <select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)} className={`${inputClass} w-auto`}>
            <option value="">Todos os profissionais</option>
            {(professionals ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} w-auto`}>
            <option value="all">Todos status</option>
            <option value="pending">Pendente</option>
            <option value="confirmed">Confirmado</option>
            <option value="completed">Concluído</option>
            <option value="no_show">Falta</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <input type="search" placeholder="Buscar paciente" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} min-w-[180px]`} />
        </div>

        {isPending && <p className="py-6 text-center text-muted">Carregando…</p>}
        {isError && (
          <div className="space-y-3 py-4 text-center">
            <p className={errorBoxClass}>Não foi possível carregar.</p>
            <button onClick={() => void refetch()} className={`${secondaryButtonClass} mx-auto max-w-[200px]`}>Tentar de novo</button>
          </div>
        )}

        {!isPending && !isError && rows.length === 0 && (
          <p className="py-6 text-center text-muted">Nenhum agendamento encontrado.</p>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[minmax(0,1.6fr)_120px_140px_110px_120px_200px] items-center gap-3 border-b border-line px-3 py-2.5 text-xs font-semibold text-muted">
                <div>PACIENTE</div>
                <div>DATA/HORA</div>
                <div>PROFISSIONAL</div>
                <div>SERVIÇO</div>
                <div>STATUS</div>
                <div />
              </div>
              {rows.map((a) => (
                <div key={a.id} className="grid grid-cols-[minmax(0,1.6fr)_120px_140px_110px_120px_200px] items-center gap-3 border-b border-[#e8edef] px-3 py-3.5">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{a.patient?.full_name ?? '—'}</div>
                    <div className="text-xs text-muted">{a.patient?.phone}</div>
                  </div>
                  <div className="text-sm">{new Date(a.starts_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                  <div className="text-sm truncate">{a.professional?.name ?? '—'}</div>
                  <div className="text-sm truncate">{a.service?.name ?? '—'}</div>
                  <div>
                    <span className="whitespace-nowrap rounded-full bg-surface px-3 py-1.5 text-[13px] font-semibold">{statusLabels[a.status]}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {canEdit && a.status === 'pending' && (
                      <button onClick={() => changeStatus(a, 'confirmed')} className="h-8 rounded-lg border border-[#bfcbce] bg-white px-2 text-[12px] font-semibold hover:bg-surface">Confirmar</button>
                    )}
                    {canEdit && (a.status === 'pending' || a.status === 'confirmed') && (
                      <>
                        <button onClick={() => { setRescheduling(a); setNewDate(a.starts_at.slice(0, 16)); setReschedError(null) }} className="h-8 rounded-lg border border-[#bfcbce] bg-white px-2 text-[12px] font-semibold hover:bg-surface">Reagendar</button>
                        <button onClick={() => changeStatus(a, 'completed')} className="h-8 rounded-lg border border-[#bfcbce] bg-white px-2 text-[12px] font-semibold hover:bg-surface">Concluir</button>
                        <button onClick={() => changeStatus(a, 'no_show')} className="h-8 rounded-lg border border-[#bfcbce] bg-white px-2 text-[12px] font-semibold hover:bg-surface">Falta</button>
                        <button onClick={() => changeStatus(a, 'cancelled')} className="h-8 rounded-lg border border-[#bfcbce] bg-white px-2 text-[12px] font-semibold hover:bg-surface">Cancelar</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {rescheduling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6">
            <h2 className="font-display text-lg font-bold">Reagendar</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Nova data e hora</label>
              <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className={inputClass} />
            </div>
            {reschedError && <p role="alert" className={errorBoxClass}>{reschedError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setRescheduling(null)} className={`${secondaryButtonClass} flex-1`}>Cancelar</button>
              <button
                onClick={async () => {
                  if (!rescheduling) return
                  setReschedError(null)
                  try {
                    const duration = rescheduling.service?.duration_minutes ?? 30
                    const iso = new Date(newDate).toISOString()
                    await rescheduleAppointment(rescheduling.id, iso, duration)
                    setRescheduling(null)
                    await refetch()
                    setNotice('Reagendado.')
                    window.setTimeout(() => setNotice(null), 4000)
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : ''
                    setReschedError(msg.includes('exclusion') || msg.includes('conflict') ? 'Conflito de horário.' : (msg || 'Não foi possível reagendar.'))
                  }
                }}
                className={`${primaryButtonClass} flex-1`}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <Drawer title={editing === 'new' ? 'Novo agendamento' : 'Editar agendamento'} onClose={() => setEditing(null)}>
          <AppointmentForm
            appointment={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={handleSaved}
          />
        </Drawer>
      )}
    </div>
  )
}