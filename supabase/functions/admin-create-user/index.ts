import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, corsHeaders)

  const authHeader = req.headers.get('Authorization') ?? ''
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Cliente do chamador, para validar o JWT.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: 'unauthorized' }, 401)

  const { data: profile } = await userClient
    .from('profiles')
    .select('clinic_id, role, is_active')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || !profile.is_active || profile.role !== 'admin') return json({ error: 'forbidden' }, 403)

  const body = await req.json().catch(() => ({}))
  const { email, full_name, role } = body as { email?: string; full_name?: string; role?: string }
  if (!email || !full_name || !role) return json({ error: 'missing_fields' }, 400)
  if (!['admin', 'receptionist', 'professional'].includes(role)) return json({ error: 'invalid_role' }, 400)

  // Cliente admin (service role) — nunca exposto ao navegador.
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: crypto.randomUUID(),
  })
  if (createErr || !created?.user) return json({ error: createErr?.message ?? 'create_failed' }, 400)

  const { error: profErr } = await admin.from('profiles').insert({
    id: created.user.id,
    clinic_id: profile.clinic_id,
    full_name,
    role,
    is_active: true,
    email,
  })
  if (profErr) {
    await admin.auth.admin.deleteUser(created.user.id)
    return json({ error: profErr.message }, 400)
  }

  // Envia link de definição de senha.
  await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${Deno.env.get('SITE_URL') ?? ''}/redefinir-senha` },
  })

  return json({ ok: true })
})

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...extraHeaders },
  })
}