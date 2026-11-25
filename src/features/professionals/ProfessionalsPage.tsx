import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { Drawer } from '@/components/Drawer'
import { errorBoxClass, inputClass, secondaryButtonClass } from '@/components/styles'
import { listProfessionals } from './api'
import { ProfessionalForm } from './ProfessionalForm'
import type { Professional } from './schema'

export default function ProfessionalsPage() {
  const { profile } = useAuth()
  const canEdit = profile?.role === 'admin'

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Professional | 'new' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['professionals', profile?.clinic_id],
    queryFn: listProfessionals,
    enabled: !!profile,
  })

  const professionals = data ?? []
  const filtered = professionals.filter((p) =>
    search.trim() === '' ? true : p.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  function handleSaved(message: string) {
    setEditing(null)
    setNotice(message)
    window.setTimeout(() => setNotice(null), 4000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-tight">Profissionais</h1>
          <p className="mt-1.5 text-sm text-muted">
            {canEdit ? 'Equipe que atende na clínica.' : 'Somente leitura: apenas o administrador altera.'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setEditing('new')}
            className="h-[46px] rounded-[10px] bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700"
          >
            + Novo profissional
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
            <label htmlFor="busca" className="sr-only">Buscar profissional</label>
            <input
              id="busca"
              type="search"
              placeholder="Buscar por nome"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {isPending && <p className="py-6 text-center text-muted">Carregando profissionais…</p>}

        {isError && (
          <div className="space-y-3 py-4 text-center">
            <p className={errorBoxClass}>Não foi possível carregar os profissionais.</p>
            <button onClick={() => void refetch()} className={`${secondaryButtonClass} mx-auto max-w-[200px]`}>
              Tentar de novo
            </button>
          </div>
        )}

        {!isPending && !isError && professionals.length === 0 && (
          <p className="py-6 text-center text-muted">
            Nenhum profissional cadastrado ainda.{canEdit ? ' Clique em “+ Novo profissional” para começar.' : ''}
          </p>
        )}

        {filtered.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[minmax(0,2fr)_140px_120px_90px] items-center gap-3 border-b border-line px-3 py-2.5 text-xs font-semibold text-muted">
                <div>PROFISSIONAL</div>
                <div>ESPECIALIDADE</div>
                <div>SITUAÇÃO</div>
                <div />
              </div>
              {filtered.map((p) => (
                <div key={p.id} className="grid grid-cols-[minmax(0,2fr)_140px_120px_90px] items-center gap-3 border-b border-[#e8edef] px-3 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-muted text-xs">—</div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{p.name}</div>
                    </div>
                  </div>
                  <div className="text-sm truncate">{p.specialty ?? '—'}</div>
                  <div>
                    <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold ${p.is_active ? 'bg-confirmed-bg text-confirmed-fg' : 'bg-completed-bg text-completed-fg'}`}>
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="text-right">
                    {canEdit && (
                      <button onClick={() => setEditing(p)} aria-label={`Editar ${p.name}`} className="h-9 rounded-lg border border-[#bfcbce] bg-white px-3.5 text-[13px] font-semibold hover:bg-surface">
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {editing && (
        <Drawer title={editing === 'new' ? 'Novo profissional' : 'Editar profissional'} onClose={() => setEditing(null)}>
          <ProfessionalForm
            key={editing === 'new' ? 'new' : editing.id}
            professional={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={handleSaved}
          />
        </Drawer>
      )}
    </div>
  )
}