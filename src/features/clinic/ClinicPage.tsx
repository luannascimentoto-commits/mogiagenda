import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { errorBoxClass, secondaryButtonClass } from '@/components/styles'
import { getClinic, listClinicHours } from './api'
import { ClinicForm } from './ClinicForm'
import { ClinicHoursEditor } from './ClinicHoursEditor'
import { LogoUpload } from './LogoUpload'

export default function ClinicPage() {
  const { profile } = useAuth()
  const [notice, setNotice] = useState<string | null>(null)

  const { data: clinic, isPending, isError, refetch } = useQuery({
    queryKey: ['clinic'],
    queryFn: getClinic,
    enabled: !!profile,
  })

  const { data: hours } = useQuery({
    queryKey: ['clinic-hours'],
    queryFn: listClinicHours,
    enabled: !!profile,
  })

  function handleSaved(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 4000)
  }

  if (isPending) return <p className="py-6 text-center text-muted">Carregando clínica…</p>
  if (isError || !clinic) {
    return (
      <div className="space-y-3 py-4 text-center">
        <p className={errorBoxClass}>Não foi possível carregar os dados da clínica.</p>
        <button onClick={() => void refetch()} className={`${secondaryButtonClass} mx-auto max-w-[200px]`}>
          Tentar de novo
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-extrabold tracking-tight">Clínica</h1>
        <p className="mt-1.5 text-sm text-muted">Configurações da clínica e regras de agendamento.</p>
      </div>

      {notice && (
        <p role="status" className="rounded-[10px] bg-confirmed-bg px-3.5 py-2.5 text-sm font-medium text-confirmed-fg">
          {notice}
        </p>
      )}

      <LogoUpload clinicId={clinic.id} logoUrl={clinic.logo_url} onSaved={handleSaved} />
      <ClinicForm clinic={clinic} onSaved={handleSaved} />
      <ClinicHoursEditor clinicId={clinic.id} initial={hours ?? []} onSaved={handleSaved} />
    </div>
  )
}