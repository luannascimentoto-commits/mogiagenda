import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { Drawer } from '@/components/Drawer'
import { errorBoxClass, secondaryButtonClass } from '@/components/styles'
import { listTimeBlocks, deleteTimeBlock } from './api'
import { BlockForm } from './BlockForm'
import { formatDateTime } from '@/lib/timezone'
import type { TimeBlock } from './schema'
import { getClinic } from '@/features/clinic/api'

export default function BlocksPage() {
  const { profile } = useAuth()
  const canEdit = profile?.role === 'admin' || profile?.role === 'receptionist'

  const { data: clinic } = useQuery({ queryKey: ['clinic'], queryFn: getClinic, enabled: !!profile })
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['time-blocks'], queryFn: listTimeBlocks, enabled: !!profile })

  const [editing, setEditing] = useState<TimeBlock | 'new' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const blocks = data ?? []

  function handleSaved(message: string) {
    setEditing(null)
    setNotice(message)
    window.setTimeout(() => setNotice(null), 4000)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir este bloqueio?')) return
    setDeleting(id)
    try {
      await deleteTimeBlock(id)
      await refetch()
      setNotice('Bloqueio excluído.')
      window.setTimeout(() => setNotice(null), 4000)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-tight">Bloqueios</h1>
          <p className="mt-1.5 text-sm text-muted">Folgas, feriados e indisponibilidades.</p>
        </div>
        {canEdit && (
          <button onClick={() => setEditing('new')} className="h-[46px] rounded-[10px] bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">
            + Novo bloqueio
          </button>
        )}
      </div>

      {notice && (
        <p role="status" className="rounded-[10px] bg-confirmed-bg px-3.5 py-2.5 text-sm font-medium text-confirmed-fg">{notice}</p>
      )}

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        {isPending && <p className="py-6 text-center text-muted">Carregando bloqueios…</p>}
        {isError && (
          <div className="space-y-3 py-4 text-center">
            <p className={errorBoxClass}>Não foi possível carregar os bloqueios.</p>
            <button onClick={() => void refetch()} className={`${secondaryButtonClass} mx-auto max-w-[200px]`}>Tentar de novo</button>
          </div>
        )}
        {!isPending && !isError && blocks.length === 0 && (
          <p className="py-6 text-center text-muted">Nenhum bloqueio cadastrado.</p>
        )}
        {blocks.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-[minmax(0,1.6fr)_160px_160px_120px_90px] items-center gap-3 border-b border-line px-3 py-2.5 text-xs font-semibold text-muted">
                <div>MOTIVO / ESCOPO</div>
                <div>INÍCIO</div>
                <div>FIM</div>
                <div>ESCOPO</div>
                <div />
              </div>
              {blocks.map((b) => (
                <div key={b.id} className="grid grid-cols-[minmax(0,1.6fr)_160px_160px_120px_90px] items-center gap-3 border-b border-[#e8edef] px-3 py-3.5">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{b.reason || '—'}</div>
                  </div>
                  <div className="text-sm">{clinic ? formatDateTime(b.starts_at, clinic.timezone) : new Date(b.starts_at).toLocaleString('pt-BR')}</div>
                  <div className="text-sm">{clinic ? formatDateTime(b.ends_at, clinic.timezone) : new Date(b.ends_at).toLocaleString('pt-BR')}</div>
                  <div className="text-sm">{b.professional_id ? 'Profissional' : 'Clínica inteira'}</div>
                  <div className="text-right">
                    {canEdit && (
                      <button onClick={() => void handleDelete(b.id)} disabled={deleting === b.id} className="h-9 rounded-lg border border-[#bfcbce] bg-white px-3.5 text-[13px] font-semibold hover:bg-surface">
                        {deleting === b.id ? '…' : 'Excluir'}
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
        <Drawer title="Novo bloqueio" onClose={() => setEditing(null)}>
          <BlockForm
            clinic={clinic!}
            professionals={[]}
            onCancel={() => setEditing(null)}
            onSaved={handleSaved}
          />
        </Drawer>
      )}
    </div>
  )
}