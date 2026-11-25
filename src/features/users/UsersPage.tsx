import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { Drawer } from '@/components/Drawer'
import { errorBoxClass, secondaryButtonClass } from '@/components/styles'
import { listUsers, setUserActive, sendResetPassword } from './api'
import { UserForm } from './UserForm'
import type { UserRow } from './schema'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  receptionist: 'Recepção',
  professional: 'Profissional',
}

export default function UsersPage() {
  const { profile } = useAuth()
  const [editing, setEditing] = useState<'new' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['users', profile?.clinic_id],
    queryFn: listUsers,
    enabled: !!profile,
  })

  const users = data ?? []

  function handleSaved(message: string) {
    setEditing(null)
    setNotice(message)
    window.setTimeout(() => setNotice(null), 4000)
  }

  async function handleToggle(u: UserRow) {
    setActionError(null)
    try {
      await setUserActive(u.id, !u.is_active)
      await refetch()
      setNotice(u.is_active ? 'Usuário desativado.' : 'Usuário ativado.')
      window.setTimeout(() => setNotice(null), 4000)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Não foi possível alterar.')
    }
  }

  async function handleReset(u: UserRow) {
    setActionError(null)
    let email = u.email
    if (!email) {
      const typed = window.prompt('Informe o e-mail do usuário para enviar o link de redefinição:')
      if (!typed) return
      email = typed
    }
    try {
      await sendResetPassword(email)
      setNotice('Link de redefinição enviado por e-mail.')
      window.setTimeout(() => setNotice(null), 4000)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Não foi possível enviar.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-tight">Usuários</h1>
          <p className="mt-1.5 text-sm text-muted">Gerencie os acessos da clínica.</p>
        </div>
        <button onClick={() => setEditing('new')} className="h-[46px] rounded-[10px] bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">
          + Novo usuário
        </button>
      </div>

      {notice && (
        <p role="status" className="rounded-[10px] bg-confirmed-bg px-3.5 py-2.5 text-sm font-medium text-confirmed-fg">{notice}</p>
      )}
      {actionError && <p role="alert" className={errorBoxClass}>{actionError}</p>}

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        {isPending && <p className="py-6 text-center text-muted">Carregando usuários…</p>}
        {isError && (
          <div className="space-y-3 py-4 text-center">
            <p className={errorBoxClass}>Não foi possível carregar os usuários.</p>
            <button onClick={() => void refetch()} className={`${secondaryButtonClass} mx-auto max-w-[200px]`}>Tentar de novo</button>
          </div>
        )}

        {!isPending && !isError && users.length === 0 && (
          <p className="py-6 text-center text-muted">Nenhum usuário cadastrado.</p>
        )}

        {users.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[minmax(0,2fr)_140px_100px_200px] items-center gap-3 border-b border-line px-3 py-2.5 text-xs font-semibold text-muted">
                <div>NOME</div>
                <div>PAPEL</div>
                <div>SITUAÇÃO</div>
                <div />
              </div>
              {users.map((u) => (
                <div key={u.id} className="grid grid-cols-[minmax(0,2fr)_140px_100px_200px] items-center gap-3 border-b border-[#e8edef] px-3 py-3.5">
                  <div className="font-semibold truncate">{u.full_name}</div>
                  <div className="text-sm">{roleLabels[u.role]}</div>
                  <div>
                    <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold ${u.is_active ? 'bg-confirmed-bg text-confirmed-fg' : 'bg-completed-bg text-completed-fg'}`}>
                      {u.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => void handleToggle(u)} className="h-9 rounded-lg border border-[#bfcbce] bg-white px-3 text-[13px] font-semibold hover:bg-surface">
                      {u.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => void handleReset(u)} className="h-9 rounded-lg border border-[#bfcbce] bg-white px-3 text-[13px] font-semibold hover:bg-surface">
                      Redefinir senha
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {editing === 'new' && (
        <Drawer title="Novo usuário" onClose={() => setEditing(null)}>
          <UserForm onCancel={() => setEditing(null)} onSaved={handleSaved} />
        </Drawer>
      )}
    </div>
  )
}