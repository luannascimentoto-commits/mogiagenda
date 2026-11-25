import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { errorBoxClass, secondaryButtonClass } from '@/components/styles'
import { getAppointmentByToken, cancelAppointmentByToken } from './api'

export default function AppointmentPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    getAppointmentByToken(token)
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError('Agendamento não encontrado.'); setLoading(false) })
  }, [token])

  async function cancel() {
    if (!token) return
    if (!window.confirm('Deseja cancelar este agendamento?')) return
    setCancelling(true)
    try {
      await cancelAppointmentByToken(token)
      const d = await getAppointmentByToken(token)
      setData(d)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível cancelar.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted">Carregando…</p></div>
  if (error || !data) return <div className="flex min-h-screen items-center justify-center"><p className={errorBoxClass}>{error ?? 'Não encontrado.'}</p></div>

  const tz = data.timezone
  const fmt = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: tz, dateStyle: 'full', timeStyle: 'short' }).format(new Date(iso))

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-xl p-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">{data.clinic_name}</h1>
        <section className="mt-6 space-y-3 rounded-2xl border border-line bg-white p-5">
          <Row label="Serviço" value={data.service} />
          <Row label="Profissional" value={data.professional} />
          <Row label="Data e hora" value={`${fmt(data.starts_at)} — ${new Date(data.ends_at).toLocaleTimeString('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit' })}`} />
          <Row label="Status" value={data.status} />
          {data.address_line && <Row label="Endereço" value={`${data.address_line}${data.city ? ', ' + data.city : ''}`} />}
          {data.phone && <Row label="Telefone" value={data.phone} />}
          {data.whatsapp && <Row label="WhatsApp" value={data.whatsapp} />}
        </section>

        {data.can_cancel && (
          <button onClick={cancel} disabled={cancelling} className={`${secondaryButtonClass} mt-6`}>
            {cancelling ? 'Cancelando…' : 'Cancelar agendamento'}
          </button>
        )}
        {!data.can_cancel && data.status !== 'cancelled' && (
          <p className="mt-6 text-sm text-muted">Este agendamento não pode mais ser cancelado.</p>
        )}
        {data.status === 'cancelled' && (
          <p className="mt-6 text-sm text-muted">Agendamento cancelado.</p>
        )}
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line pb-2 last:border-0">
      <span className="text-sm font-semibold text-muted">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  )
}