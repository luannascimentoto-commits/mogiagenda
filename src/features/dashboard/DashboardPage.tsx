import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { errorBoxClass, secondaryButtonClass } from '@/components/styles'
import { getDashboardStats } from './api'
import { getClinic } from '@/features/clinic/api'

const statusLabels: Record<string, string> = {
  pending: 'Pendentes',
  confirmed: 'Confirmados',
  completed: 'Concluídos',
  cancelled: 'Cancelados',
  no_show: 'Faltas',
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [copied, setCopied] = useState(false)
  const { data: clinic } = useQuery({ queryKey: ['clinic'], queryFn: getClinic, enabled: !!profile })
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['dashboard', profile?.clinic_id, profile?.id],
    queryFn: getDashboardStats,
    enabled: !!profile,
  })

  if (isPending) return <p className="py-6 text-center text-muted">Carregando painel…</p>
  if (isError || !data) {
    return (
      <div className="space-y-3 py-4 text-center">
        <p className={errorBoxClass}>Não foi possível carregar o painel.</p>
        <button onClick={() => void refetch()} className={`${secondaryButtonClass} mx-auto max-w-[200px]`}>Tentar de novo</button>
      </div>
    )
  }

  const tz = data.timezone

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-extrabold tracking-tight">Painel</h1>
        <p className="mt-1.5 text-sm text-muted">
          {profile?.role === 'professional' ? 'Seus números.' : 'Visão da clínica.'}
        </p>
      </div>

      {clinic && (
        <section className="space-y-2 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-bold">Link de agendamento</h2>
          <p className="text-sm text-muted">Compartilhe com seus pacientes para agendarem online.</p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-surface px-3 py-2 text-sm">{window.location.origin}/c/{clinic.slug}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/c/${clinic.slug}`)
                setCopied(true)
                window.setTimeout(() => setCopied(false), 2000)
              }}
              className={`${secondaryButtonClass} max-w-[160px]`}
            >
              {copied ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Hoje</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Card label="Total" value={data.today.total} />
          <Card label="Pendentes" value={data.today.pending} />
          <Card label="Confirmados" value={data.today.confirmed} />
          <Card label="Concluídos" value={data.today.completed} />
          <Card label="Cancelados" value={data.today.cancelled} />
          <Card label="Faltas" value={data.today.no_show} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Próximos 7 dias</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Card label="Total" value={data.week.total} />
          <Card label="Pendentes" value={data.week.pending} />
          <Card label="Confirmados" value={data.week.confirmed} />
          <Card label="Concluídos" value={data.week.completed} />
          <Card label="Cancelados" value={data.week.cancelled} />
          <Card label="Faltas" value={data.week.no_show} />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-bold">Próximos atendimentos</h2>
        {data.upcoming.length === 0 && <p className="text-muted">Nenhum atendimento futuro.</p>}
        {data.upcoming.map((u) => (
          <div key={u.id} className="flex items-center justify-between border-b border-[#e8edef] py-3 last:border-0">
            <div>
              <div className="font-semibold">{u.patient}</div>
              <div className="text-sm text-muted">{u.professional} · {u.service}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{new Date(u.starts_at).toLocaleString('pt-BR', { timeZone: tz, dateStyle: 'short', timeStyle: 'short' })}</div>
              <div className="text-xs text-muted">{statusLabels[u.status] ?? u.status}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 text-center">
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs font-semibold text-muted">{label}</div>
    </div>
  )
}