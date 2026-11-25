import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { Drawer } from '@/components/Drawer'
import { errorBoxClass, inputClass, secondaryButtonClass } from '@/components/styles'
import { listPatients, deletePatient } from './api'
import { PatientForm } from './PatientForm'
import type { Patient } from './api'

export default function PatientsPage() {
  const { profile } = useAuth()
  const canEdit = profile?.role === 'admin' || profile?.role === 'receptionist'

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Patient | 'new' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => listPatients(search),
    enabled: !!profile,
  })

  const patients = data ?? []

  function handleSaved(message: string) {
    setEditing(null)
    setNotice(message)
    window.setTimeout(() => setNotice(null), 4000)
    refetch()
  }

  async function handleDelete(p: Patient) {
    if (!window.confirm(`Excluir paciente ${p.full_name}?`)) return
    setActionError(null)
    try {
      await deletePatient(p.id)
      await refetch()
      setNotice('Paciente excluído.')
      window.setTimeout(() => setNotice(null), 4000)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Não foi possível excluir.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-tight">Pacientes</h1>
          <p className="mt-1.5 text-sm text-muted">Cadastro e histórico (sem prontuário clínico).</p>
        </div>
        {canEdit && (
          <button onClick={() => setEditing('new')} className="h-[46px] rounded-[10px] bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">
            + Novo paciente
          </button>
        )}
      </div>

      {notice && <p role="status" className="rounded-[10px] bg-confirmed-bg px-3.5 py-2.5 text-sm font-medium text-confirmed-fg">{notice}</p>}
      {actionError && <p role="alert" className={errorBoxClass}>{actionError}</p>}

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <input type="search" placeholder="Buscar por nome" value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass} />

        {isPending && <p className="py-6 text-center text-muted">Carregando…</p>}
        {isError && (
          <div className="space-y-3 py-4 text-center">
            <p className={errorBoxClass}>Não foi possível carregar.</p>
            <button onClick={() => void refetch()} className={`${secondaryButtonClass} mx-auto max-w-[200px]`}>Tentar de novo</button>
          </div>
        )}

        {!isPending && !isError && patients.length === 0 && (
          <p className="py-6 text-center text-muted">Nenhum paciente cadastrado.</p>
        )}

        {patients.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[minmax(0,2fr)_140px_200px_120px] items-center gap-3 border-b border-line px-3 py-2.5 text-xs font-semibold text-muted">
                <div>NOME</div>
                <div>TELEFONE</div>
                <div>E-MAIL</div>
                <div />
              </div>
              {patients.map((p) => (
                <div key={p.id} className="grid grid-cols-[minmax(0,2fr)_140px_200px_120px] items-center gap-3 border-b border-[#e8edef] px-3 py-3.5">
                  <div className="font-semibold truncate">{p.full_name}</div>
                  <div className="text-sm">{p.phone}</div>
                  <div className="text-sm truncate">{p.email ?? '—'}</div>
                  <div className="flex gap-2 justify-end">
                    {canEdit && (
                      <>
                        <button onClick={() => setEditing(p)} className="h-8 rounded-lg border border-[#bfcbce] bg-white px-2 text-[12px] font-semibold hover:bg-surface">Editar</button>
                        <button onClick={() => void handleDelete(p)} className="h-8 rounded-lg border border-[#bfcbce] bg-white px-2 text-[12px] font-semibold hover:bg-surface">Excluir</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {editing && (
        <Drawer title={editing === 'new' ? 'Novo paciente' : 'Editar paciente'} onClose={() => setEditing(null)}>
          <PatientForm
            patient={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={handleSaved}
          />
        </Drawer>
      )}
    </div>
  )
}