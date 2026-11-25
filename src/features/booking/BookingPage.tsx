import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { errorBoxClass, inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/styles'
import { getPublicClinic, type PublicClinic } from './api'
import { PrivacyModal } from './PrivacyModal'
import { Turnstile } from './Turnstile'
import { supabase } from '@/lib/supabase'

type Step = 0 | 1 | 2 | 3 | 4 | 5

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const [clinic, setClinic] = useState<PublicClinic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // seleções
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [professionalId, setProfessionalId] = useState<string | null>(null)
  const [date, setDate] = useState<string | null>(null) // YYYY-MM-DD
  const [slotStart, setSlotStart] = useState<string | null>(null) // ISO UTC
  const [step, setStep] = useState<Step>(0)

  // dados do paciente
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ cancel_token: string; status: string } | null>(null)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getPublicClinic(slug)
      .then((c) => { setClinic(c); setLoading(false) })
      .catch(() => { setError('Clínica não encontrada.'); setLoading(false) })
  }, [slug])

  // aplicar tema da clínica
  useEffect(() => {
    if (!clinic) return
    // cor principal fixa do projeto (verde-petróleo); logo via img
    document.title = `${clinic.name} — Agendar`
  }, [clinic])

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted">Carregando…</p></div>
  if (error || !clinic) return <div className="flex min-h-screen items-center justify-center"><p className={errorBoxClass}>{error ?? 'Clínica não encontrada.'}</p></div>

  const service = clinic.services.find((s) => s.id === serviceId) ?? null
  const professional = clinic.professionals.find((p) => p.id === professionalId) ?? null

  // profissionais que realizam o serviço selecionado
  const profsForService = service
    ? clinic.professionals.filter((p) => p.services.some((ps) => ps.service_id === service.id))
    : clinic.professionals

  async function submit() {
    if (!slug || !serviceId || !professionalId || !slotStart) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const r = await (await import('./api')).createPublicAppointment({
        slug,
        professional_id: professionalId,
        service_id: serviceId,
        start: slotStart,
        full_name: fullName,
        phone,
        email,
        consent,
        consent_version: 'v1',
        turnstile_token: turnstileToken,
      })
      setResult({ cancel_token: r.cancel_token, status: r.status })
      // envio de e-mail de confirmação (fire-and-forget)
      void supabase.functions.invoke('send-appointment-email', {
        body: {
          type: r.status === 'confirmed' ? 'confirmation' : 'confirmation',
          to: email,
          clinic_name: clinic!.name,
          service: service?.name,
          professional: professional?.name,
          starts_at: r.starts_at,
          timezone: clinic!.timezone,
          cancel_url: `${window.location.origin}/c/${slug}/agendamento/${r.cancel_token}`,
        },
      })
      setStep(5)
    } catch (e: any) {
      const msg = e?.message ?? ''
      const map: Record<string, string> = {
        slot_unavailable: 'Este horário não está mais disponível. Escolha outro.',
        booking_limit: 'Você já tem 3 agendamentos futuros. Cancele um para agendar outro.',
        invalid_phone: 'Telefone inválido. Use DDD + número.',
        invalid_email: 'E-mail inválido.',
        invalid_name: 'Informe seu nome completo.',
        consent_required: 'É necessário aceitar a política de privacidade.',
        clinic_not_found: 'Clínica não encontrada.',
      }
      setSubmitError(map[msg] ?? 'Não foi possível concluir o agendamento. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <header className="flex items-center justify-center gap-3 border-b border-line bg-white p-4">
        {clinic.logo_url && <img src={clinic.logo_url} alt={clinic.name} className="h-10 w-10 rounded-xl object-cover" />}
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight">{clinic.name}</h1>
          {clinic.city && <p className="text-xs text-muted">{clinic.city}{clinic.state ? ` - ${clinic.state}` : ''}</p>}
        </div>
      </header>

      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        {step < 5 && (
          <nav className="mb-6 flex flex-wrap gap-2 text-xs">
            {['Serviço', 'Profissional', 'Data', 'Horário', 'Dados'].map((label, i) => (
              <span key={label} className={`rounded-full px-3 py-1.5 font-semibold ${step === i ? 'bg-brand-600 text-white' : 'bg-white text-muted'}`}>
                {i + 1}. {label}
              </span>
            ))}
          </nav>
        )}

        {step === 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold">Escolha o serviço</h2>
            {clinic.services.length === 0 && <p className="text-muted">Nenhum serviço disponível.</p>}
            <div className="space-y-2">
              {clinic.services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setServiceId(s.id); setProfessionalId(null); setDate(null); setSlotStart(null); setStep(1) }}
                  className="w-full rounded-xl border border-line bg-white p-4 text-left hover:border-brand-600"
                >
                  <div className="font-semibold">{s.name}</div>
                  {s.description && <div className="text-sm text-muted">{s.description}</div>}
                  <div className="mt-1 text-xs text-muted">{s.duration_minutes} min {s.price_cents != null ? `· R$ ${(s.price_cents/100).toFixed(2)}` : ''}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold">Escolha o profissional</h2>
            <div className="space-y-2">
              {profsForService.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setProfessionalId(p.id); setDate(null); setSlotStart(null); setStep(2) }}
                  className="flex w-full items-center gap-3 rounded-xl border border-line bg-white p-4 text-left hover:border-brand-600"
                >
                  {p.photo_url ? <img src={p.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="h-12 w-12 rounded-full bg-surface" />}
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    {p.specialty && <div className="text-sm text-muted">{p.specialty}</div>}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(0)} className={`${secondaryButtonClass} max-w-[200px]`}>Voltar</button>
          </section>
        )}

        {step === 2 && serviceId && professionalId && (
          <DateStep
            slug={slug!}
            professionalId={professionalId}
            serviceId={serviceId}
            onPick={(d: string) => { setDate(d); setSlotStart(null); setStep(3) }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && serviceId && professionalId && date && (
          <SlotStep
            clinic={clinic}
            slug={slug!}
            professionalId={professionalId}
            serviceId={serviceId}
            date={date}
            onPick={(iso: string) => { setSlotStart(iso); setStep(4) }}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold">Seus dados</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Nome completo</label>
              <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Telefone (DDD + número)</label>
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11999999999" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">E-mail</label>
              <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex items-start gap-3">
              <input id="consent" type="checkbox" className="mt-1 h-5 w-5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <label htmlFor="consent" className="text-sm">
                Li e aceito a <button type="button" onClick={() => setPrivacyOpen(true)} className="text-brand-600 underline">política de privacidade</button>.
              </label>
            </div>
            {submitError && <p role="alert" className={errorBoxClass}>{submitError}</p>}
            {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
              <Turnstile siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} onToken={setTurnstileToken} />
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className={`${secondaryButtonClass} flex-1`}>Voltar</button>
              <button onClick={submit} disabled={submitting} className={`${primaryButtonClass} flex-1`}>
                {submitting ? 'Agendando…' : 'Confirmar agendamento'}
              </button>
            </div>
          </section>
        )}

        {step === 5 && result && (
          <section className="space-y-4 text-center">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Agendamento solicitado!</h2>
            <p className="text-muted">
              Status: <strong>{result.status === 'confirmed' ? 'Confirmado' : 'Pendente de confirmação'}</strong>.
            </p>
            <p className="text-sm text-muted">
              Guarde este link para consultar ou cancelar: <br />
              <code className="break-all text-xs">{window.location.origin}/c/{slug}/agendamento/{result.cancel_token}</code>
            </p>
            <a href={`/c/${slug}/agendamento/${result.cancel_token}`} className={`${primaryButtonClass} inline-block max-w-[260px]`}>
              Ver meu agendamento
            </a>
          </section>
        )}
      </div>
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </main>
  )
}

