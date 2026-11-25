import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return json({ error: 'email_not_configured' }, 500)

  const body = await req.json().catch(() => ({}))
  const { type, to, clinic_name, service, professional, starts_at, timezone, cancel_url } = body

  if (!to || !type) return json({ error: 'missing_fields' }, 400)

  const subjectMap: Record<string, string> = {
    confirmation: `Agendamento confirmado — ${clinic_name}`,
    cancellation: `Agendamento cancelado — ${clinic_name}`,
    reminder: `Lembrete de agendamento — ${clinic_name}`,
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
      <h2 style="color:#0F766E">${clinic_name}</h2>
      <p>Olá,</p>
      <p>Seu agendamento de <strong>${service}</strong> com <strong>${professional}</strong> está
      ${type === 'confirmation' ? 'confirmado' : type === 'cancellation' ? 'cancelado' : 'agendado'}.</p>
      <p><strong>Data e hora:</strong> ${new Date(starts_at).toLocaleString('pt-BR', { timeZone: timezone })}</p>
      ${cancel_url ? `<p><a href="${cancel_url}">Gerenciar agendamento</a></p>` : ''}
      <p style="color:#55656D;font-size:12px">AgendaMogi</p>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('EMAIL_FROM') ?? 'AgendaMogi <noreply@agendamogi.com>',
      to: [to],
      subject: subjectMap[type] ?? 'Agendamento',
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return json({ error: err }, 500)
  }
  return json({ ok: true })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}