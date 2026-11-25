import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { Drawer } from '@/components/Drawer'
import { errorBoxClass, inputClass, secondaryButtonClass } from '@/components/styles'
import { formatDuration, formatPrice } from '@/lib/format'
import { normalize } from '@/lib/normalize'
import { listServices } from './api'
import { ServiceForm } from './ServiceForm'
import type { Service } from './types'

type StatusFilter = 'all' | 'active' | 'inactive'

const rowGrid = 'grid grid-cols-[minmax(0,2.4fr)_90px_110px_110px_84px] items-center gap-3'

export default function ServicesPage() {
  const { profile } = useAuth()
  const canEdit = profile?.role === 'admin'

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [editing, setEditing] = useState<Service | 'new' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['services', profile?.clinic_id],
    queryFn: listServices,
    enabled: !!profile,
  })

  const services = data ?? []
  const term = normalize(search.trim())
  const filtered = services.filter((s) => {
    if (status === 'active' && !s.is_active) return false
    if (status === 'inactive' && s.is_active) return false
    return term === '' || normalize(s.name).includes(term)
  })

  function handleSaved(message: string) {
    setEditing(null)
    setNotice(message)
    window.setTimeout(() => setNotice(null), 4000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-tight">Serviços</h1>
          <p className="mt-1.5 text-sm text-muted">
            {canEdit ? 'O que a clínica oferece aos pacientes.' : 'Somente leitura: apenas o administrador altera os serviços.'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setEditing('new')}
            className="h-[46px] rounded-[10px] bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700"
          >
            + Novo serviço
          </button>
        )}
      </div>

      {notice && (
        <p role="status" className="rounded-[10px] bg-confirmed-bg px-3.5 py-2.5 text-sm font-medium text-confirmed-fg">
          {notice}
        </p>
      )}

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="busca" className="sr-only">Buscar serviço</label>
            <input
              id="busca"
              type="search"
              placeholder="Buscar por nome"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="situacao" className="sr-only">Situação</label>
            <select
              id="situacao"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className={`${inputClass} w-auto`}
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>

        {isPending && <p className="py-6 text-center text-muted">Carregando serviços…</p>}

        {isError && (
          <div className="space-y-3 py-4 text-center">
            <p className={errorBoxClass}>Não foi possível carregar os serviços.</p>
            <button onClick={() => void refetch()} className={`${secondaryButtonClass} mx-auto max-w-[200px]`}>
              Tentar de novo
            </button>
          </div>
        )}

        {!isPending && !isError && services.length === 0 && (
          <p className="py-6 text-center text-muted">
            Nenhum serviço cadastrado ainda.{canEdit ? ' Clique em “+ Novo serviço” para começar.' : ''}
          </p>
        )}

        {!isPending && !isError && services.length > 0 && filtered.length === 0 && (
          <p className="py-6 text-center text-muted">Nenhum serviço encontrado com esses filtros.</p>
        )}

        {filtered.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className={`${rowGrid} border-b border-line px-3 py-2.5 text-xs font-semibold text-muted`}>
                <div>SERVIÇO</div>
                <div>DURAÇÃO</div>
                <div>VALOR</div>
                <div>SITUAÇÃO</div>
                <div />
              </div>
              {filtered.map((s) => (
                <div key={s.id} className={`${rowGrid} border-b border-[#e8edef] px-3 py-3.5`}>
                  <div className="min-w-0">
                    <div className="font-semibold">{s.name}</div>
                    {s.description && <div className="truncate text-[13px] text-muted">{s.description}</div>}
                  </div>
                  <div className="text-sm">{formatDuration(s.duration_minutes)}</div>
                  <div className="text-sm">{formatPrice(s.price_cents)}</div>
                  <div>
                    <span
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                        s.is_active ? 'bg-confirmed-bg text-confirmed-fg' : 'bg-completed-bg text-completed-fg'
                      }`}
                    >
                      {s.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="text-right">
                    {canEdit && (
                      <button
                        onClick={() => setEditing(s)}
                        aria-label={`Editar ${s.name}`}
                        className="h-9 rounded-lg border border-[#bfcbce] bg-white px-3.5 text-[13px] font-semibold hover:bg-surface"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted">
          Serviços inativos deixam de aparecer na página de agendamento, mas continuam no histórico.
        </p>
      </section>

      {editing && (
        <Drawer title={editing === 'new' ? 'Novo serviço' : 'Editar serviço'} onClose={() => setEditing(null)}>
          <ServiceForm
            key={editing === 'new' ? 'new' : editing.id}
            service={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={handleSaved}
          />
        </Drawer>
      )}
    </div>
  )
}