// ---- DateStep ----
function DateStep({ slug, professionalId, serviceId, onPick, onBack }: any) {
  const [available, setAvailable] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const days = await (await import('./api')).getAvailableDays(slug, professionalId, serviceId)
      setAvailable(days)
      setLoading(false)
    })()
  }, [slug, professionalId, serviceId])

  // gerar calendário do mês atual
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: (Date | null)[] = []
  for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))

  const availableSet = new Set(available)

  function fmt(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-bold">Escolha a data</h2>
      {loading && <p className="text-muted">Carregando disponibilidade…</p>}
      <div className="grid grid-cols-7 gap-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((w, i) => (
          <div key={i} className="text-center text-xs font-semibold text-muted">{w}</div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={i} />
          const key = fmt(d)
          const isAvail = availableSet.has(key)
          const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate())
          return (
            <button
              key={key}
              disabled={!isAvail || isPast}
              onClick={() => onPick(key)}
              className={`h-10 rounded-lg text-sm font-semibold ${
                isAvail && !isPast ? 'bg-white border border-line hover:border-brand-600' : 'bg-surface text-muted cursor-not-allowed'
              }`}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
      <button onClick={onBack} className={`${secondaryButtonClass} max-w-[200px]`}>Voltar</button>
    </section>
  )
}

// ---- SlotStep ----
function SlotStep({ clinic, slug, professionalId, serviceId, date, onPick, onBack }: any) {
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const s = await (await import('./api')).getAvailableSlots(slug, professionalId, serviceId, date)
      setSlots(s)
      setLoading(false)
    })()
  }, [slug, professionalId, serviceId, date])

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-bold">Escolha o horário</h2>
      <p className="text-sm text-muted">{date.split('-').reverse().join('/')}</p>
      {loading && <p className="text-muted">Carregando horários…</p>}
      {!loading && slots.length === 0 && <p className="text-muted">Nenhum horário disponível neste dia.</p>}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((s) => (
          <button
            key={s.start}
            onClick={() => onPick(s.start)}
            className="h-11 rounded-lg border border-line bg-white text-sm font-semibold hover:border-brand-600"
          >
            {new Date(s.start).toLocaleTimeString('pt-BR', { timeZone: clinic.timezone, hour: '2-digit', minute: '2-digit' })}
          </button>
        ))}
      </div>
      <button onClick={onBack} className={`${secondaryButtonClass} max-w-[200px]`}>Voltar</button>
    </section>
  )
}