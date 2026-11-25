import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')

  const body = await req.json().catch(() => ({}))
  const {
    slug, professional_id, service_id, start, full_name, phone, email,
    consent, consent_version, turnstile_token,
  } = body

  // Valida Turnstile se configurado.
  if (turnstileSecret) {
    if (!turnstile_token) return json({ error: 'turnstile_required' }, 400)
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: turnstile_token,
      }),
    })
    const verifyData = await verifyRes.json()
    if (!verifyData.success) return json({ error: 'turnstile_failed' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { data, error } = await admin.rpc('create_public_appointment', {
    p_slug: slug,
    p_professional_id: professional_id,
    p_service_id: service_id,
    p_start: start,
    p_full_name: full_name,
    p_phone: phone,
    p_email: email,
    p_consent: consent,
    p_consent_version: consent_version ?? 'v1',
  })
  if (error) return json({ error: error.message }, 400)
  return json(data)
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}